import { dockerForHost, dockerForContainer, LOCAL_HOST_ID } from '$lib/docker/client';
import type Docker from 'dockerode';
import { db, schema } from '$lib/db';
import { eq } from 'drizzle-orm';
import { allocatePorts, slugify } from './port-allocator';
import { withLock, SERVER_CREATE_LOCK } from './locks';
import { encrypt, generateRconPassword } from './crypto';
import { getSetting } from '$lib/settings';
import { ensureAuthlibInjector, buildJvmOpts } from './authlib';
import { emitEvent } from '$lib/webhooks/dispatcher';

export type ModloaderType =
  | 'VANILLA'
  | 'PAPER'
  | 'FABRIC'
  | 'FORGE'
  | 'NEOFORGE'
  | 'PURPUR'
  | 'SPIGOT'
  | 'QUILT';

export type Difficulty = 'peaceful' | 'easy' | 'normal' | 'hard';

export interface CreateServerInput {
  displayName: string;
  modloaderType: ModloaderType;
  mcVersion: string;
  loaderVersion?: string;
  memoryMb: number;
  maxPlayers: number;
  difficulty: Difficulty;
  motd?: string;
  draslEnabled: boolean;
  envExtras?: Record<string, string>;
  jvmOptsExtra?: string;
  hostId?: string;
}

const IMAGE = 'itzg/minecraft-server:java21';

// Guarantees the image exists on the daemon where the container will run, not
// on the local one — a remote host needs its own pulled copy.
export async function ensureImage(d: Docker): Promise<void> {
  try {
    await d.getImage(IMAGE).inspect();
  } catch {
    await new Promise<void>((resolve, reject) => {
      d.pull(IMAGE, (err: Error | null, stream: NodeJS.ReadableStream) => {
        if (err) return reject(err);
        d.modem.followProgress(stream, (e) => (e ? reject(e) : resolve()));
      });
    });
  }
}

export async function createServer(input: CreateServerInput): Promise<{
  id: string;
  slug: string;
  containerName: string;
  hostPort: number;
}> {
  // Serialize the whole critical section (slug uniqueness + port allocation +
  // DB insert + container creation) under one global lock. Server creation is
  // rare, so global serialization is acceptable and eliminates both the port
  // allocation race and the slug TOCTOU at once.
  return withLock(SERVER_CREATE_LOCK, () => createServerLocked(input));
}

async function createServerLocked(input: CreateServerInput): Promise<{
  id: string;
  slug: string;
  containerName: string;
  hostPort: number;
}> {
  const baseSlug = slugify(input.displayName) || `server-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 1;
  while (
    await db().select().from(schema.servers).where(eq(schema.servers.slug, slug)).get()
  ) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const hostId = input.hostId ?? LOCAL_HOST_ID;
  const containerName = `forja-${slug}`;
  const volumeName = `forja-data-${slug}`;
  const ports = await allocatePorts(hostId);
  const rconPassword = generateRconPassword();
  const rconPasswordEncrypted = await encrypt(rconPassword);
  const id = crypto.randomUUID();

  await db().insert(schema.servers).values({
    id,
    slug,
    containerName,
    hostId,
    displayName: input.displayName,
    modloaderType: input.modloaderType,
    mcVersion: input.mcVersion,
    loaderVersion: input.loaderVersion,
    memoryMb: input.memoryMb,
    maxPlayers: input.maxPlayers,
    difficulty: input.difficulty,
    motd: input.motd,
    hostPortHttp: ports.http,
    hostPortRcon: ports.rcon,
    dataVolume: volumeName,
    rconPasswordEncrypted,
    draslEnabled: input.draslEnabled,
    status: 'creating'
  });

  const d = await dockerForHost(hostId);

  try {
    await ensureImage(d);

    let draslUrl: string | null = null;
    if (input.draslEnabled) {
      draslUrl = await getSetting('drasl.url');
      if (!draslUrl) {
        throw new Error(
          'drasl.url não configurado em Settings. Configure antes de criar server com Drasl.'
        );
      }
    }

    await d.createVolume({
      Name: volumeName,
      Labels: { 'forja.managed': 'true', 'forja.slug': slug }
    });

    const env = buildEnv(input, rconPassword, draslUrl);
    const container = await d.createContainer({
      name: containerName,
      Image: IMAGE,
      Env: env,
      Labels: {
        'forja.managed': 'true',
        'forja.slug': slug,
        'forja.display': input.displayName
      },
      HostConfig: {
        RestartPolicy: { Name: 'unless-stopped' },
        Memory: (input.memoryMb + 768) * 1024 * 1024,
        MemoryReservation: input.memoryMb * 1024 * 1024,
        PortBindings: {
          '25565/tcp': [{ HostPort: String(ports.http) }],
          '25575/tcp': [{ HostPort: String(ports.rcon) }]
        },
        Binds: [`${volumeName}:/data`]
      },
      ExposedPorts: {
        '25565/tcp': {},
        '25575/tcp': {}
      }
    });

    if (draslUrl) {
      await ensureAuthlibInjector(containerName);
    }

    await container.start();

    await db()
      .update(schema.servers)
      .set({ status: 'running', updatedAt: new Date() })
      .where(eq(schema.servers.id, id));

    emitEvent({
      type: 'server.created',
      serverId: id,
      payload: {
        serverId: id,
        slug,
        containerName,
        displayName: input.displayName,
        modloaderType: input.modloaderType,
        mcVersion: input.mcVersion,
        loaderVersion: input.loaderVersion ?? null,
        memoryMb: input.memoryMb,
        maxPlayers: input.maxPlayers,
        difficulty: input.difficulty,
        hostPort: ports.http,
        rconPort: ports.rcon,
        createdBy: null
      }
    });

    return { id, slug, containerName, hostPort: ports.http };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await d
      .getContainer(containerName)
      .remove({ force: true })
      .catch(() => undefined);
    await d
      .getVolume(volumeName)
      .remove()
      .catch(() => undefined);
    await db()
      .update(schema.servers)
      .set({ status: 'failed', statusMessage: msg, updatedAt: new Date() })
      .where(eq(schema.servers.id, id));
    throw err;
  }
}

function buildEnv(
  input: CreateServerInput,
  rconPassword: string,
  draslUrl: string | null
): string[] {
  const env: Record<string, string> = {
    EULA: 'TRUE',
    TYPE: input.modloaderType,
    VERSION: input.mcVersion,
    MEMORY: `${Math.floor(input.memoryMb / 1024)}G`,
    MAX_PLAYERS: String(input.maxPlayers),
    DIFFICULTY: input.difficulty,
    ENABLE_RCON: 'TRUE',
    RCON_PASSWORD: rconPassword,
    USE_AIKAR_FLAGS: 'TRUE',
    ONLINE_MODE: 'TRUE',
    TZ: process.env.TZ ?? 'UTC'
  };

  if (input.loaderVersion) {
    if (input.modloaderType === 'FABRIC') env.FABRIC_LOADER_VERSION = input.loaderVersion;
    else if (input.modloaderType === 'FORGE') env.FORGE_VERSION = input.loaderVersion;
    else if (input.modloaderType === 'NEOFORGE')
      env.NEOFORGE_VERSION = input.loaderVersion;
    else if (input.modloaderType === 'QUILT')
      env.QUILT_LOADER_VERSION = input.loaderVersion;
  }

  if (input.motd) env.MOTD = input.motd;

  if (input.envExtras) {
    for (const [k, v] of Object.entries(input.envExtras)) {
      if (v !== '' && v != null) env[k] = String(v);
    }
  }

  const jvmParts: string[] = [];
  if (draslUrl) jvmParts.push(buildJvmOpts(draslUrl));
  if (input.jvmOptsExtra) jvmParts.push(input.jvmOptsExtra);
  if (jvmParts.length > 0) env.JVM_OPTS = jvmParts.join(' ');

  return Object.entries(env).map(([k, v]) => `${k}=${v}`);
}

export async function deleteServer(slug: string): Promise<void> {
  const server = await db()
    .select()
    .from(schema.servers)
    .where(eq(schema.servers.slug, slug))
    .get();
  if (!server) throw new Error('server não encontrado');

  await db()
    .update(schema.servers)
    .set({ status: 'deleting', updatedAt: new Date() })
    .where(eq(schema.servers.id, server.id));

  const d = await dockerForHost(server.hostId ?? LOCAL_HOST_ID);

  try {
    const { removeBlueMapSidecar } = await import('./world-map-sidecar');
    await removeBlueMapSidecar(slug, { wipeVolume: true });
  } catch {
    /* sidecar cleanup is best-effort */
  }

  try {
    const c = d.getContainer(server.containerName);
    await c.stop({ t: 30 }).catch(() => undefined);
    await c.remove({ force: true });
  } catch (err) {
    if (!isNotFoundError(err)) throw err;
  }

  try {
    await d.getVolume(server.dataVolume).remove();
  } catch (err) {
    if (!isNotFoundError(err)) {
      console.warn(
        '[deleteServer] volume cleanup failed, will orphan: ' + server.dataVolume,
        err
      );
    }
  }

  await db().delete(schema.servers).where(eq(schema.servers.id, server.id));

  emitEvent({
    type: 'server.deleted',
    serverId: server.id,
    payload: {
      serverId: server.id,
      slug: server.slug,
      containerName: server.containerName,
      displayName: server.displayName,
      deletedBy: null,
      deletedAt: new Date().toISOString()
    }
  });
}

function isNotFoundError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { statusCode?: number; message?: string };
  return e.statusCode === 404 || /no such/i.test(e.message ?? '');
}
