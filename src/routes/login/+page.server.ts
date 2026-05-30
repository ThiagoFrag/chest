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
import { getSetting } from '$lib/settings';
import type { Actions, PageServerLoad } from './$types';

const DISCORD_ERROR_MESSAGES: Record<string, string> = {
  denied: 'autorização cancelada',
  invalid_state: 'sessão expirou, tente de novo',
  no_code: 'resposta inválida do Discord',
  token: 'falha ao trocar o token de acesso',
  no_account: 'nenhuma conta vinculada a esse Discord',
  not_in_guild: 'você não faz parte do servidor exigido',
  '2fa_required': 'confirme o segundo fator pra continuar',
  disabled: 'login com Discord está desativado'
};

function describeDiscordError(reason: string | null): string {
  if (!reason) return 'tente novamente';
  return DISCORD_ERROR_MESSAGES[reason] ?? 'erro inesperado';
}

const SESSION_COOKIE = 'forja_session';

const loginSchema = z.object({
  username: z.string().trim().min(1, 'usuário obrigatório'),
  password: z.string().min(1, 'senha obrigatória')
});

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.user) throw redirect(303, '/servers');
  const discordEnabled = !!(await getSetting('discord.oauth_client_id'));
  const discordError =
    url.searchParams.get('error') === 'discord'
      ? describeDiscordError(url.searchParams.get('reason'))
      : null;
  return { discordEnabled, discordError };
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
