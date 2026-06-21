import { eq, count, asc } from 'drizzle-orm';
import { db } from '../db';
import { hosts, servers, type Host } from '../db/schema';
import { encrypt } from '../mc/crypto';
import { getSetting } from '../settings';
import { dockerForHost, invalidateHostCache, LOCAL_HOST_ID } from './pool';

export { LOCAL_HOST_ID };

const ENDPOINT_RE = /^(tcp|unix):\/\//;

/**
 * Host shape safe to return to the UI: never carries the encrypted PEMs.
 * The *Encrypted columns exist in the row but are stripped here so a secret
 * blob can never leak through an API response or a log line. A boolean
 * `hasTls` tells the UI whether TLS is configured without exposing anything.
 */
export type HostPublic = Omit<
  Host,
  'tlsCaEncrypted' | 'tlsCertEncrypted' | 'tlsKeyEncrypted'
> & {
  hasTls: boolean;
};

export interface CreateHostInput {
  name: string;
  endpoint: string;
  tlsCa?: string;
  tlsCert?: string;
  tlsKey?: string;
  hostAddress?: string;
}

export interface UpdateHostPatch {
  name?: string;
  endpoint?: string;
  tlsCa?: string;
  tlsCert?: string;
  tlsKey?: string;
  hostAddress?: string | null;
  enabled?: boolean;
  isDefault?: boolean;
}

export interface TestConnectionResult {
  ok: boolean;
  version?: string;
  error?: string;
}

function toPublic(host: Host): HostPublic {
  const { tlsCaEncrypted, tlsCertEncrypted, tlsKeyEncrypted, ...rest } = host;
  return {
    ...rest,
    hasTls: Boolean(tlsCaEncrypted || tlsCertEncrypted || tlsKeyEncrypted)
  };
}

function validateEndpoint(endpoint: string): void {
  if (!ENDPOINT_RE.test(endpoint)) {
    throw new Error(`invalid endpoint: ${endpoint} (must start with tcp:// or unix://)`);
  }
}

function validateName(name: string): void {
  if (!name || !name.trim()) {
    throw new Error('host name cannot be empty');
  }
}

export async function listHosts(): Promise<HostPublic[]> {
  const rows = await db().select().from(hosts).orderBy(asc(hosts.createdAt));
  // local host always first regardless of creation order
  rows.sort((a: Host, b: Host) => {
    if (a.id === LOCAL_HOST_ID) return -1;
    if (b.id === LOCAL_HOST_ID) return 1;
    return 0;
  });
  return rows.map(toPublic);
}

export async function getHost(id: string): Promise<HostPublic | null> {
  const row = db().select().from(hosts).where(eq(hosts.id, id)).get();
  return row ? toPublic(row) : null;
}

export async function createHost(input: CreateHostInput): Promise<HostPublic> {
  validateName(input.name);
  validateEndpoint(input.endpoint);

  const [tlsCaEncrypted, tlsCertEncrypted, tlsKeyEncrypted] = await Promise.all([
    input.tlsCa ? encrypt(input.tlsCa) : Promise.resolve(null),
    input.tlsCert ? encrypt(input.tlsCert) : Promise.resolve(null),
    input.tlsKey ? encrypt(input.tlsKey) : Promise.resolve(null)
  ]);

  const row = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    endpoint: input.endpoint,
    tlsCaEncrypted,
    tlsCertEncrypted,
    tlsKeyEncrypted,
    isDefault: false,
    enabled: true,
    hostAddress: input.hostAddress ?? null
  };

  const created = db().insert(hosts).values(row).returning().get();
  return toPublic(created);
}

export async function updateHost(id: string, patch: UpdateHostPatch): Promise<void> {
  const existing = db().select().from(hosts).where(eq(hosts.id, id)).get();
  if (!existing) throw new Error(`host not found: ${id}`);

  // the local host is the always-available fallback; it can never be disabled
  if (id === LOCAL_HOST_ID && patch.enabled === false) {
    throw new Error('the local host is always required and cannot be disabled');
  }

  const updates: Partial<typeof hosts.$inferInsert> = {};

  if (patch.name !== undefined) {
    validateName(patch.name);
    updates.name = patch.name.trim();
  }
  if (patch.endpoint !== undefined) {
    validateEndpoint(patch.endpoint);
    updates.endpoint = patch.endpoint;
  }
  if (patch.hostAddress !== undefined) updates.hostAddress = patch.hostAddress;
  if (patch.enabled !== undefined) updates.enabled = patch.enabled;
  if (patch.isDefault !== undefined) updates.isDefault = patch.isDefault;

  // re-encrypt a cert only when a new PEM is provided; empty string clears it
  if (patch.tlsCa !== undefined) {
    updates.tlsCaEncrypted = patch.tlsCa ? await encrypt(patch.tlsCa) : null;
  }
  if (patch.tlsCert !== undefined) {
    updates.tlsCertEncrypted = patch.tlsCert ? await encrypt(patch.tlsCert) : null;
  }
  if (patch.tlsKey !== undefined) {
    updates.tlsKeyEncrypted = patch.tlsKey ? await encrypt(patch.tlsKey) : null;
  }

  if (Object.keys(updates).length === 0) return;

  db().update(hosts).set(updates).where(eq(hosts.id, id)).run();
  invalidateHostCache(id);
}

export async function deleteHost(id: string): Promise<void> {
  if (id === LOCAL_HOST_ID) {
    throw new Error('the local host cannot be deleted');
  }

  const row = db()
    .select({ value: count() })
    .from(servers)
    .where(eq(servers.hostId, id))
    .get();
  const serverCount = row?.value ?? 0;

  if (serverCount > 0) {
    throw new Error('this host still has servers — move or remove the servers first');
  }

  db().delete(hosts).where(eq(hosts.id, id)).run();
  invalidateHostCache(id);
}

export async function testConnection(id: string): Promise<TestConnectionResult> {
  try {
    const client = await dockerForHost(id);
    const info = await client.version();
    return { ok: true, version: info.Version };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

export async function getHostPublicAddress(id: string): Promise<string | null> {
  const host = db().select().from(hosts).where(eq(hosts.id, id)).get();
  if (host?.hostAddress) return host.hostAddress;
  return getSetting('forja.mc_host_address');
}

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/ECONNREFUSED/i.test(msg)) {
    return 'connection refused — is the Docker daemon running and reachable?';
  }
  if (/ETIMEDOUT|timeout/i.test(msg)) {
    return 'connection timed out — check the endpoint and network/firewall.';
  }
  if (/ENOTFOUND|EAI_AGAIN/i.test(msg)) {
    return 'host not found — check the endpoint address.';
  }
  if (/certificate|tls|ssl|self.signed/i.test(msg)) {
    return 'TLS handshake failed — check the CA / client certificate and key.';
  }
  if (/ENOENT/i.test(msg)) {
    return 'socket not found — check the unix:// socket path.';
  }
  return msg;
}
