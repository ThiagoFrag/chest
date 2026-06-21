/**
 * Cria o admin inicial se não existir. Idempotente.
 * Gera senha aleatória 24-char base64 e imprime no stdout uma vez.
 */
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { hash } from '@node-rs/argon2';
import { encodeBase64 } from '@oslojs/encoding';
import { eq } from 'drizzle-orm';
import { users } from '../src/lib/db/schema';

const dbPath = (process.env.DATABASE_URL ?? 'file:./data/db.sqlite').replace(
  /^file:/,
  ''
);
const sqlite = new Database(dbPath, { create: true });
const db = drizzle(sqlite);

const username = process.env.ADMIN_USERNAME ?? 'admin';

const existing = await db.select().from(users).where(eq(users.username, username));
if (existing.length > 0) {
  console.log(`[seed-admin] admin "${username}" já existe.`);
  sqlite.close();
  process.exit(0);
}

const random = new Uint8Array(18);
crypto.getRandomValues(random);
const password = encodeBase64(random).replace(/[+/=]/g, '').slice(0, 24);

const passwordHash = await hash(password, {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1
});

const id = crypto.randomUUID();
await db.insert(users).values({ id, username, passwordHash });

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('  FORJA — credenciais do admin (mostrado UMA vez)');
console.log('═══════════════════════════════════════════════════════');
console.log(`  usuário:  ${username}`);
console.log(`  senha:    ${password}`);
console.log('═══════════════════════════════════════════════════════');
console.log('  Salve no password manager. Não vai aparecer de novo.');
console.log('');

sqlite.close();
