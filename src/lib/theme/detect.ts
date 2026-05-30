import { THEMES, DEFAULT_THEME, type Theme } from './types';

function isTheme(v: string | null | undefined): v is Theme {
  return !!v && (THEMES as string[]).includes(v);
}

export function pickTheme(cookieValue: string | null | undefined): Theme {
  if (isTheme(cookieValue)) return cookieValue;
  return DEFAULT_THEME;
}
