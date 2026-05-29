import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '$lib/db';
import { verifyPassword } from '$lib/auth/password';
import {
  createSession,
  generateSessionToken
} from '$lib/auth/session';
import { logAudit } from '$lib/audit';
import type { Actions, PageServerLoad } from './$types';

const SESSION_COOKIE = 'forja_session';

const loginSchema = z.object({
  username: z.string().trim().min(1, 'usuário obrigatório'),
  password: z.string().min(1, 'senha obrigatória')
});

export const load: PageServerLoad = ({ locals }) => {
  if (locals.user) throw redirect(303, '/servers');
  return {};
};

export const actions: Actions = {
  default: async (event) => {
    const { request, cookies, url } = event;
    const form = await request.formData();
    const parsed = loginSchema.safeParse({
      username: form.get('username'),
      password: form.get('password')
    });

    if (!parsed.success) {
      return fail(400, {
        username: String(form.get('username') ?? ''),
        error: parsed.error.issues[0]?.message ?? 'dados inválidos'
      });
    }

    const { username, password } = parsed.data;

    const user = await db()
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .get();

    if (!user) {
      await verifyPassword('$argon2id$v=19$m=19456,t=2,p=1$aaaaaaaaaaaaaaaa$bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', password);
      await logAudit(event, { action: 'auth.login', status: 'fail', details: { username, reason: 'unknown_user' } });
      return fail(401, { username, error: 'credenciais inválidas' });
    }

    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) {
      await logAudit(event, { action: 'auth.login', status: 'fail', details: { username, reason: 'wrong_password' } });
      return fail(401, { username, error: 'credenciais inválidas' });
    }

    const token = generateSessionToken();
    await createSession(token, user.id, { needs2fa: !!user.totpEnabledAt });

    await db()
      .update(schema.users)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.users.id, user.id));

    cookies.set(SESSION_COOKIE, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: url.protocol === 'https:',
      maxAge: 60 * 60 * 24 * 7
    });

    event.locals.user = { ...user, role: user.role };
    await logAudit(event, { action: 'auth.login', resourceType: 'user', resourceId: user.id });

    throw redirect(303, user.totpEnabledAt ? '/login/2fa' : '/servers');
  }
};
