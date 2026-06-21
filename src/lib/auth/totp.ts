import { encodeBase32NoPadding, decodeBase32 } from '@oslojs/encoding';
import { generateTOTP, verifyTOTP } from '@oslojs/otp';

const PERIOD = 30;
const DIGITS = 6;

export interface TotpSecret {
  base32: string;
  rawBytes: Uint8Array;
}

export function generateTotpSecret(): TotpSecret {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return { rawBytes: bytes, base32: encodeBase32NoPadding(bytes) };
}

export function buildOtpAuthUrl(opts: {
  secretBase32: string;
  account: string;
  issuer?: string;
}): string {
  const issuer = opts.issuer ?? 'Chest';
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(opts.account)}`;
  const params = new URLSearchParams({
    secret: opts.secretBase32,
    issuer,
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(PERIOD)
  });
  return `otpauth://totp/${label}?${params}`;
}

export function verifyCode(secretBase32: string, code: string): boolean {
  const clean = code.replace(/\s+/g, '').trim();
  if (!/^\d{6}$/.test(clean)) return false;
  try {
    const bytes = decodeBase32(secretBase32);
    return verifyTOTP(bytes, PERIOD, DIGITS, clean);
  } catch {
    return false;
  }
}

export function currentCode(secretBase32: string): string {
  const bytes = decodeBase32(secretBase32);
  return generateTOTP(bytes, PERIOD, DIGITS);
}

export function generateBackupCodes(count = 10): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(5);
    crypto.getRandomValues(bytes);
    const code = encodeBase32NoPadding(bytes).slice(0, 10).toLowerCase();
    out.push(`${code.slice(0, 5)}-${code.slice(5, 10)}`);
  }
  return out;
}

export function consumeBackupCode(
  codesJson: string | null,
  code: string
): { ok: boolean; remaining: string[] } {
  if (!codesJson) return { ok: false, remaining: [] };
  let codes: string[];
  try {
    codes = JSON.parse(codesJson);
  } catch {
    return { ok: false, remaining: [] };
  }
  const clean = code.replace(/\s+/g, '').toLowerCase();
  const idx = codes.indexOf(clean);
  if (idx < 0) return { ok: false, remaining: codes };
  codes.splice(idx, 1);
  return { ok: true, remaining: codes };
}
