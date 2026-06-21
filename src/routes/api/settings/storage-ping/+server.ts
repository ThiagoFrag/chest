import { json, error } from '@sveltejs/kit';
import { requireRole } from '$lib/auth/permissions';
import { getStorage, invalidateStorageCache } from '$lib/backup/factory';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
  requireRole(locals.user, 'admin');
  invalidateStorageCache();
  try {
    const storage = await getStorage();
    const result = await storage.ping();
    return json({ driver: storage.driver, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'falha';
    return json({ ok: false, message: msg }, { status: 200 });
  }
};
