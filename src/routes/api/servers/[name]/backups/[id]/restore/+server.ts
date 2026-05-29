import { requireServerPermission } from "$lib/auth/require-server-permission";
import { json, error } from '@sveltejs/kit';
import { restoreBackup } from '$lib/mc/backup';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  const { params } = event;
  if (!params.id || !params.name) throw error(400);
  await requireServerPermission(event, params.name, "manage_backups");
  try {
    await restoreBackup(params.id, params.name);
    return json({ ok: true });
  } catch (err) {
    throw error(500, err instanceof Error ? err.message : 'falha');
  }
};
