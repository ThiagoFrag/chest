import { requireServerPermission } from "$lib/auth/require-server-permission";
import { error } from '@sveltejs/kit';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { getBackupPath, deleteBackup } from '$lib/mc/backup';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  await requireServerPermission(event, event.params.name, "manage_backups");
  const { params } = event;
  if (!params.id) throw error(400);

  const path = await getBackupPath(params.id);
  if (!path) throw error(404, 'backup não encontrado');

  const s = await stat(path);
  const stream = createReadStream(path);

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      'content-type': 'application/gzip',
      'content-length': String(s.size),
      'content-disposition': `attachment; filename="${params.id}.tar.gz"`
    }
  });
};

export const DELETE: RequestHandler = async (event) => {
  await requireServerPermission(event, event.params.name, "manage_backups");
  const { params } = event;
  if (!params.id) throw error(400);

  await deleteBackup(params.id);
  return new Response(null, { status: 204 });
};
