import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/db';
import { verifyCode, consumeBackupCode } from '$lib/auth/totp';
import { markSession2faPassed } from '$lib/auth/session';
import { logAudit } from '$lib/audit';
import type { RequestHandler } from './$types';

const schema_ = z.object({
  code: z.string().min(6).max(15)
});

export const POST: RequestHandler = async (event) => {
  const { locals, cookies } = event;
  if (!locals.user) throw error(401);

  const body = await event.request.json().catch(() => null);
  const parsed = schema_.safeParse(body);
  if (!parsed.success) throw error(400, 'body inválido');

  const row = await db()
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, locals.user.id))
    .get();

  if (!row?.totpSecret || !row.totpEnabledAt) {
    throw error(400, '2FA não está ativo');
  }

  let ok = verifyCode(row.totpSecret, parsed.data.code);
  let usedBackup = false;

  if (!ok) {
    const result = consumeBackupCode(row.backupCodesJson, parsed.data.code);
    if (result.ok) {
      ok = true;
      usedBackup = true;
      await db()
        .update(schema.users)
        .set({ backupCodesJson: JSON.stringify(result.remaining) })
        .where(eq(schema.users.id, locals.user.id));
    }
  }

  if (!ok) {
    await logAudit(event, { action: 'auth.totp.verify', status: 'fail' });
    throw error(401, 'código inválido');
  }

  const sessionToken = cookies.get('forja_session');
  if (sessionToken) await markSession2faPassed(sessionToken);

  await logAudit(event, {
    action: 'auth.totp.verify',
    details: usedBackup ? { usedBackupCode: true } : undefined
  });

  return json({ ok: true, usedBackup });
};
