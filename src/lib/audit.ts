import { db, schema } from '$lib/db';
import { desc, eq, and, gte, lt, like, sql } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

export interface AuditInput {
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown> | string;
  status?: 'ok' | 'fail';
}

export async function logAudit(event: RequestEvent, input: AuditInput): Promise<void> {
  const user = event.locals.user;
  const ip =
    event.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    event.request.headers.get('x-real-ip') ??
    event.getClientAddress?.() ??
    null;
  const userAgent = event.request.headers.get('user-agent')?.slice(0, 200) ?? null;
  const details =
    typeof input.details === 'string'
      ? input.details
      : input.details
        ? JSON.stringify(input.details).slice(0, 4000)
        : null;

  try {
    await db().insert(schema.auditEvents).values({
      userId: user?.id ?? null,
      username: user?.username ?? null,
      action: input.action,
      resourceType: input.resourceType ?? null,
      resourceId: input.resourceId ?? null,
      ipAddress: ip,
      userAgent,
      details,
      status: input.status ?? 'ok'
    });
  } catch (err) {
    console.error('[audit] failed to log:', err);
  }
}

export interface AuditQuery {
  limit?: number;
  offset?: number;
  action?: string;
  username?: string;
  status?: 'ok' | 'fail';
  sinceTimestamp?: number;
}

export async function queryAudit(q: AuditQuery = {}) {
  const conditions = [];
  if (q.action) conditions.push(like(schema.auditEvents.action, `%${q.action}%`));
  if (q.username) conditions.push(eq(schema.auditEvents.username, q.username));
  if (q.status) conditions.push(eq(schema.auditEvents.status, q.status));
  if (q.sinceTimestamp) conditions.push(gte(schema.auditEvents.timestamp, new Date(q.sinceTimestamp * 1000)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db()
    .select()
    .from(schema.auditEvents)
    .where(where)
    .orderBy(desc(schema.auditEvents.timestamp))
    .limit(Math.min(q.limit ?? 100, 500))
    .offset(q.offset ?? 0);
}

export async function countAudit(q: AuditQuery = {}): Promise<number> {
  const conditions = [];
  if (q.action) conditions.push(like(schema.auditEvents.action, `%${q.action}%`));
  if (q.username) conditions.push(eq(schema.auditEvents.username, q.username));
  if (q.status) conditions.push(eq(schema.auditEvents.status, q.status));
  if (q.sinceTimestamp) conditions.push(gte(schema.auditEvents.timestamp, new Date(q.sinceTimestamp * 1000)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db()
    .select({ count: sql<number>`count(*)` })
    .from(schema.auditEvents)
    .where(where);
  return rows[0]?.count ?? 0;
}

export async function distinctActions(): Promise<string[]> {
  const rows = await db()
    .selectDistinct({ action: schema.auditEvents.action })
    .from(schema.auditEvents)
    .orderBy(schema.auditEvents.action);
  return rows.map((r) => r.action);
}

export async function pruneOlderThan(days: number): Promise<void> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  await db().delete(schema.auditEvents).where(lt(schema.auditEvents.timestamp, cutoff));
}
