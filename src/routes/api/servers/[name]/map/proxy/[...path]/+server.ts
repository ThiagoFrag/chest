import { error } from '@sveltejs/kit';
import { requireServerPermission } from '$lib/auth/require-server-permission';
import { proxyToMap } from '$lib/mc/map-proxy';
import type { RequestHandler } from './$types';

// BlueMap requires paths with trailing slash; SvelteKit would otherwise issue a 308 redirect.
export const trailingSlash = 'ignore';

export const GET: RequestHandler = async (event) => {
  if (!event.params.name) throw error(400);
  await requireServerPermission(event, event.params.name, 'view_logs');
  return proxyToMap(event, event.params.name, event.params.path ?? '');
};
