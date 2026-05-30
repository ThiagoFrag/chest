/**
 * i18n store (Svelte 5 runes). t() / formatDate / formatNumber / plural sao REATIVOS a `current`:
 * ao trocar o idioma via setLocale(), todo markup que le essas funcoes re-renderiza.
 *
 * LIMITACAO SSR CONHECIDA: `current` e um $state em nivel de modulo. O locale por request entra
 * via +layout.server.ts (data.locale, derivado de locals.locale) -> initLocale(data.locale) no
 * +layout.svelte. Sob altissima concorrencia de SSR, esse estado de modulo pode intercalar entre
 * requests. E aceitavel num painel self-hosted (baixa concorrencia) e o client corrige o idioma
 * na hidratacao. Mantido simples e correto pro caso de uso.
 */
import { messages } from './messages';
import { DEFAULT_LOCALE, type Locale } from './types';

let current = $state<Locale>(DEFAULT_LOCALE);

export function getLocale(): Locale {
  return current;
}

export function setLocale(l: Locale): void {
  current = l;
  if (typeof document !== 'undefined') {
    document.cookie = `locale=${l}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    document.documentElement.lang = l;
  }
}

export function initLocale(l: Locale): void {
  current = l;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const dict = messages[current] ?? messages[DEFAULT_LOCALE];
  let s = dict[key] ?? messages[DEFAULT_LOCALE][key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

export function formatDate(d: Date | number, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(current, opts).format(d);
}

export function formatNumber(n: number, opts?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(current, opts).format(n);
}

export function plural(
  n: number,
  forms: { one: string; other: string; zero?: string }
): string {
  const rule = new Intl.PluralRules(current).select(n);
  const form =
    rule === 'zero' && forms.zero ? forms.zero : rule === 'one' ? forms.one : forms.other;
  return form.split('{n}').join(String(n));
}
