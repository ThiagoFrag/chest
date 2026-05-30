export type Locale = 'pt-BR' | 'en' | 'es';

export const LOCALES: Locale[] = ['pt-BR', 'en', 'es'];

export const DEFAULT_LOCALE: Locale = 'pt-BR';

export const LOCALE_LABELS: Record<Locale, string> = {
  'pt-BR': 'Portugues',
  en: 'English',
  es: 'Espanol'
};

export type Dict = Record<string, string>;
