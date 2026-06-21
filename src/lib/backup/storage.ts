import { stat, readdir, mkdir, unlink, readFile } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

export interface BackupObject {
  key: string; // unique identifier (filename)
  sizeBytes: number;
  createdAt: number; // unix ts
}

export interface BackupStorage {
  /** Driver name for logging / UI */
  readonly driver: string;

  /** Upload a backup (stream-friendly) */
  put(key: string, stream: NodeJS.ReadableStream): Promise<{ sizeBytes: number }>;

  /** Download a backup as readable stream */
  get(key: string): Promise<NodeJS.ReadableStream>;

  /** List backups, optionally filtered by prefix */
  list(prefix?: string): Promise<BackupObject[]>;

  /** Delete a backup */
  delete(key: string): Promise<void>;

  /** Check connection/credentials health (used at startup + UI test) */
  ping(): Promise<{ ok: boolean; message: string }>;
}

export class LocalStorage implements BackupStorage {
  readonly driver = 'local';
  constructor(private dir: string) {}

  async put(key: string, stream: NodeJS.ReadableStream): Promise<{ sizeBytes: number }> {
    await mkdir(this.dir, { recursive: true });
    const fullPath = path.join(this.dir, key);
    await pipeline(stream as Readable, createWriteStream(fullPath));
    const s = await stat(fullPath);
    return { sizeBytes: s.size };
  }

  async get(key: string): Promise<NodeJS.ReadableStream> {
    const fullPath = path.join(this.dir, key);
    await stat(fullPath); // throws if missing
    return createReadStream(fullPath);
  }

  async list(prefix?: string): Promise<BackupObject[]> {
    await mkdir(this.dir, { recursive: true });
    const files = await readdir(this.dir);
    const out: BackupObject[] = [];
    for (const f of files) {
      if (prefix && !f.startsWith(prefix)) continue;
      const s = await stat(path.join(this.dir, f)).catch(() => null);
      if (!s) continue;
      out.push({ key: f, sizeBytes: s.size, createdAt: Math.floor(s.mtimeMs / 1000) });
    }
    return out;
  }

  async delete(key: string): Promise<void> {
    await unlink(path.join(this.dir, key)).catch(() => undefined);
  }

  async ping(): Promise<{ ok: boolean; message: string }> {
    try {
      await mkdir(this.dir, { recursive: true });
      return { ok: true, message: `local: ${this.dir} writable` };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'unknown' };
    }
  }
}
