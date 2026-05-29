import { requireServerPermission } from "$lib/auth/require-server-permission";
import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { listBackups, createBackup } from '$lib/mc/backup';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  const { params } = event;
  if (!params.name) throw error(400);
  await requireServerPermission(event, params.name, "manage_backups");
  try {
    const backups = await listBackups(params.name);
    return json({ backups });
  } catch (err) {
    throw error(500, err instanceof Error ? err.message : 'falha');
  }
};

const createSchema = z.object({
  scope: z.enum(['world', 'full']).default('world')
});

export const POST: RequestHandler = async (event) => {
  const { params, request } = event;
  if (!params.name) throw error(400);
  await requireServerPermission(event, params.name, "manage_backups");

  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) throw error(400, 'scope inválido');

  try {
    const entry = await createBackup(params.name, parsed.data.scope);
    return json(entry, { status: 201 });
  } catch (err) {
    throw error(500, err instanceof Error ? err.message : 'falha');
  }
};
