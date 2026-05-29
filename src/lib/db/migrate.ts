import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';

const dbPath = (process.env.DATABASE_URL ?? 'file:./data/db.sqlite').replace(
  /^file:/,
  ''
);

const sqlite = new Database(dbPath, { create: true });
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: './src/lib/db/migrations' });
sqlite.close();

console.log('migrations applied');
