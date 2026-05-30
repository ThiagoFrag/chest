/**
 * Motion/FX store (Svelte 5 runes). Espelha o store do tema: `current` e a fonte
 * reativa do toggle de animacoes de fundo. setMotion() persiste em cookie pra o
 * SSR resolver no proximo request (locals.motion via pickMotion).
 *
 * LIMITACAO SSR CONHECIDA (mesma do theme/i18n): `current` e um $state em nivel
 * de modulo, resolvido por request via +layout.server.ts -> initMotion(). Em
 * painel self-hosted (baixa concorrencia) e aceitavel; o client confirma na
 * hidratacao.
 */
import { DEFAULT_MOTION } from './detect';

let current = $state<boolean>(DEFAULT_MOTION);

export function getMotion(): boolean {
  return current;
}

export function setMotion(b: boolean): void {
  current = b;
  if (typeof document !== 'undefined') {
    document.cookie = `fx_motion=${b ? '1' : '0'}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  }
}

export function initMotion(b: boolean): void {
  current = b;
}
