import { describe, it, expect } from 'vitest';
import { hmacSha256Hex, generateWebhookSecret, timingSafeEqual } from './signing';

describe('hmacSha256Hex', () => {
  it('produces deterministic signature for same secret+payload', async () => {
    const a = await hmacSha256Hex('s3cret', '{"hello":"world"}');
    const b = await hmacSha256Hex('s3cret', '{"hello":"world"}');
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
    expect(a).toMatch(/^[0-9a-f]+$/);
  });

  it('produces different signature for different secret', async () => {
    const a = await hmacSha256Hex('one', 'msg');
    const b = await hmacSha256Hex('two', 'msg');
    expect(a).not.toBe(b);
  });

  it('produces different signature for different payload', async () => {
    const a = await hmacSha256Hex('key', 'msg1');
    const b = await hmacSha256Hex('key', 'msg2');
    expect(a).not.toBe(b);
  });

  it('matches known RFC test vector (HMAC-SHA256 "Hi There")', async () => {
    // Standard RFC 4231 test 1 (simplified — key is 20 bytes of 0x0b but expressed as latin-1)
    const sig = await hmacSha256Hex('Jefe', 'what do ya want for nothing?');
    expect(sig).toBe('5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843');
  });
});

describe('generateWebhookSecret', () => {
  it('starts with whs_ prefix and is hex of 32 bytes (64 hex chars + 4 prefix)', () => {
    const s = generateWebhookSecret();
    expect(s.startsWith('whs_')).toBe(true);
    expect(s.length).toBe(4 + 64);
    expect(s.slice(4)).toMatch(/^[0-9a-f]+$/);
  });

  it('generates unique values', () => {
    const set = new Set(Array.from({ length: 50 }, () => generateWebhookSecret()));
    expect(set.size).toBe(50);
  });
});

describe('timingSafeEqual', () => {
  it('true for equal strings', () => {
    expect(timingSafeEqual('abc', 'abc')).toBe(true);
  });

  it('false for different strings', () => {
    expect(timingSafeEqual('abc', 'abd')).toBe(false);
  });

  it('false for different lengths', () => {
    expect(timingSafeEqual('a', 'ab')).toBe(false);
  });
});
