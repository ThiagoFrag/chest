import { LOCALES, DEFAULT_LOCALE, type Locale } from './types';

function isLocale(v: string | null | undefined): v is Locale {
  return !!v && (LOCALES as string[]).includes(v);
}

export function pickLocale(
  cookieValue: string | null | undefined,
  acceptLanguage: string | null | undefined
): Locale {
  if (isLocale(cookieValue)) return cookieValue;

  if (acceptLanguage) {
    for (const part of acceptLanguage.split(',')) {
      const tag = part.split(';')[0].trim().toLowerCase();
      if (tag.startsWith('pt')) return 'pt-BR';
      if (tag.startsWith('es')) return 'es';
      if (tag.startsWith('en')) return 'en';
    }
  }

  return DEFAULT_LOCALE;
}
