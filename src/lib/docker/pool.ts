import Docker from 'dockerode';
import { env } from '$env/dynamic/private';
import { eq } from 'drizzle-orm';
import { hosts, servers } from '../db/schema';
import { decrypt } from '../mc/crypto';

// Lazy-load the db so importing the docker pool does not pull in bun:sqlite
// (via ../db) at module load. That kept node-run vitest suites from collecting
// any file that transitively imports the pool (e.g. files/port-allocator).
async function getDb() {
  return (await import('../db')).db;
}

export const LOCAL_HOST_ID = 'local';

const TLS_DEFAULT_PORT = 2376;
const TCP_DEFAULT_PORT = 2375;

const cache = new Map<string, Docker>();

function buildLocal(): Docker {
  const host = env.DOCKER_HOST;

  if (!host || host.startsWith('unix://') || host.startsWith('/')) {
    const socketPath = host?.replace('unix://', '') || '/var/run/docker.sock';
    return new Docker({ socketPath });
  }

  if (host.startsWith('tcp://')) {
    const url = new URL(host);
    return new Docker({
      host: url.hostname,
      port: url.port ? Number(url.port) : TCP_DEFAULT_PORT
    });
  }

  return new Docker({ socketPath: '/var/run/docker.sock' });
}

function local(): Docker {
  let client = cache.get(LOCAL_HOST_ID);
  if (!client) {
    client = buildLocal();
    cache.set(LOCAL_HOST_ID, client);
  }
  return client;
}

type HostRow = typeof hosts.$inferSelect;

async function buildRemote(host: HostRow): Promise<Docker> {
  if (!host.endpoint) {
    return buildLocal();
  }

  const endpoint = host.endpoint;

  if (endpoint.startsWith('unix://') || endpoint.startsWith('/')) {
    const socketPath = endpoint.replace('unix://', '');
    return new Docker({ socketPath });
  }

  if (endpoint.startsWith('tcp://')) {
    const url = new URL(endpoint);
    const useTls = !!host.tlsCaEncrypted;

    if (useTls) {
      const [ca, cert, key] = await Promise.all([
        host.tlsCaEncrypted ? decrypt(host.tlsCaEncrypted) : undefined,
        host.tlsCertEncrypted ? decrypt(host.tlsCertEncrypted) : undefined,
        host.tlsKeyEncrypted ? decrypt(host.tlsKeyEncrypted) : undefined
      ]);

      return new Docker({
        host: url.hostname,
        port: url.port ? Number(url.port) : TLS_DEFAULT_PORT,
        protocol: 'https',
        ca: ca ? Buffer.from(ca) : undefined,
        cert: cert ? Buffer.from(cert) : undefined,
        key: key ? Buffer.from(key) : undefined
      });
    }

    return new Docker({
      host: url.hostname,
      port: url.port ? Number(url.port) : TCP_DEFAULT_PORT,
      protocol: 'http'
    });
  }

  throw new Error(`docker pool: unsupported endpoint "${endpoint}" for host "${host.id}"`);
}

export async function dockerForHost(hostId: string): Promise<Docker> {
  if (hostId === LOCAL_HOST_ID) {
    return local();
  }

  const cached = cache.get(hostId);
  if (cached) return cached;

  let row: HostRow | undefined;
  try {
    const db = await getDb();
    row = db().select().from(hosts).where(eq(hosts.id, hostId)).get();
  } catch (err) {
    throw new Error(
      `docker pool: failed to load host "${hostId}" from db: ${(err as Error).message}`
    );
  }

  if (!row) {
    throw new Error(`docker pool: host "${hostId}" not found`);
  }
  if (!row.enabled) {
    throw new Error(`docker pool: host "${hostId}" is disabled`);
  }

  let client: Docker;
  try {
    client = await buildRemote(row);
  } catch (err) {
    throw new Error(
      `docker pool: failed to build client for host "${hostId}": ${(err as Error).message}`
    );
  }

  cache.set(hostId, client);
  return client;
}

export async function dockerForContainer(containerName: string): Promise<Docker> {
  let row: { hostId: string | null } | undefined;
  try {
    const db = await getDb();
    row = db()
      .select({ hostId: servers.hostId })
      .from(servers)
      .where(eq(servers.containerName, containerName))
      .get();
  } catch {
    return local();
  }

  if (!row) {
    return local();
  }

  return dockerForHost(row.hostId ?? LOCAL_HOST_ID);
}

export function docker(): Docker {
  return local();
}

export function invalidateHostCache(hostId?: string): void {
  if (hostId === undefined) {
    cache.clear();
    return;
  }
  cache.delete(hostId);
}
