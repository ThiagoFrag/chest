import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/db';
import { requireRole } from '$lib/auth/permissions';
import { logAudit } from '$lib/audit';
import type { RequestHandler } from './$types';

const updateSchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
    url: z.string().url().optional(),
    events: z.array(z.string()).min(1).optional(),
    enabled: z.boolean().optional()
  })
  .refine((d) => Object.keys(d).length > 0, 'pelo menos um campo');

export const PATCH: RequestHandler = async (event) => {
  const { params, locals, request } = event;
  requireRole(locals.user, 'admin');
  if (!params.id) throw error(400);

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) throw error(400, parsed.error.issues[0]?.message ?? 'body inválido');

  const exists = await db()
    .select()
    .from(schema.webhookEndpoints)
    .where(eq(schema.webhookEndpoints.id, params.id))
    .get();
  if (!exists) throw error(404, 'webhook não encontrado');

  const updates: Partial<typeof schema.webhookEndpoints.$inferInsert> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.url !== undefined) updates.url = parsed.data.url;
  if (parsed.data.events !== undefined) updates.eventsJson = JSON.stringify(parsed.data.events);
  if (parsed.data.enabled !== undefined) {
    updates.enabled = parsed.data.enabled;
    if (parsed.data.enabled) updates.consecutiveFailures = 0;
  }

  await db()
    .update(schema.webhookEndpoints)
    .set(updates)
    .where(eq(schema.webhookEndpoints.id, params.id));

  await logAudit(event, {
    action: 'webhook.updated',
    resourceType: 'webhook',
    resourceId: params.id,
    details: parsed.data
  });

  return json({ ok: true });
};

export const DELETE: RequestHandler = async (event) => {
  const { params, locals } = event;
  requireRole(locals.user, 'admin');
  if (!params.id) throw error(400);

  const exists = await db()
    .select({ id: schema.webhookEndpoints.id })
    .from(schema.webhookEndpoints)
    .where(eq(schema.webhookEndpoints.id, params.id))
    .get();
  if (!exists) throw error(404, 'webhook não encontrado');

  await db().delete(schema.webhookEndpoints).where(eq(schema.webhookEndpoints.id, params.id));

  await logAudit(event, {
    action: 'webhook.deleted',
    resourceType: 'webhook',
    resourceId: params.id
  });

  return json({ ok: true });
};
