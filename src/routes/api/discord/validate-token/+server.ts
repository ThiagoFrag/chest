import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireRole } from '$lib/auth/permissions';
import { buildInviteUrl, botInviteHint, extractAppIdFromToken } from '$lib/discord/invite-url';
import type { RequestHandler } from './$types';

const bodySchema = z.object({
  token: z.string().min(1)
});

const DISCORD_API = 'https://discord.com/api/v10';
const TIMEOUT_MS = 8000;

type ValidationResult =
  | { valid: false; reason: string }
  | {
      valid: true;
      applicationId: string;
      botUsername: string;
      inviteUrl: string;
      permissionsHint: string;
    };

export const POST: RequestHandler = async ({ request, locals }) => {
  requireRole(locals.user, 'admin');

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return json({ valid: false, reason: 'corpo inválido' } satisfies ValidationResult, {
      status: 400
    });
  }

  const { token } = parsed.data;

  const applicationId = extractAppIdFromToken(token);
  if (!applicationId) {
    return json({ valid: false, reason: 'formato inválido' } satisfies ValidationResult);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bot ${token}` },
      signal: controller.signal
    });
  } catch (err) {
    const reason =
      err instanceof Error && err.name === 'AbortError'
        ? 'tempo de resposta do Discord esgotado'
        : 'falha de rede ao contatar o Discord';
    return json({ valid: false, reason } satisfies ValidationResult);
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 401) {
    return json({
      valid: false,
      reason: 'token rejeitado pelo Discord'
    } satisfies ValidationResult);
  }

  if (!res.ok) {
    return json({
      valid: false,
      reason: `Discord respondeu com status ${res.status}`
    } satisfies ValidationResult);
  }

  let bot: { id?: string; username?: string };
  try {
    bot = await res.json();
  } catch {
    return json({
      valid: false,
      reason: 'resposta inesperada do Discord'
    } satisfies ValidationResult);
  }

  return json({
    valid: true,
    applicationId,
    botUsername: bot.username ?? '',
    inviteUrl: buildInviteUrl(applicationId),
    permissionsHint: botInviteHint()
  } satisfies ValidationResult);
};
