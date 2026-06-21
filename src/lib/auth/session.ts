import { eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { db, schema } from '$lib/db';
import type { User } from '$lib/db/schema';

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;
const REFRESH_THRESHOLD_MS = SESSION_DURATION_MS / 2;

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
}

function hashToken(token: string): string {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export async function createSession(
  token: string,
  userId: string,
  opts: { needs2fa?: boolean } = {}
): Promise<void> {
  const id = hashToken(token);
  await db()
    .insert(schema.sessions)
    .values({
      id,
      userId,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      passed2fa: !opts.needs2fa
    });
}

export async function markSession2faPassed(token: string): Promise<void> {
  const id = hashToken(token);
  await db()
    .update(schema.sessions)
    .set({ passed2fa: true })
    .where(eq(schema.sessions.id, id));
}

export async function validateSession(
  token: string
): Promise<{ user: User; refresh: boolean; passed2fa: boolean } | null> {
  const id = hashToken(token);
  const rows = await db()
    .select({ session: schema.sessions, user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(eq(schema.sessions.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const now = Date.now();
  const expiresAt = row.session.expiresAt.getTime();

  if (now >= expiresAt) {
    await db().delete(schema.sessions).where(eq(schema.sessions.id, id));
    return null;
  }

  let refresh = false;
  if (expiresAt - now < REFRESH_THRESHOLD_MS) {
    await db()
      .update(schema.sessions)
      .set({ expiresAt: new Date(now + SESSION_DURATION_MS) })
      .where(eq(schema.sessions.id, id));
    refresh = true;
  }

  return { user: row.user, refresh, passed2fa: !!row.session.passed2fa };
}

export async function deleteSession(token: string): Promise<void> {
  const id = hashToken(token);
  await db().delete(schema.sessions).where(eq(schema.sessions.id, id));
}

export async function deleteUserSessions(userId: string): Promise<void> {
  await db().delete(schema.sessions).where(eq(schema.sessions.userId, userId));
}
