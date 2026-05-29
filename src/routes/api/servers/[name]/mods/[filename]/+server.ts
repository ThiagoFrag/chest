import { requireServerPermission } from "$lib/auth/require-server-permission";
import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { removeMod, toggleMod } from '$lib/mc/mods';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async (event) => {
  const { params } = event;
  if (!params.name || !params.filename) throw error(400);
  await requireServerPermission(event, params.name, "manage_files");
  try {
    await removeMod(params.name, params.filename);
    return json({ ok: true });
  } catch (err) {
    throw error(500, err instanceof Error ? err.message : 'falha');
  }
};

const patchSchema = z.object({
  enabled: z.boolean()
});

export const PATCH: RequestHandler = async (event) => {
  const { params, request } = event;
  if (!params.name || !params.filename) throw error(400);
  await requireServerPermission(event, params.name, "manage_files");

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) throw error(400);

  try {
    await toggleMod(params.name, params.filename, parsed.data.enabled);
    return json({ ok: true });
  } catch (err) {
    throw error(500, err instanceof Error ? err.message : 'falha');
  }
};
