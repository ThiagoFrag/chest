import { json, error } from '@sveltejs/kit';
import { listTextChannels } from '$lib/discord/bot';
import { requireRole } from '$lib/auth/permissions';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  requireRole(locals.user, 'operator');
  if (!params.guildId) throw error(400);
  const channels = await listTextChannels(params.guildId);
  return json({ channels });
};
