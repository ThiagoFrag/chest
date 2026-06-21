import { encodeBase64, decodeBase64 } from '@oslojs/encoding';
import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { dirname } from 'node:path';

const KEY_FILE = process.env.RCON_KEY_FILE ?? '/app/data/.rcon_key';
let cachedKey: Buffer | null = null;

function normalizeTo32(buf: Buffer): Buffer {
  if (buf.length >= 32) return buf.subarray(0, 32);
  return Buffer.concat([buf, Buffer.alloc(32 - buf.length)]);
}

function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.RCON_KEY;
  if (raw && raw.length >= 16) {
    cachedKey = normalizeTo32(Buffer.from(raw));
    return cachedKey;
  }

  if (existsSync(KEY_FILE)) {
    try {
      const fileKey = readFileSync(KEY_FILE);
      if (fileKey.length >= 32) {
        cachedKey = fileKey.subarray(0, 32);
        return cachedKey;
      }
    } catch {
      /* fallthrough to regenerate */
    }
  }

  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  cachedKey = Buffer.from(bytes);
  try {
    mkdirSync(dirname(KEY_FILE), { recursive: true });
    writeFileSync(KEY_FILE, cachedKey);
    try {
      chmodSync(KEY_FILE, 0o600);
    } catch {
      /* best effort */
    }
  } catch (err) {
    console.warn(
      '[crypto] could not persist auto-generated RCON_KEY, will regen on restart:',
      err
    );
  }
  return cachedKey;
}

export async function encrypt(plain: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(getKey()),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain)
  );
  const combined = new Uint8Array(iv.length + ct.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ct), iv.length);
  return encodeBase64(combined);
}

export async function decrypt(encrypted: string): Promise<string> {
  const combined = decodeBase64(encrypted);
  const iv = combined.slice(0, 12);
  const ct = combined.slice(12);
  const key = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(getKey()),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(pt);
}

export function generateRconPassword(): string {
  const out: string[] = [];
  while (out.join('').length < 24) {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    out.push(encodeBase64(bytes).replace(/[+/=]/g, ''));
  }
  return out.join('').slice(0, 24);
}

export function ensureCryptoReady(): void {
  getKey();
}
