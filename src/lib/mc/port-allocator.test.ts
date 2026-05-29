import { describe, it, expect } from 'vitest';
import { slugify } from './port-allocator';

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('My Server')).toBe('my-server');
  });

  it('strips accents (NFKD)', () => {
    expect(slugify('Servidor Açúcar')).toBe('servidor-acucar');
  });

  it('removes non-alphanumeric chars', () => {
    expect(slugify('Foo!@#$%Bar()_+')).toBe('foo-bar');
  });

  it('trims hyphens from edges', () => {
    expect(slugify('---hello---')).toBe('hello');
    expect(slugify('  __nice__  ')).toBe('nice');
  });

  it('caps length at 32', () => {
    const long = 'a'.repeat(100);
    expect(slugify(long).length).toBeLessThanOrEqual(32);
  });

  it('collapses multiple non-alphanumeric runs into single hyphen', () => {
    expect(slugify('a   b!!!c')).toBe('a-b-c');
  });

  it('handles empty/garbage input', () => {
    expect(slugify('')).toBe('');
    expect(slugify('!@#$%')).toBe('');
  });
});
