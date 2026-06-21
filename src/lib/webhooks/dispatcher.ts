import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { and, eq, or, isNull } from 'drizzle-orm';
import { logFail } from '$lib/safe';
import { eventMatches } from './types';
import * as schema from '$lib/db/schema';

// Lazy-loaded so callers that only use signPayload/generateSecret (tests, edge
// runtimes) don't trigger bun:sqlite resolution.
type DbModule = typeof import('$lib/db');
let dbModule: DbModule | null = null;
async function getDb(): Promise<DbModule['db']> {
  if (!dbModule) dbModule = await import('$lib/db');
  return dbModule.db;
}

const RETRY_DELAYS_MS = [1_000, 5_000, 30_000];
const TIMEOUT_MS = 10_000;
const DISABLE_AFTER_CONSECUTIVE_FAILURES = 10;

export interface WebhookEvent<T = Record<string, unknown>> {
  type: string;
  serverId?: string | null;
  payload: T;
}

interface DeliveryBody {
  id: string;
  event: string;
  timestamp: string;
  serverId: string | null;
  payload: unknown;
}

type EndpointRow = typeof schema.webhookEndpoints.$inferSelect;

/**
 * Global entrypoint. Fan-outs the event to every matching webhook endpoint.
 * Non-blocking: dispatches run in the background, errors are logged.
 */
export function emitEvent<T>(event: WebhookEvent<T>): void {
  void logFail(emitEventAsync(event), `webhooks:emit:${event.type}`);
}

export async function emitEventAsync<T>(event: WebhookEvent<T>): Promise<void> {
  const serverId = event.serverId ?? null;

  const db = await getDb();
  const rows = await db()
    .select()
    .from(schema.webhookEndpoints)
    .where(
      and(
        eq(schema.webhookEndpoints.enabled, true),
        serverId
          ? or(
              isNull(schema.webhookEndpoints.serverId),
              eq(schema.webhookEndpoints.serverId, serverId)
            )
          : isNull(schema.webhookEndpoints.serverId)
      )
    );

  const matches = rows.filter((row: EndpointRow) => {
    try {
      const subscribed = JSON.parse(row.eventsJson) as string[];
      return eventMatches(subscribed, event.type);
    } catch {
      return false;
    }
  });

  // Fire and forget per endpoint — caller must not wait.
  for (const row of matches) {
    void logFail(dispatch(row, event), `webhooks:dispatch:${row.id}`);
  }
}

/**
 * Individual delivery with retry/backoff and persistence.
 * Exposed for direct re-delivery / testing.
 */
export async function dispatch<T>(
  endpoint: EndpointRow,
  event: WebhookEvent<T>
): Promise<void> {
  const body: DeliveryBody = {
    id: randomUUID(),
    event: event.type,
    timestamp: new Date().toISOString(),
    serverId: event.serverId ?? null,
    payload: event.payload as unknown
  };
  const serialized = JSON.stringify(body);
  const signature = signPayload(endpoint.secret, serialized);

  let lastMessage = 'no attempt';

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAYS_MS[attempt - 1]);
    }
    const result = await deliverOnce(endpoint.url, serialized, signature, body);
    lastMessage = result.message;

    if (result.outcome === 'success') {
      await recordSuccess(endpoint.id, result.message);
      return;
    }
    if (result.outcome === 'permanent') {
      await recordFailure(endpoint.id, result.message, endpoint.consecutiveFailures + 1);
      return;
    }
    // retryable — fall through to next attempt
  }

  await recordFailure(endpoint.id, lastMessage, endpoint.consecutiveFailures + 1);
}

type DeliveryOutcome = 'success' | 'permanent' | 'retry';

async function deliverOnce(
  url: string,
  body: string,
  signature: string,
  meta: DeliveryBody
): Promise<{ outcome: DeliveryOutcome; message: string }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Chest-Signature': signature,
        'X-Chest-Event': meta.event,
        'X-Chest-Delivery': meta.id
      },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    const snippet = await safeSnippet(res);
    const message = `HTTP ${res.status}${snippet ? ` ${snippet}` : ''}`;

    if (res.status >= 200 && res.status < 400) {
      return { outcome: 'success', message: `HTTP ${res.status}` };
    }
    if (res.status >= 400 && res.status < 500) {
      return { outcome: 'permanent', message };
    }
    return { outcome: 'retry', message };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'network error';
    return { outcome: 'retry', message };
  }
}

async function safeSnippet(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return text.slice(0, 200);
  } catch {
    return '';
  }
}

async function recordSuccess(id: string, message: string): Promise<void> {
  const db = await getDb();
  await db()
    .update(schema.webhookEndpoints)
    .set({
      lastDeliveryAt: new Date(),
      lastDeliveryStatus: 'ok',
      lastDeliveryMessage: message.slice(0, 500),
      consecutiveFailures: 0
    })
    .where(eq(schema.webhookEndpoints.id, id));
}

async function recordFailure(
  id: string,
  message: string,
  failureCount: number
): Promise<void> {
  const shouldDisable = failureCount >= DISABLE_AFTER_CONSECUTIVE_FAILURES;
  const db = await getDb();
  await db()
    .update(schema.webhookEndpoints)
    .set({
      lastDeliveryAt: new Date(),
      lastDeliveryStatus: 'fail',
      lastDeliveryMessage: message.slice(0, 500),
      consecutiveFailures: failureCount,
      ...(shouldDisable ? { enabled: false } : {})
    })
    .where(eq(schema.webhookEndpoints.id, id));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sync HMAC-SHA256 signing. Returns `sha256=<hex>` ready for the header.
 */
export function signPayload(secret: string, body: string): string {
  const hex = createHmac('sha256', secret).update(body).digest('hex');
  return `sha256=${hex}`;
}

/**
 * Generate a random hex secret. 32 bytes → 64 hex chars.
 */
export function generateSecret(): string {
  return randomBytes(32).toString('hex');
}

// --- Backwards compatibility -------------------------------------------------

export interface DispatchInput<T = unknown> {
  event: string;
  data: T;
  serverId?: string | null;
}

/**
 * Legacy API kept for existing call sites (docker/server-actions.ts).
 * Prefer `emitEvent` for new code.
 */
export async function dispatchWebhook<T>(input: DispatchInput<T>): Promise<void> {
  await emitEventAsync({
    type: input.event,
    serverId: input.serverId ?? null,
    payload: (input.data ?? {}) as Record<string, unknown>
  });
}
