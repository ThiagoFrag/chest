import { json, error } from '@sveltejs/kit';
import { db, schema } from '$lib/db';
import { requireRole } from '$lib/auth/permissions';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  requireRole(locals.user, 'admin');

  const users = await db()
    .select({
      id: schema.users.id,
      username: schema.users.username,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
      lastLoginAt: schema.users.lastLoginAt
    })
    .from(schema.users);

  return json({ users });
};
