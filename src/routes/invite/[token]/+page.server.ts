import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '$lib/db';
import { hashPassword } from '$lib/auth/password';
import { createSession, generateSessionToken } from '$lib/auth/session';
import type { Actions, PageServerLoad } from './$types';

const SESSION_COOKIE = 'forja_session';

export const load: PageServerLoad = async ({ params }) => {
  const inv = await db()
    .select()
    .from(schema.invites)
    .where(eq(schema.invites.token, params.token!))
    .get();

  if (!inv) throw error(404, 'convite não encontrado');
  const expired = (inv.expiresAt instanceof Date ? inv.expiresAt.getTime() : Number(inv.expiresAt) * 1000) < Date.now();
  if (inv.usedAt) throw error(410, 'convite já foi usado');
  if (expired) throw error(410, 'convite expirado');

  return {
    role: inv.role,
    note: inv.note,
    token: inv.token
  };
};

const formSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(200)
});

export const actions: Actions = {
  default: async ({ params, request, cookies, url }) => {
    const inv = await db()
      .select()
      .from(schema.invites)
      .where(eq(schema.invites.token, params.token!))
      .get();
    if (!inv) return fail(404, { error: 'convite inválido' });
    const expired = (inv.expiresAt instanceof Date ? inv.expiresAt.getTime() : Number(inv.expiresAt) * 1000) < Date.now();
    if (inv.usedAt || expired) return fail(410, { error: 'convite indisponível' });

    const form = await request.formData();
    const parsed = formSchema.safeParse({
      username: form.get('username'),
      password: form.get('password')
    });
    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'inválido' });
    }

    const existing = await db()
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, parsed.data.username))
      .get();
    if (existing) return fail(409, { error: 'usuário já existe' });

    const passwordHash = await hashPassword(parsed.data.password);
    const userId = crypto.randomUUID();

    await db()
      .insert(schema.users)
      .values({
        id: userId,
        username: parsed.data.username,
        passwordHash,
        role: inv.role
      });

    await db()
      .update(schema.invites)
      .set({ usedAt: new Date(), usedBy: userId })
      .where(eq(schema.invites.id, inv.id));

    const token = generateSessionToken();
    await createSession(token, userId);
    cookies.set(SESSION_COOKIE, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: url.protocol === 'https:',
      maxAge: 60 * 60 * 24 * 7
    });

    throw redirect(303, '/dashboard');
  }
};
