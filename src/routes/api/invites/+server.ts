import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import { encodeBase32LowerCaseNoPadding } from '@oslojs/encoding';
import { db, schema } from '$lib/db';
import { requireRole } from '$lib/auth/permissions';
import type { RequestHandler } from './$types';

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const GET: RequestHandler = async ({ locals }) => {
  requireRole(locals.user, 'admin');

  const invites = await db()
    .select()
    .from(schema.invites)
    .orderBy(desc(schema.invites.createdAt));

  return json({ invites });
};

const createSchema = z.object({
  role: z.enum(['admin', 'operator', 'viewer']),
  note: z.string().max(120).optional()
});

export const POST: RequestHandler = async ({ request, locals }) => {
  const me = requireRole(locals.user, 'admin');

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) throw error(400);

  const tokenBytes = new Uint8Array(24);
  crypto.getRandomValues(tokenBytes);
  const token = encodeBase32LowerCaseNoPadding(tokenBytes);
  const id = crypto.randomUUID();

  await db()
    .insert(schema.invites)
    .values({
      id,
      token,
      role: parsed.data.role,
      note: parsed.data.note,
      createdBy: me.id,
      expiresAt: new Date(Date.now() + TTL_MS)
    });

  return json({ id, token, role: parsed.data.role }, { status: 201 });
};
