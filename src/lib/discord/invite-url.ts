// Permissions the bot actually needs:
//   VIEW_CHANNEL        1 << 10  = 1024
//   SEND_MESSAGES       1 << 11  = 2048
//   EMBED_LINKS         1 << 14  = 16384   (lifecycle/notification embeds)
//   READ_MESSAGE_HISTORY 1 << 16 = 65536   (chat bridge)
//   MANAGE_WEBHOOKS     1 << 29  = 536870912
const REQUIRED_PERMS = String(1024 + 2048 + 16384 + 65536 + 536870912); // 536955904

export function buildInviteUrl(applicationId: string): string {
  const params = new URLSearchParams({
    client_id: applicationId,
    scope: 'bot applications.commands',
    permissions: REQUIRED_PERMS
  });
  return `https://discord.com/oauth2/authorize?${params}`;
}

export function botInviteHint(): string {
  return 'View Channel, Send Messages, Embed Links, Read Message History, Manage Webhooks';
}

/**
 * A Discord bot token is `<base64url(application_id)>.<base64(timestamp)>.<hmac>`.
 * The first segment decodes to the numeric application (client) ID, so we can
 * build the invite URL right after the token is pasted — no gateway login first.
 * Returns null if the token doesn't look like a bot token.
 */
export function extractAppIdFromToken(token: string): string | null {
  const first = token.trim().split('.')[0];
  if (!first) return null;
  try {
    // base64url -> base64
    const b64 = first.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(b64, 'base64').toString('utf8');
    // application IDs are 17-20 digit snowflakes
    return /^\d{17,20}$/.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}
