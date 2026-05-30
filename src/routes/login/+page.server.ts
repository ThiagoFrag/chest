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
import { tServer } from '$lib/i18n/server';
import type { Locale } from '$lib/i18n/types';
import type { Actions, PageServerLoad } from './$types';

const DISCORD_ERROR_KEYS: Record<string, string> = {
  denied: 'serverrors.discord.denied',
  invalid_state: 'serverrors.discord.invalidState',
  no_code: 'serverrors.discord.noCode',
  token: 'serverrors.discord.token',
  no_account: 'serverrors.discord.noAccount',
  not_in_guild: 'serverrors.discord.notInGuild',
  '2fa_required': 'serverrors.discord.2faRequired',
  disabled: 'serverrors.discord.disabled'
};

function describeDiscordError(locale: Locale, reason: string | null): string {
  if (!reason) return tServer(locale, 'serverrors.discord.retry');
  const key = DISCORD_ERROR_KEYS[reason] ?? 'serverrors.discord.unexpected';
  return tServer(locale, key);
}

const SESSION_COOKIE = 'forja_session';

const loginSchema = z.object({
  username: z.string().trim().min(1, 'serverrors.login.usernameRequired'),
  password: z.string().min(1, 'serverrors.login.passwordRequired')
});

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.user) throw redirect(303, '/servers');
  const discordEnabled = !!(await getSetting('discord.oauth_client_id'));
  const discordError =
    url.searchParams.get('error') === 'discord'
      ? describeDiscordError(locals.locale, url.searchParams.get('reason'))
      : null;
  return { discordEnabled, discordError };
};

export const actions: Actions = {
  default: async (event) => {
    const { request, cookies, url, locals } = event;
    const form = await request.formData();
    const parsed = loginSchema.safeParse({
      username: form.get('username'),
      password: form.get('password')
    });

    if (!parsed.success) {
      const key = parsed.error.issues[0]?.message ?? 'serverrors.login.invalidData';
      return fail(400, {
        username: String(form.get('username') ?? ''),
        error: tServer(locals.locale, key)
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
      return fail(401, { username, error: tServer(locals.locale, 'serverrors.login.invalidCredentials') });
    }

    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) {
      await logAudit(event, { action: 'auth.login', status: 'fail', details: { username, reason: 'wrong_password' } });
      return fail(401, { username, error: tServer(locals.locale, 'serverrors.login.invalidCredentials') });
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
