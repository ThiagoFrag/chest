import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/db';
import { requireRole } from '$lib/auth/permissions';
import { deleteUserSessions } from '$lib/auth/session';
import type { RequestHandler } from './$types';

const patchSchema = z.object({
  role: z.enum(['admin', 'operator', 'viewer'])
});

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  const me = requireRole(locals.user, 'admin');
  if (!params.id) throw error(400);
  if (me.id === params.id) throw error(400, 'não pode mudar sua própria role');

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) throw error(400);

  await db()
    .update(schema.users)
    .set({ role: parsed.data.role })
    .where(eq(schema.users.id, params.id));

  return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const me = requireRole(locals.user, 'admin');
  if (!params.id) throw error(400);
  if (me.id === params.id) throw error(400, 'não pode deletar a si mesmo');

  await deleteUserSessions(params.id);
  await db().delete(schema.users).where(eq(schema.users.id, params.id));

  return new Response(null, { status: 204 });
};
