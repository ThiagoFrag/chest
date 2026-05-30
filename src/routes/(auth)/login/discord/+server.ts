import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSetting } from '$lib/settings';
import { generateState, generatePkce, buildAuthorizeUrl } from '$lib/auth/discord-oauth';

const STATE_COOKIE = 'discord_oauth_state';
const VERIFIER_COOKIE = 'discord_oauth_verifier';
const MODE_COOKIE = 'discord_oauth_mode';
const FLOW_MAX_AGE = 60 * 10;

export const GET: RequestHandler = async ({ url, cookies, locals }) => {
  const clientId = await getSetting('discord.oauth_client_id');
  if (!clientId) {
    throw error(503, 'Login com Discord não configurado.');
  }

  const mode = url.searchParams.get('mode') === 'link' ? 'link' : 'login';
  if (mode === 'link' && !locals.user) {
    throw redirect(302, '/login');
  }

  const state = generateState();
  const pkce = await generatePkce();

  const cookieOpts = {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: FLOW_MAX_AGE
  };

  cookies.set(STATE_COOKIE, state, cookieOpts);
  cookies.set(VERIFIER_COOKIE, pkce.verifier, cookieOpts);
  cookies.set(MODE_COOKIE, mode, cookieOpts);

  const redirectUri = new URL('/login/discord/callback', url.origin).toString();

  throw redirect(
    302,
    buildAuthorizeUrl({ clientId, redirectUri, state, challenge: pkce.challenge })
  );
};
