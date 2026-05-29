import { json } from '@sveltejs/kit';
import { requireRole } from '$lib/auth/permissions';
import { buildSpec } from '$lib/openapi/spec';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ locals }) => {
  requireRole(locals.user, 'viewer');
  return json(buildSpec(), {
    headers: {
      'cache-control': 'private, max-age=60'
    }
  });
};
