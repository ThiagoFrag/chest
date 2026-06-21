import { requireServerPermission } from '$lib/auth/require-server-permission';
import { json, error } from '@sveltejs/kit';
import { deleteServer } from '$lib/mc/server-lifecycle';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async (event) => {
  const { params } = event;
  if (!params.name) throw error(400, 'slug obrigatório');

  await requireServerPermission(event, params.name, 'delete');

  try {
    await deleteServer(params.name);
    return json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'falha';
    throw error(500, msg);
  }
};
