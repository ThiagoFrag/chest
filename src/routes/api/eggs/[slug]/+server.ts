import { json, error } from '@sveltejs/kit';
import { requireRole } from '$lib/auth/permissions';
import { getEgg } from '$lib/eggs/loader';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
  requireRole(locals.user, 'viewer');
  if (!params.slug) throw error(400);
  const egg = await getEgg(params.slug);
  if (!egg) throw error(404, 'egg não encontrado');
  return json({ egg });
};
