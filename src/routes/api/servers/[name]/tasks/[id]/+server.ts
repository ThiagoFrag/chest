import { requireServerPermission } from '$lib/auth/require-server-permission';
import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/db';
import { parseCron, nextRunAt } from '$lib/scheduler/cron';
import { logAudit } from '$lib/audit';
import type { RequestHandler } from './$types';

const patchSchema = z.object({
  cronExpr: z.string().trim().min(1).optional(),
  params: z.record(z.string(), z.any()).optional(),
  enabled: z.boolean().optional()
});

export const PATCH: RequestHandler = async (event) => {
  const { params, request } = event;
  await requireServerPermission(event, params.name!, 'manage_scheduled');
  if (!params.id) throw error(400);

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) throw error(400);

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.cronExpr !== undefined) {
    try {
      parseCron(parsed.data.cronExpr);
    } catch (err) {
      throw error(400, `cron inválido: ${err instanceof Error ? err.message : 'erro'}`);
    }
    updates.cronExpr = parsed.data.cronExpr;
    updates.nextRunAt = nextRunAt(parsed.data.cronExpr);
  }
  if (parsed.data.params !== undefined)
    updates.params = JSON.stringify(parsed.data.params);
  if (parsed.data.enabled !== undefined) updates.enabled = parsed.data.enabled;

  await db()
    .update(schema.scheduledTasks)
    .set(updates)
    .where(eq(schema.scheduledTasks.id, params.id));

  await logAudit(event, {
    action: 'server.task.update',
    resourceType: 'server',
    resourceId: params.name,
    details: {
      taskId: params.id,
      ...(parsed.data.cronExpr !== undefined ? { cronExpr: parsed.data.cronExpr } : {}),
      ...(parsed.data.params !== undefined ? { params: parsed.data.params } : {}),
      ...(parsed.data.enabled !== undefined ? { enabled: parsed.data.enabled } : {})
    }
  });

  return json({ ok: true });
};

export const DELETE: RequestHandler = async (event) => {
  const { params } = event;
  await requireServerPermission(event, params.name!, 'manage_scheduled');
  if (!params.id) throw error(400);
  await db().delete(schema.scheduledTasks).where(eq(schema.scheduledTasks.id, params.id));

  await logAudit(event, {
    action: 'server.task.delete',
    resourceType: 'server',
    resourceId: params.name,
    details: { taskId: params.id }
  });

  return new Response(null, { status: 204 });
};
