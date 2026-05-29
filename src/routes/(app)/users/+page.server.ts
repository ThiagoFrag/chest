import { desc, eq } from 'drizzle-orm';
import { db, schema } from '$lib/db';
import { requireRole } from '$lib/auth/permissions';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
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

  const invites = await db()
    .select()
    .from(schema.invites)
    .orderBy(desc(schema.invites.createdAt));

  return {
    users,
    invites,
    baseUrl: `${url.origin}`
  };
};
