import { docker } from '$lib/docker/client';
import { db, schema } from '$lib/db';
import { eq } from 'drizzle-orm';
import { downloadFile, getVersions } from '$lib/modrinth/client';
import { writeContainerFile } from './files';
import {
  pickBlueMapVariant,
  classifyMapFile,
  BLUEMAP_PROJECT_ID,
  type MapType,
  type LoaderType,
  type MapStatus
} from './world-map-types';

export type { MapType, LoaderType, MapStatus } from './world-map-types';
export { loaderSupportsBlueMap } from './world-map-types';

// Container dirs we list are fixed constants (see callers), but guard anyway so
// no shell metacharacter can ever reach `exec`. We pass an exec array (no shell)
// instead of `sh -c "... ${dir} ..."`, which would let backtick/$() in `dir`
// execute. The old `2>/dev/null || true` is handled by try/catch + filtering.
const SAFE_PATH = /^\/[A-Za-z0-9._/-]*$/;

async function execList(containerName: string, dir: string): Promise<string[]> {
  if (!SAFE_PATH.test(dir)) return [];
  try {
    const exec = await docker().getContainer(containerName).exec({
      Cmd: ['ls', '-1', dir],
      AttachStdout: true,
      AttachStderr: true
    });
    const stream = await exec.start({});
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve) => {
      stream.on('data', (c: Buffer) => chunks.push(c));
      stream.on('end', () => resolve());
      stream.on('error', () => resolve());
    });
    let out = '';
    let buf = Buffer.concat(chunks);
    while (buf.length >= 8) {
      const size = buf.readUInt32BE(4);
      if (buf.length < 8 + size) break;
      out += buf.subarray(8, 8 + size).toString('utf8');
      buf = buf.subarray(8 + size);
    }
    return out.split('\n').map((l) => l.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export async function detectMap(containerName: string): Promise<{
  detected: MapType | null;
  files: string[];
}> {
  const [plugins, mods] = await Promise.all([
    execList(containerName, '/data/plugins'),
    execList(containerName, '/data/mods')
  ]);
  const all = [...plugins.map((f) => `plugins/${f}`), ...mods.map((f) => `mods/${f}`)];

  const matched: { type: MapType; files: string[] }[] = [];
  const priority: MapType[] = ['bluemap', 'dynmap', 'squaremap', 'pl3xmap'];
  for (const t of priority) {
    const files = all.filter((f) => classifyMapFile(f) === t);
    if (files.length > 0) matched.push({ type: t, files });
  }
  if (matched.length === 0) return { detected: null, files: [] };
  return { detected: matched[0].type, files: matched[0].files };
}

const BLUEMAP_HTTP_PORT_RANGE_START = 8100;
const BLUEMAP_HTTP_PORT_RANGE_END = 8200;

export async function allocateMapPort(): Promise<number> {
  const containers = await docker().listContainers({ all: true });
  const used = new Set<number>();
  for (const c of containers) {
    for (const p of c.Ports ?? []) {
      if (p.PublicPort) used.add(p.PublicPort);
    }
  }
  for (let p = BLUEMAP_HTTP_PORT_RANGE_START; p <= BLUEMAP_HTTP_PORT_RANGE_END; p++) {
    if (!used.has(p)) return p;
  }
  throw new Error(`sem portas livres no range ${BLUEMAP_HTTP_PORT_RANGE_START}-${BLUEMAP_HTTP_PORT_RANGE_END} pra o mapa`);
}

async function probeHttp(url: string, timeoutMs = 2500): Promise<boolean> {
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    // GET (some servers reject HEAD with 405 → false negative). We don't read body.
    const res = await fetch(url, { method: 'GET', signal: ac.signal }).catch(() => null);
    clearTimeout(timer);
    if (!res) return false;
    res.body?.cancel().catch(() => undefined);
    return res.status < 500;
  } catch {
    return false;
  }
}

export async function getMapStatus(
  containerName: string,
  publicHost: string | null
): Promise<MapStatus & { mode: 'embedded' | 'sidecar' | null; sidecarState?: string | null }> {
  const row = await db()
    .select()
    .from(schema.servers)
    .where(eq(schema.servers.containerName, containerName))
    .get();

  // Use DB slug when available, else fallback to sanitized container name
  // (so unmanaged containers can still install/track a sidecar).
  const slug = row?.slug ?? containerName.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const { getSidecarStatus } = await import('./world-map-sidecar');
  const sidecar = await getSidecarStatus(slug);

  const { detected, files } = await detectMap(containerName);

  let mode: 'embedded' | 'sidecar' | null = null;
  let hostPort = row?.hostPortMap ?? null;
  if (sidecar?.exists) {
    mode = 'sidecar';
    hostPort = sidecar.hostPort ?? hostPort;
  } else if (detected !== null || row?.mapInstalled) {
    mode = 'embedded';
  }

  const installed = !!row?.mapInstalled || detected !== null || (sidecar?.exists ?? false);
  const type = row?.mapType ?? detected;

  // Probe from inside the Chest container — host.docker.internal is always
  // reachable from here (Docker injects it), while publicHost might be a
  // hostname only resolvable externally.
  let reachable = false;
  if (hostPort) {
    const probeHost = process.env.MAP_PROXY_UPSTREAM_HOST ?? 'host.docker.internal';
    reachable = await probeHttp(`http://${probeHost}:${hostPort}/`);
  }

  return {
    installed,
    type,
    hostPort,
    reachable,
    detectedFiles: files,
    mode,
    sidecarState: sidecar?.state ?? null
  };
}

export interface InstallEmbeddedResult {
  mode: 'embedded';
  filename: string;
  installedTo: string;
}

export interface InstallSidecarResult {
  mode: 'sidecar';
  sidecarContainer: string;
}

export type InstallResult = InstallEmbeddedResult | InstallSidecarResult;

export async function installBlueMap(
  containerName: string,
  loader: LoaderType,
  mcVersion: string,
  opts: {
    forceMode?: 'embedded' | 'sidecar';
    sidecarPort?: number;
    sidecarNetwork?: string;
  } = {}
): Promise<InstallResult> {
  const variant = pickBlueMapVariant(loader);
  const canEmbedded = variant !== null;
  const desiredMode = opts.forceMode ?? (canEmbedded ? 'embedded' : 'sidecar');

  if (desiredMode === 'embedded') {
    if (!variant) {
      throw new Error(
        `BlueMap embedded não suporta loader ${loader}. Use sidecar (funciona em qualquer loader, incluindo vanilla).`
      );
    }
    const versions = await getVersions(BLUEMAP_PROJECT_ID, {
      loader: variant.loaderKey,
      mcVersion
    });
    if (versions.length === 0) {
      throw new Error(
        `BlueMap não tem versão pra ${loader} + MC ${mcVersion} no Modrinth. Tente sidecar mode.`
      );
    }
    const version = versions[0];
    const primaryFile = version.files.find((f) => f.primary) ?? version.files[0];
    if (!primaryFile) throw new Error('arquivo do BlueMap não encontrado');
    const buffer = await downloadFile(primaryFile.url);
    const destPath = `/data/${variant.installDir}/${primaryFile.filename}`;
    await writeContainerFile(containerName, destPath, buffer);
    return { mode: 'embedded', filename: primaryFile.filename, installedTo: destPath };
  }

  // sidecar mode — works for both managed (DB row) and external containers
  if (opts.sidecarPort == null) throw new Error('sidecarPort não foi alocada');

  const { createBlueMapSidecar, sidecarName, resolveServerDataMount } = await import(
    './world-map-sidecar'
  );

  const row = await db()
    .select()
    .from(schema.servers)
    .where(eq(schema.servers.containerName, containerName))
    .get();

  const dataVolume = row?.dataVolume ?? (await resolveServerDataMount(containerName));
  if (!dataVolume) {
    throw new Error(
      `não consegui descobrir o volume /data do container ${containerName}. Container existe e tem mount em /data?`
    );
  }

  // fallback slug for unmanaged containers: use container name (sanitized)
  const slug = row?.slug ?? containerName.replace(/[^a-z0-9-]/gi, '-').toLowerCase();

  await createBlueMapSidecar({
    slug,
    dataVolume,
    hostPort: opts.sidecarPort,
    network: opts.sidecarNetwork
  });
  return { mode: 'sidecar', sidecarContainer: sidecarName(slug) };
}

export async function setMapMetadata(
  containerName: string,
  data: { installed: boolean; type: MapType | null; hostPort: number | null }
): Promise<void> {
  // Best-effort: only persists for Chest-managed servers.
  // External containers track state purely via the sidecar container's existence + labels.
  const row = await db()
    .select({ id: schema.servers.id })
    .from(schema.servers)
    .where(eq(schema.servers.containerName, containerName))
    .get();
  if (!row) return;

  await db()
    .update(schema.servers)
    .set({
      mapInstalled: data.installed,
      mapType: data.type,
      hostPortMap: data.hostPort,
      updatedAt: new Date()
    })
    .where(eq(schema.servers.containerName, containerName));
}
