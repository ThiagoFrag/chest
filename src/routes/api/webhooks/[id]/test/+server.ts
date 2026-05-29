import { json, error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/db';
import { requireRole } from '$lib/auth/permissions';
import { hmacSha256Hex } from '$lib/webhooks/signing';
import { logAudit } from '$lib/audit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  const { params, locals } = event;
  requireRole(locals.user, 'admin');
  if (!params.id) throw error(400);

  const wh = await db()
    .select()
    .from(schema.webhookEndpoints)
    .where(eq(schema.webhookEndpoints.id, params.id))
    .get();
  if (!wh) throw error(404, 'webhook não encontrado');

  const payload = JSON.stringify({
    event: 'webhook.test',
    timestamp: new Date().toISOString(),
    panel: { name: 'Chest', version: '0.1.0' },
    data: { ping: 'pong', message: 'se você vê isso, a assinatura HMAC está correta' }
  });
  const signature = await hmacSha256Hex(wh.secret, payload);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(wh.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'Chest-Webhook/1.0',
        'x-chest-signature': `sha256=${signature}`,
        'x-chest-event': 'webhook.test'
      },
      body: payload,
      signal: controller.signal
    });
    const ok = res.ok;
    await db()
      .update(schema.webhookEndpoints)
      .set({
        lastDeliveryAt: new Date(),
        lastDeliveryStatus: ok ? 'ok' : 'fail',
        lastDeliveryMessage: `test HTTP ${res.status}`,
        consecutiveFailures: ok ? 0 : wh.consecutiveFailures + 1
      })
      .where(eq(schema.webhookEndpoints.id, params.id));

    await logAudit(event, {
      action: 'webhook.tested',
      resourceType: 'webhook',
      resourceId: params.id,
      status: ok ? 'ok' : 'fail',
      details: { httpStatus: res.status }
    });

    return json({ ok, status: res.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    await db()
      .update(schema.webhookEndpoints)
      .set({
        lastDeliveryAt: new Date(),
        lastDeliveryStatus: 'fail',
        lastDeliveryMessage: `test: ${msg}`,
        consecutiveFailures: wh.consecutiveFailures + 1
      })
      .where(eq(schema.webhookEndpoints.id, params.id));

    await logAudit(event, {
      action: 'webhook.tested',
      resourceType: 'webhook',
      resourceId: params.id,
      status: 'fail',
      details: { error: msg }
    });

    throw error(502, msg);
  } finally {
    clearTimeout(timer);
  }
};
