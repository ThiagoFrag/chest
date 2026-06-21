import { error, redirect, isRedirect, isHttpError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/db';
import { eq, sql } from 'drizzle-orm';
import { getSetting } from '$lib/settings';
import {
  exchangeCode,
  fetchDiscordUser,
  fetchUserGuildIds
} from '$lib/auth/discord-oauth';
import { generateSessionToken, createSession } from '$lib/auth/session';
import { logAudit } from '$lib/audit';

const SESSION_COOKIE = 'forja_session';
const STATE_COOKIE = 'discord_oauth_state';
const VERIFIER_COOKIE = 'discord_oauth_verifier';
const MODE_COOKIE = 'discord_oauth_mode';

const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function sanitizeBase(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .replace(/^_+|_+$/g, '');
  return cleaned.length >= 3 ? cleaned : `user_${cleaned}`.slice(0, 32);
}

async function uniqueUsername(base: string): Promise<string> {
  const root = sanitizeBase(base);
  let candidate = root;
  let suffix = 2;
  for (;;) {
    const taken = await db()
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.username, candidate))
      .get();
    if (!taken) return candidate;
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
}

export const GET: RequestHandler = async (event) => {
  const { url, cookies, locals } = event;

  const code = url.searchParams.get('code');
  const queryState = url.searchParams.get('state');

  const cookieState = cookies.get(STATE_COOKIE) ?? null;
  const verifier = cookies.get(VERIFIER_COOKIE) ?? null;
  const mode = cookies.get(MODE_COOKIE) === 'link' ? 'link' : 'login';

  cookies.delete(STATE_COOKIE, { path: '/' });
  cookies.delete(VERIFIER_COOKIE, { path: '/' });
  cookies.delete(MODE_COOKIE, { path: '/' });

  if (!code || !verifier || !cookieState || !queryState || cookieState !== queryState) {
    throw error(400, 'Estado inválido. Tente entrar com o Discord novamente.');
  }

  try {
    const clientId = await getSetting('discord.oauth_client_id');
    const clientSecret = await getSetting('discord.oauth_client_secret');
    if (!clientId || !clientSecret) {
      throw error(503, 'Login com Discord não configurado.');
    }

    const redirectUri = new URL('/login/discord/callback', url.origin).toString();
    const { accessToken } = await exchangeCode({
      clientId,
      clientSecret,
      code,
      redirectUri,
      verifier
    });

    const discord = await fetchDiscordUser(accessToken);

    let user = await db()
      .select()
      .from(schema.users)
      .where(eq(schema.users.discordId, discord.id))
      .get();

    let outcome: 'login' | 'link' | 'register' = 'login';

    if (user) {
      outcome = 'login';
    } else if (mode === 'link' && locals.user) {
      try {
        await db()
          .update(schema.users)
          .set({
            discordId: discord.id,
            discordUsername: discord.username,
            discordAvatar: discord.avatar
          })
          .where(eq(schema.users.id, locals.user.id));
      } catch (err) {
        if (err instanceof Error && /unique/i.test(err.message)) {
          throw error(409, 'Este Discord já está vinculado a outra conta.');
        }
        throw err;
      }

      user = await db()
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, locals.user.id))
        .get();
      outcome = 'link';
    } else {
      const countRow = await db()
        .select({ count: sql<number>`count(*)` })
        .from(schema.users)
        .get();
      const userCount = countRow?.count ?? 0;

      const baseName = discord.globalName || discord.username;

      if (userCount === 0) {
        const username = await uniqueUsername(baseName);
        const id = crypto.randomUUID();
        await db().insert(schema.users).values({
          id,
          username,
          passwordHash: null,
          role: 'admin',
          discordId: discord.id,
          discordUsername: discord.username,
          discordAvatar: discord.avatar
        });
        user = await db()
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, id))
          .get();
        outcome = 'register';
      } else {
        const guildId = await getSetting('discord.oauth_guild_id');
        if (!guildId) {
          throw error(
            403,
            'Criação de conta via Discord desativada. Peça a um admin pra vincular sua conta.'
          );
        }

        const guildIds = await fetchUserGuildIds(accessToken);
        if (!guildIds.includes(guildId)) {
          throw error(403, 'Você precisa ser membro do servidor Discord autorizado.');
        }

        const username = await uniqueUsername(baseName);
        const id = crypto.randomUUID();
        await db().insert(schema.users).values({
          id,
          username,
          passwordHash: null,
          role: 'viewer',
          discordId: discord.id,
          discordUsername: discord.username,
          discordAvatar: discord.avatar
        });
        user = await db()
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, id))
          .get();
        outcome = 'register';
      }
    }

    if (!user) {
      throw error(500, 'Não foi possível resolver a conta.');
    }

    const token = generateSessionToken();
    const needs2fa = !!user.totpEnabledAt;
    await createSession(token, user.id, { needs2fa });

    cookies.set(SESSION_COOKIE, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_MAX_AGE
    });

    const action =
      outcome === 'link'
        ? 'auth.discord.link'
        : outcome === 'register'
          ? 'auth.discord.register'
          : 'auth.discord.login';

    await logAudit(event, {
      action,
      resourceType: 'user',
      resourceId: user.id,
      details: { discordId: discord.id, discordUsername: discord.username },
      status: 'ok'
    });

    if (needs2fa) {
      throw redirect(302, '/login/2fa');
    }
    if (outcome === 'link') {
      throw redirect(302, '/security');
    }
    throw redirect(302, '/servers');
  } catch (err) {
    if (isRedirect(err) || isHttpError(err)) {
      throw err;
    }
    console.error('[discord oauth callback] unexpected error:', err);
    throw redirect(302, '/login?error=discord');
  }
};
