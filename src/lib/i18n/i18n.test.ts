import { describe, it, expect } from 'vitest';
import { messages } from './messages';
import { LOCALES, DEFAULT_LOCALE, type Locale } from './types';

const PLACEHOLDER = /\{(\w+)\}/g;

function placeholders(s: string): Set<string> {
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = PLACEHOLDER.exec(s)) !== null) out.add(m[1]);
  return out;
}

describe('i18n key parity', () => {
  it('all LOCALES exist in messages', () => {
    for (const l of LOCALES) {
      expect(messages[l], `missing locale ${l}`).toBeDefined();
    }
  });

  const baseKeys = Object.keys(messages[DEFAULT_LOCALE]).sort();

  for (const l of LOCALES) {
    if (l === DEFAULT_LOCALE) continue;
    it(`${l} key set === ${DEFAULT_LOCALE} key set`, () => {
      expect(Object.keys(messages[l as Locale]).sort()).toEqual(baseKeys);
    });
  }

  it('no empty strings', () => {
    for (const l of LOCALES) {
      for (const [k, v] of Object.entries(messages[l])) {
        expect(v.trim().length, `empty value for ${l}.${k}`).toBeGreaterThan(0);
      }
    }
  });

  it('placeholder parity vs base locale', () => {
    for (const key of baseKeys) {
      const base = placeholders(messages[DEFAULT_LOCALE][key]);
      for (const l of LOCALES) {
        if (l === DEFAULT_LOCALE) continue;
        const val = messages[l as Locale][key];
        if (val === undefined) continue; // key-set parity already covers missing keys
        expect(placeholders(val), `placeholder mismatch ${l}.${key}`).toEqual(base);
      }
    }
  });
});
