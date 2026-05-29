import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt, generateRconPassword } from './crypto';

beforeAll(() => {
  process.env.RCON_KEY = 'test-key-for-vitest-deterministic-32b';
  process.env.RCON_KEY_FILE = '/tmp/chest-test.rcon_key';
});

describe('encrypt/decrypt round-trip', () => {
  it('decrypts what it encrypted', async () => {
    const plain = 'super-secret-rcon-password-123';
    const cipher = await encrypt(plain);
    const back = await decrypt(cipher);
    expect(back).toBe(plain);
  });

  it('produces different ciphertext for same plaintext (random IV)', async () => {
    const plain = 'same-message';
    const a = await encrypt(plain);
    const b = await encrypt(plain);
    expect(a).not.toBe(b);
    expect(await decrypt(a)).toBe(plain);
    expect(await decrypt(b)).toBe(plain);
  });

  it('handles unicode', async () => {
    const plain = 'señä-ÇãO-日本語-🎮';
    const back = await decrypt(await encrypt(plain));
    expect(back).toBe(plain);
  });

  it('throws on tampered ciphertext', async () => {
    const cipher = await encrypt('hello');
    const tampered = cipher.slice(0, -2) + 'XX';
    await expect(decrypt(tampered)).rejects.toThrow();
  });
});

describe('generateRconPassword', () => {
  it('returns 24-char string', () => {
    const p = generateRconPassword();
    expect(p).toHaveLength(24);
  });

  it('generates unique values', () => {
    const set = new Set(Array.from({ length: 50 }, () => generateRconPassword()));
    expect(set.size).toBe(50);
  });

  it('contains only safe characters', () => {
    const p = generateRconPassword();
    expect(p).toMatch(/^[A-Za-z0-9]+$/);
  });
});
