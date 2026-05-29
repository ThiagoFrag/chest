import net from 'node:net';

interface ParsedStatus {
  online: true;
  motd: string;
  version: string;
  players: { online: number; max: number };
  latencyMs: number;
}

interface Offline {
  online: false;
  error: string;
}

export type MCStatus = ParsedStatus | Offline;

interface CacheEntry {
  value: MCStatus;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10_000;

export async function getStatus(
  host: string,
  port: number = 25565,
  timeoutMs = 4000
): Promise<MCStatus> {
  const key = `${host}:${port}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const value = await ping(host, port, timeoutMs).catch((err) => ({
    online: false as const,
    error: err instanceof Error ? err.message : String(err)
  }));
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

function ping(host: string, port: number, timeoutMs: number): Promise<MCStatus> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const socket = net.connect({ host, port });
    socket.setTimeout(timeoutMs);

    let buffer = Buffer.alloc(0);

    socket.on('connect', () => {
      const handshake = buildHandshake(host, port);
      socket.write(handshake);
      socket.write(Buffer.from([0x01, 0x00]));
    });

    socket.on('data', (chunk: Buffer) => {
      buffer = Buffer.concat([buffer, chunk]);
      const parsed = tryParse(buffer);
      if (parsed) {
        const status: ParsedStatus = {
          online: true,
          motd: extractMotd(parsed.description),
          version: parsed.version?.name ?? 'unknown',
          players: {
            online: parsed.players?.online ?? 0,
            max: parsed.players?.max ?? 0
          },
          latencyMs: Date.now() - startedAt
        };
        socket.destroy();
        resolve(status);
      }
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('timeout'));
    });
    socket.on('error', reject);
  });
}

function buildHandshake(host: string, port: number): Buffer {
  const hostBuf = Buffer.from(host, 'utf8');
  const data = Buffer.concat([
    writeVarInt(0),
    writeVarInt(767),
    writeVarInt(hostBuf.length),
    hostBuf,
    Buffer.from([(port >> 8) & 0xff, port & 0xff]),
    writeVarInt(1)
  ]);
  return Buffer.concat([writeVarInt(data.length), data]);
}

function writeVarInt(value: number): Buffer {
  const out: number[] = [];
  let v = value >>> 0;
  while (true) {
    if ((v & ~0x7f) === 0) {
      out.push(v);
      return Buffer.from(out);
    }
    out.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
}

function readVarInt(buf: Buffer, offset: number): { value: number; size: number } | null {
  let value = 0;
  let size = 0;
  while (size < 5) {
    if (offset + size >= buf.length) return null;
    const byte = buf[offset + size];
    value |= (byte & 0x7f) << (7 * size);
    size++;
    if ((byte & 0x80) === 0) return { value, size };
  }
  throw new Error('varint too long');
}

interface RawStatus {
  description?: unknown;
  players?: { online?: number; max?: number };
  version?: { name?: string; protocol?: number };
}

function tryParse(buf: Buffer): RawStatus | null {
  const len = readVarInt(buf, 0);
  if (!len) return null;
  const totalLen = len.value + len.size;
  if (buf.length < totalLen) return null;

  const packetId = readVarInt(buf, len.size);
  if (!packetId || packetId.value !== 0x00) return null;

  const strLen = readVarInt(buf, len.size + packetId.size);
  if (!strLen) return null;

  const jsonStart = len.size + packetId.size + strLen.size;
  const jsonEnd = jsonStart + strLen.value;
  if (buf.length < jsonEnd) return null;

  const json = buf.slice(jsonStart, jsonEnd).toString('utf8');
  try {
    return JSON.parse(json) as RawStatus;
  } catch {
    return null;
  }
}

function extractMotd(desc: unknown): string {
  if (typeof desc === 'string') return desc;
  if (desc && typeof desc === 'object') {
    const d = desc as { text?: string; extra?: Array<{ text?: string }> };
    let s = d.text ?? '';
    if (Array.isArray(d.extra)) {
      for (const e of d.extra) if (e.text) s += e.text;
    }
    return s;
  }
  return '';
}
