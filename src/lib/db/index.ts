import { createRequire } from 'node:module';
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

// Resolve bun:sqlite (and the drizzle bun-sqlite driver, which statically
// imports it) lazily so the `bun:` scheme is never evaluated when the module
// graph is loaded by Node (e.g. during `vite build`). At runtime the server is
// started with Bun, where require('bun:sqlite') works.
const require = createRequire(import.meta.url);

let instance: BunSQLiteDatabase<typeof schema> | null = null;

export function db(): BunSQLiteDatabase<typeof schema> {
  if (instance) return instance;
  const { Database } = require('bun:sqlite') as typeof import('bun:sqlite');
  const { drizzle } =
    require('drizzle-orm/bun-sqlite') as typeof import('drizzle-orm/bun-sqlite');
  const url = process.env.DATABASE_URL ?? 'file:./data/db.sqlite';
  const path = url.replace(/^file:/, '');
  const sqlite = new Database(path, { create: true });
  sqlite.exec('PRAGMA journal_mode = WAL');
  sqlite.exec('PRAGMA foreign_keys = ON');
  sqlite.exec('PRAGMA synchronous = NORMAL');
  sqlite.exec('PRAGMA busy_timeout = 5000');
  instance = drizzle(sqlite, { schema });
  return instance;
}

export { schema };
