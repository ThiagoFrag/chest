import { json, error } from '@sveltejs/kit';
import { getStatus } from '$lib/discord/bot';
import { requireRole } from '$lib/auth/permissions';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  requireRole(locals.user, 'admin');
  const status = await getStatus();
  return json(status);
};
