import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import QRCode from 'qrcode';
import { db, schema } from '$lib/db';
import {
  generateTotpSecret,
  buildOtpAuthUrl,
  verifyCode,
  generateBackupCodes
} from '$lib/auth/totp';
import { logAudit } from '$lib/audit';
import { getSetting } from '$lib/settings';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) throw error(401);
  return json({
    enabled: !!locals.user.totpEnabledAt,
    enabledAt: locals.user.totpEnabledAt
  });
};

const setupSchema = z.object({});

export const POST: RequestHandler = async (event) => {
  const { locals } = event;
  if (!locals.user) throw error(401);

  const body = await event.request.json().catch(() => ({}));
  if (!setupSchema.safeParse(body).success) throw error(400, 'body inválido');

  if (locals.user.totpEnabledAt) {
    throw error(409, '2FA já está ativo. Desative primeiro pra gerar novo secret.');
  }

  const secret = generateTotpSecret();
  const issuer = (await getSetting('forja.public_base_url')) ?? 'Chest';
  const cleanIssuer = issuer.replace(/^https?:\/\//, '').replace(/\/.*$/, '') || 'Chest';

  await db()
    .update(schema.users)
    .set({ totpSecret: secret.base32, totpEnabledAt: null, backupCodesJson: null })
    .where(eq(schema.users.id, locals.user.id));

  const otpAuthUrl = buildOtpAuthUrl({
    secretBase32: secret.base32,
    account: locals.user.username,
    issuer: cleanIssuer
  });
  const qrDataUrl = await QRCode.toDataURL(otpAuthUrl, { width: 280, margin: 1 });

  await logAudit(event, { action: 'auth.totp.setup_started' });

  return json({
    secret: secret.base32,
    otpAuthUrl,
    qrDataUrl
  });
};

const enableSchema = z.object({
  code: z.string().min(1).max(8)
});

export const PUT: RequestHandler = async (event) => {
  const { locals } = event;
  if (!locals.user) throw error(401);

  const body = await event.request.json().catch(() => null);
  const parsed = enableSchema.safeParse(body);
  if (!parsed.success) throw error(400, 'body inválido');

  const row = await db()
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, locals.user.id))
    .get();

  if (!row?.totpSecret) throw error(400, 'inicie setup primeiro (POST)');
  if (row.totpEnabledAt) throw error(409, '2FA já ativo');

  if (!verifyCode(row.totpSecret, parsed.data.code)) {
    await logAudit(event, {
      action: 'auth.totp.enable',
      status: 'fail',
      details: 'invalid_code'
    });
    throw error(400, 'código inválido');
  }

  const backupCodes = generateBackupCodes(10);
  await db()
    .update(schema.users)
    .set({ totpEnabledAt: new Date(), backupCodesJson: JSON.stringify(backupCodes) })
    .where(eq(schema.users.id, locals.user.id));

  await logAudit(event, {
    action: 'auth.totp.enabled',
    resourceType: 'user',
    resourceId: locals.user.id
  });

  return json({ ok: true, backupCodes });
};

const disableSchema = z.object({
  code: z.string().min(1).max(8)
});

export const DELETE: RequestHandler = async (event) => {
  const { locals } = event;
  if (!locals.user) throw error(401);

  const body = await event.request.json().catch(() => null);
  const parsed = disableSchema.safeParse(body);
  if (!parsed.success)
    throw error(400, 'body inválido — informe code atual pra confirmar');

  const row = await db()
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, locals.user.id))
    .get();

  if (!row?.totpSecret) throw error(400, '2FA não está configurado');

  if (!verifyCode(row.totpSecret, parsed.data.code)) {
    await logAudit(event, { action: 'auth.totp.disable', status: 'fail' });
    throw error(400, 'código inválido');
  }

  await db()
    .update(schema.users)
    .set({ totpSecret: null, totpEnabledAt: null, backupCodesJson: null })
    .where(eq(schema.users.id, locals.user.id));

  await logAudit(event, {
    action: 'auth.totp.disabled',
    resourceType: 'user',
    resourceId: locals.user.id
  });

  return json({ ok: true });
};
