import { requireServerPermission } from '$lib/auth/require-server-permission';
import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/db';
import { parseCron, nextRunAt } from '$lib/scheduler/cron';
import { logAudit } from '$lib/audit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  const { params } = event;
  if (!params.name) throw error(400);
  const { server } = await requireServerPermission(
    event,
    params.name,
    'manage_scheduled'
  );

  const tasks = await db()
    .select()
    .from(schema.scheduledTasks)
    .where(eq(schema.scheduledTasks.serverId, server.id))
    .orderBy(schema.scheduledTasks.createdAt);

  return json({ tasks });
};

const createSchema = z.object({
  taskType: z.enum(['backup', 'restart', 'command']),
  cronExpr: z.string().trim().min(1),
  params: z.record(z.string(), z.any()).default({}),
  enabled: z.boolean().default(true)
});

export const POST: RequestHandler = async (event) => {
  const { params, request } = event;
  if (!params.name) throw error(400);
  const { server } = await requireServerPermission(
    event,
    params.name,
    'manage_scheduled'
  );

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) throw error(400, parsed.error.issues[0]?.message ?? 'inválido');

  try {
    parseCron(parsed.data.cronExpr);
  } catch (err) {
    throw error(400, `cron inválido: ${err instanceof Error ? err.message : 'erro'}`);
  }

  const id = crypto.randomUUID();
  const next = nextRunAt(parsed.data.cronExpr);
  await db()
    .insert(schema.scheduledTasks)
    .values({
      id,
      serverId: server.id,
      taskType: parsed.data.taskType,
      cronExpr: parsed.data.cronExpr,
      params: JSON.stringify(parsed.data.params),
      enabled: parsed.data.enabled,
      nextRunAt: next
    });

  await logAudit(event, {
    action: 'server.task.create',
    resourceType: 'server',
    resourceId: params.name,
    details: {
      taskId: id,
      taskType: parsed.data.taskType,
      cronExpr: parsed.data.cronExpr,
      enabled: parsed.data.enabled
    }
  });

  return json({ id, nextRunAt: next }, { status: 201 });
};
