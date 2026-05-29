export const WEBHOOK_EVENTS = [
  'server.created',
  'server.started',
  'server.stopped',
  'server.restarted',
  'server.crashed',
  'server.deleted',
  'backup.created',
  'backup.restored',
  'player.joined',
  'player.left',
  'auth.login',
  'auth.totp.enabled',
  'auth.totp.disabled',
  'task.ran',
  'subuser.added',
  'subuser.removed'
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export interface WebhookPayload<T = unknown> {
  event: WebhookEvent | string;
  timestamp: string;
  panel: { name: string; version: string };
  data: T;
}

export function eventMatches(subscribed: string[], event: string): boolean {
  if (subscribed.includes('*')) return true;
  if (subscribed.includes(event)) return true;
  for (const pattern of subscribed) {
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2);
      if (event === prefix || event.startsWith(`${prefix}.`)) return true;
    }
  }
  return false;
}
