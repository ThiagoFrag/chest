import { requireRole } from '$lib/auth/permissions';
import { loadAllEggs } from '$lib/eggs/loader';
import { toSummary } from '$lib/eggs/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  requireRole(locals.user, 'viewer');
  const eggs = await loadAllEggs();
  return { eggs: eggs.map(toSummary) };
};
