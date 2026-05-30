// Server-side translation: reads messages[locale] directly, WITHOUT the
// module-level $state in store.svelte.ts (which is unsafe under concurrent SSR).
// Use event.locals.locale as the per-request locale.
//   import { tServer } from '$lib/i18n/server';
//   return fail(401, { error: tServer(locals.locale, 'serverrors.login.invalidCredentials') });
import { DEFAULT_LOCALE, type Locale } from './types';
import { messages } from './messages';
import { serverrorsMessages as serverrorsPtBr } from './messages/pt-br/serverrors';
import { serverrorsMessages as serverrorsEn } from './messages/en/serverrors';
import { serverrorsMessages as serverrorsEs } from './messages/es/serverrors';

// Namespaces wired here resolve even before phase 3 merges messages/index.ts.
// Phase 3 will add the same keys/values to `messages`; spread order keeps these
// authoritative for the serverrors namespace in either state.
const serverNamespaces: Record<Locale, Record<string, string>> = {
  'pt-BR': serverrorsPtBr,
  en: serverrorsEn,
  es: serverrorsEs
};

function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}

export function tServer(
  locale: Locale | null | undefined,
  key: string,
  params?: Record<string, string | number>
): string {
  const loc = locale ?? DEFAULT_LOCALE;
  const dict = { ...messages[loc], ...serverNamespaces[loc] };
  const msg = dict[key] ?? key;
  return interpolate(msg, params);
}
