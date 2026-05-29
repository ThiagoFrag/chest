import { Rcon } from 'rcon-client';
import { db, schema } from '$lib/db';
import { eq, or } from 'drizzle-orm';
import { decrypt } from './crypto';

interface PoolEntry {
  rcon: Rcon;
  inUse: boolean;
  lastUsed: number;
}

const pool = new Map<string, PoolEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of pool) {
    if (!entry.inUse && now - entry.lastUsed > 60_000) {
      entry.rcon.end().catch(() => undefined);
      pool.delete(key);
    }
  }
}, 30_000);

async function getConn(slug: string): Promise<Rcon> {
  const existing = pool.get(slug);
  if (existing && !existing.inUse) {
    existing.inUse = true;
    return existing.rcon;
  }

  const server = await db()
    .select()
    .from(schema.servers)
    .where(or(eq(schema.servers.slug, slug), eq(schema.servers.containerName, slug)))
    .get();
  if (!server) {
    throw new Error('RCON disponível só pra servers criados pela Chest (esse foi adicionado via label apenas)');
  }

  const password = await decrypt(server.rconPasswordEncrypted);
  const rcon = await Rcon.connect({
    host: server.containerName,
    port: 25575,
    password,
    timeout: 5000
  });

  pool.set(slug, { rcon, inUse: true, lastUsed: Date.now() });
  return rcon;
}

function releaseConn(slug: string): void {
  const entry = pool.get(slug);
  if (entry) {
    entry.inUse = false;
    entry.lastUsed = Date.now();
  }
}

export async function sendCommand(slug: string, command: string): Promise<string> {
  const rcon = await getConn(slug);
  try {
    return await rcon.send(command);
  } finally {
    releaseConn(slug);
  }
}

export async function listPlayers(slug: string): Promise<string[]> {
  const response = await sendCommand(slug, 'list');
  const match = response.match(/:\s*(.+)$/);
  if (!match || !match[1].trim()) return [];
  return match[1].split(',').map((s) => s.trim()).filter(Boolean);
}
