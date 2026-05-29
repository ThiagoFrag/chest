import { error } from '@sveltejs/kit';
import { requireRole } from '$lib/auth/permissions';
import { proxyToMap } from '$lib/mc/map-proxy';
import type { RequestHandler } from './$types';

// BlueMap requires paths with trailing slash; SvelteKit would otherwise issue a 308 redirect.
export const trailingSlash = 'ignore';

export const GET: RequestHandler = async (event) => {
  requireRole(event.locals.user, 'viewer');
  if (!event.params.name) throw error(400);
  return proxyToMap(event, event.params.name, event.params.path ?? '');
};
