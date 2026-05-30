import { redirect, type Handle } from '@sveltejs/kit';
import { validateSession, deleteSession } from '$lib/auth/session';
import { ensureCryptoReady } from '$lib/mc/crypto';
import { startMetricsCollector } from '$lib/mc/metrics-collector';
import { startScheduler } from '$lib/scheduler/runner';
import { startCrashWatcher } from '$lib/mc/crash-watcher';
import { startChatBridge } from '$lib/mc/chat-bridge';
import { pickLocale } from '$lib/i18n/detect';

const SESSION_COOKIE = 'forja_session';
const TWO_FA_BYPASS_PATHS = [
  '/login/2fa',
  '/logout',
  '/api/auth/totp/verify'
];

declare global {
  var __chestBooted: boolean | undefined;
}

function boot() {
  if (globalThis.__chestBooted) return;
  globalThis.__chestBooted = true;
  ensureCryptoReady();
  startMetricsCollector();
  startScheduler();
  startCrashWatcher();
  startChatBridge();
}

export const handle: Handle = async ({ event, resolve }) => {
  boot();
  event.locals.locale = pickLocale(
    event.cookies.get('locale'),
    event.request.headers.get('accept-language')
  );
  const sessionId = event.cookies.get(SESSION_COOKIE) ?? null;
  event.locals.sessionId = sessionId;
  event.locals.user = null;
  event.locals.passed2fa = false;

  if (sessionId) {
    const result = await validateSession(sessionId);
    if (result) {
      event.locals.user = result.user;
      event.locals.passed2fa = result.passed2fa;
      if (result.refresh) {
        event.cookies.set(SESSION_COOKIE, sessionId, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: event.url.protocol === 'https:',
          maxAge: 60 * 60 * 24 * 7
        });
      }
    } else {
      await deleteSession(sessionId);
      event.cookies.delete(SESSION_COOKIE, { path: '/' });
      event.locals.sessionId = null;
    }
  }

  if (
    event.locals.user?.totpEnabledAt &&
    !event.locals.passed2fa &&
    !TWO_FA_BYPASS_PATHS.includes(event.url.pathname)
  ) {
    throw redirect(303, '/login/2fa');
  }

  return resolve(event);
};
