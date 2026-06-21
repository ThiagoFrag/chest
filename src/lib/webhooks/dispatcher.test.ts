import { describe, it, expect } from 'vitest';
import { signPayload, generateSecret } from './dispatcher';

describe('signPayload', () => {
  it('produces deterministic signature for same input', () => {
    const s = 'secret123';
    const body = JSON.stringify({ foo: 'bar' });
    expect(signPayload(s, body)).toBe(signPayload(s, body));
  });

  it('produces different signature for different secret', () => {
    const body = JSON.stringify({ foo: 'bar' });
    expect(signPayload('a', body)).not.toBe(signPayload('b', body));
  });

  it('produces sha256= prefix + 64 hex chars', () => {
    const sig = signPayload('s', 'body');
    expect(sig).toMatch(/^sha256=[a-f0-9]{64}$/);
  });
});

describe('generateSecret', () => {
  it('returns 32+ chars', () => {
    expect(generateSecret().length).toBeGreaterThanOrEqual(32);
  });
  it('generates unique values', () => {
    const set = new Set();
    for (let i = 0; i < 20; i++) set.add(generateSecret());
    expect(set.size).toBe(20);
  });
});
