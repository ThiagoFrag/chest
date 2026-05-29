import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/db';
import { requireRole } from '$lib/auth/permissions';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals }) => {
  requireRole(locals.user, 'admin');
  if (!params.id) throw error(400);

  await db().delete(schema.invites).where(eq(schema.invites.id, params.id));
  return new Response(null, { status: 204 });
};
