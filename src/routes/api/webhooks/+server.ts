import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { db, schema } from '$lib/db';
import { requireRole } from '$lib/auth/permissions';
import { WEBHOOK_EVENTS } from '$lib/webhooks/types';
import { generateWebhookSecret } from '$lib/webhooks/signing';
import { logAudit } from '$lib/audit';
import type { RequestHandler } from './$types';

function maskUrl(raw: string): string {
  try {
    const u = new URL(raw);
    return `${u.protocol}//${u.host}`;
  } catch {
    return '***';
  }
}

function newId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return encodeHexLowerCase(bytes);
}

const createSchema = z.object({
  name: z.string().min(1).max(80),
  url: z.string().url(),
  events: z.array(z.string()).min(1).default(['*']),
  serverId: z.string().nullable().optional()
});

export const GET: RequestHandler = async ({ locals }) => {
  requireRole(locals.user, 'admin');

  const rows = await db()
    .select({
      id: schema.webhookEndpoints.id,
      name: schema.webhookEndpoints.name,
      url: schema.webhookEndpoints.url,
      enabled: schema.webhookEndpoints.enabled,
      eventsJson: schema.webhookEndpoints.eventsJson,
      serverId: schema.webhookEndpoints.serverId,
      lastDeliveryStatus: schema.webhookEndpoints.lastDeliveryStatus,
      consecutiveFailures: schema.webhookEndpoints.consecutiveFailures,
      createdAt: schema.webhookEndpoints.createdAt
    })
    .from(schema.webhookEndpoints)
    .orderBy(desc(schema.webhookEndpoints.createdAt));

  return json({
    webhooks: rows.map((r) => ({
      id: r.id,
      name: r.name,
      url: maskUrl(r.url),
      enabled: r.enabled,
      events: JSON.parse(r.eventsJson) as string[],
      serverId: r.serverId,
      last_delivery_status: r.lastDeliveryStatus,
      consecutive_failures: r.consecutiveFailures,
      createdAt: r.createdAt
    })),
    availableEvents: WEBHOOK_EVENTS
  });
};

export const POST: RequestHandler = async (event) => {
  const { locals, request } = event;
  requireRole(locals.user, 'admin');

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    throw error(400, parsed.error.issues[0]?.message ?? 'body inválido');

  if (parsed.data.serverId) {
    const exists = await db()
      .select({ id: schema.servers.id })
      .from(schema.servers)
      .where(eq(schema.servers.id, parsed.data.serverId))
      .get();
    if (!exists) throw error(400, 'serverId não existe');
  }

  const secret = generateWebhookSecret();
  const id = newId();

  await db()
    .insert(schema.webhookEndpoints)
    .values({
      id,
      name: parsed.data.name,
      url: parsed.data.url,
      secret,
      eventsJson: JSON.stringify(parsed.data.events),
      serverId: parsed.data.serverId ?? null,
      enabled: true,
      createdBy: locals.user!.id
    });

  await logAudit(event, {
    action: 'webhook.created',
    resourceType: 'webhook',
    resourceId: id,
    details: {
      url: parsed.data.url,
      events: parsed.data.events,
      serverId: parsed.data.serverId ?? null
    }
  });

  return json({ id, secret }, { status: 201 });
};
