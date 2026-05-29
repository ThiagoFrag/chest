import { json, error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireServerPermission } from '$lib/auth/require-server-permission';
import { db, schema } from '$lib/db';
import { docker } from '$lib/docker/client';
import {
  detectMap,
  installBlueMap,
  setMapMetadata,
  getMapStatus,
  allocateMapPort
} from '$lib/mc/world-map';
import { loaderSupportsBlueMap, type LoaderType } from '$lib/mc/world-map-types';
import {
  removeBlueMapSidecar,
  stopBlueMapSidecar,
  resolveServerDataMount
} from '$lib/mc/world-map-sidecar';
import { getSetting } from '$lib/settings';
import { logAudit } from '$lib/audit';
import type { RequestHandler } from './$types';

function sanitizeSlug(name: string): string {
  return name.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
}

export const GET: RequestHandler = async (event) => {
  const { params } = event;
  if (!params.name) throw error(400);
  await requireServerPermission(event, params.name, 'view_logs');

  const mcHost = await getSetting('forja.mc_host_address');
  try {
    const status = await getMapStatus(params.name, mcHost);
    return json(status);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'falha';
    throw error(500, msg);
  }
};

const postSchema = z
  .object({
    mode: z.enum(['embedded', 'sidecar', 'auto']).default('auto'),
    sidecarHeapMb: z.number().int().min(512).max(8192).optional()
  })
  .default({ mode: 'auto' });

export const POST: RequestHandler = async (event) => {
  const { params } = event;
  if (!params.name) throw error(400);
  await requireServerPermission(event, params.name, 'manage_files');

  const body = await event.request.json().catch(() => ({}));
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) throw error(400, 'body inválido');

  const row = await db()
    .select()
    .from(schema.servers)
    .where(eq(schema.servers.containerName, params.name))
    .get();

  // For unmanaged containers (created outside Chest), we can still install BlueMap
  // via sidecar — we just can't use embedded mode (no DB metadata = no known loader/version).
  const isManaged = !!row;
  const loaderType: LoaderType = row?.modloaderType ?? 'VANILLA';
  const mcVersion = row?.mcVersion ?? '1.21.1';

  if (!isManaged) {
    const dataMount = await resolveServerDataMount(params.name);
    if (!dataMount) {
      throw error(
        404,
        `container ${params.name} não tem mount em /data. Esse container é um server Minecraft?`
      );
    }
  }

  const supportsEmbedded = isManaged && loaderSupportsBlueMap(loaderType);
  let resolvedMode: 'embedded' | 'sidecar';
  if (parsed.data.mode === 'auto') {
    resolvedMode = supportsEmbedded ? 'embedded' : 'sidecar';
  } else if (parsed.data.mode === 'embedded' && !supportsEmbedded) {
    throw error(
      400,
      isManaged
        ? `loader ${loaderType} não suporta BlueMap embedded. Use mode=sidecar ou auto.`
        : 'embedded só funciona em servers gerenciados pelo Chest. Use mode=sidecar.'
    );
  } else {
    resolvedMode = parsed.data.mode;
  }

  try {
    let mapPort = row?.hostPortMap ?? null;
    let sidecarPort: number | undefined;

    if (resolvedMode === 'embedded') {
      const detected = await detectMap(params.name);
      if (detected.detected === null) {
        const result = await installBlueMap(params.name, loaderType, mcVersion, {
          forceMode: 'embedded'
        });
        await logAudit(event, {
          action: 'server.map.install',
          resourceType: 'server',
          resourceId: params.name,
          details: { mode: 'embedded', file: 'filename' in result ? result.filename : null }
        });
      }
      if (!mapPort) {
        mapPort = await allocateMapPort();
        await rebindContainerPorts(params.name, mapPort);
      }
    } else {
      sidecarPort = mapPort ?? (await allocateMapPort());
      mapPort = sidecarPort;
      const network = await detectInternalNetwork(params.name);
      await installBlueMap(params.name, loaderType, mcVersion, {
        forceMode: 'sidecar',
        sidecarPort,
        sidecarNetwork: network ?? undefined
      });
      await logAudit(event, {
        action: 'server.map.install',
        resourceType: 'server',
        resourceId: params.name,
        details: { mode: 'sidecar', port: sidecarPort, unmanaged: !isManaged }
      });
    }

    await setMapMetadata(params.name, {
      installed: true,
      type: 'bluemap',
      hostPort: mapPort
    });

    return json({
      ok: true,
      mode: resolvedMode,
      hostPort: mapPort,
      restartRequired: resolvedMode === 'embedded',
      message:
        resolvedMode === 'embedded'
          ? 'BlueMap embedded instalado. Reinicie o server pra gerar o mapa pela primeira vez (pode levar minutos).'
          : 'Sidecar BlueMap criado e rodando. Primeira renderização leva alguns minutos — recarregue a aba mapa em ~2 min.'
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'falha';
    await logAudit(event, {
      action: 'server.map.install',
      resourceType: 'server',
      resourceId: params.name,
      status: 'fail',
      details: msg
    });
    throw error(500, msg);
  }
};

export const DELETE: RequestHandler = async (event) => {
  const { params, url } = event;
  if (!params.name) throw error(400);
  await requireServerPermission(event, params.name, 'manage_files');

  const wipe = url.searchParams.get('wipe') === '1';
  const row = await db()
    .select()
    .from(schema.servers)
    .where(eq(schema.servers.containerName, params.name))
    .get();

  const slug = row?.slug ?? sanitizeSlug(params.name);

  try {
    await stopBlueMapSidecar(slug);
    await removeBlueMapSidecar(slug, { wipeVolume: wipe });
    await setMapMetadata(params.name, { installed: false, type: null, hostPort: null });
    await logAudit(event, {
      action: 'server.map.uninstall',
      resourceType: 'server',
      resourceId: params.name,
      details: { wipe }
    });
    return json({
      ok: true,
      message:
        'BlueMap desativado. Sidecar removido' +
        (wipe ? ' + dados do mapa apagados' : '') +
        '. Mods/plugins embedded permanecem em /data (remova via Arquivos se quiser).'
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'falha';
    throw error(500, msg);
  }
};

async function detectInternalNetwork(containerName: string): Promise<string | null> {
  try {
    const info = await docker().getContainer(containerName).inspect();
    // host network mode can't be shared with a separate container with port bindings
    if (info.HostConfig?.NetworkMode === 'host') return null;
    const networks = Object.keys(info.NetworkSettings?.Networks ?? {});
    // skip the default bridge — sidecar will use its own bridge endpoint
    const named = networks.filter((n) => n !== 'bridge' && n !== 'host' && n !== 'none');
    return named[0] ?? null;
  } catch {
    return null;
  }
}

async function rebindContainerPorts(containerName: string, mapPort: number): Promise<void> {
  const container = docker().getContainer(containerName);
  const info = await container.inspect();
  const wasRunning = info.State.Running;

  const cfg = info.Config;
  const hostCfg = info.HostConfig ?? {};

  const exposed = { ...(cfg.ExposedPorts ?? {}), '8100/tcp': {} };
  const portBindings = {
    ...(hostCfg.PortBindings ?? {}),
    '8100/tcp': [{ HostPort: String(mapPort) }]
  };

  if (wasRunning) {
    try {
      await container.stop({ t: 30 });
    } catch {
      /* ignore */
    }
  }
  await container.remove({ force: true });

  await docker().createContainer({
    name: containerName,
    Image: cfg.Image,
    Env: cfg.Env ?? [],
    ExposedPorts: exposed,
    Labels: cfg.Labels,
    HostConfig: { ...hostCfg, PortBindings: portBindings },
    NetworkingConfig: {
      EndpointsConfig: info.NetworkSettings?.Networks ?? {}
    }
  });

  if (wasRunning) {
    await docker().getContainer(containerName).start();
  }
}
