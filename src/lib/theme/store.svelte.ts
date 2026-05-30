/**
 * Theme store (Svelte 5 runes). Espelha o store do i18n: `current` e a fonte
 * reativa do tema ativo. setTheme() persiste em cookie e aplica data-theme no
 * <html>, fazendo todo CSS dirigido por [data-theme] re-resolver as CSS vars.
 *
 * LIMITACAO SSR CONHECIDA (mesma do i18n): `current` e um $state em nivel de
 * modulo. O tema por request entra via +layout.server.ts (data.theme, derivado
 * de locals.theme) -> initTheme(data.theme) no +layout.svelte. O data-theme no
 * SSR vem do hooks.server.ts (transformPageChunk), entao nao ha flash mesmo que
 * o $state de modulo intercale sob alta concorrencia. Aceitavel num painel
 * self-hosted (baixa concorrencia); o client confirma na hidratacao.
 */
import { DEFAULT_THEME, type Theme } from './types';

let current = $state<Theme>(DEFAULT_THEME);

export function getTheme(): Theme {
  return current;
}

export function setTheme(t: Theme): void {
  current = t;
  if (typeof document !== 'undefined') {
    document.cookie = `theme=${t}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    document.documentElement.setAttribute('data-theme', t);
  }
}

export function initTheme(t: Theme): void {
  current = t;
}
