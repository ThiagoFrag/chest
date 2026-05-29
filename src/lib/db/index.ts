import { Database } from 'bun:sqlite';
import { drizzle, type BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

let instance: BunSQLiteDatabase<typeof schema> | null = null;

export function db(): BunSQLiteDatabase<typeof schema> {
  if (instance) return instance;
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
