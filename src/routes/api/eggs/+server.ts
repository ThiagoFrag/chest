import { json } from '@sveltejs/kit';
import { requireRole } from '$lib/auth/permissions';
import { loadAllEggs } from '$lib/eggs/loader';
import { toSummary } from '$lib/eggs/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
  requireRole(locals.user, 'viewer');
  const force = url.searchParams.get('refresh') === '1';
  const eggs = await loadAllEggs(force);
  return json({ eggs: eggs.map(toSummary) });
};
