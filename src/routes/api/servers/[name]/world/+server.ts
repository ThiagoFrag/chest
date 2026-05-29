import { requireRole } from "$lib/auth/permissions";
import { requireServerPermission } from "$lib/auth/require-server-permission";
import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { getWorldInfo, setSeed, resetWorld } from '$lib/mc/world';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  requireRole(locals.user, 'viewer');
  if (!params.name) throw error(400);
  try {
    const info = await getWorldInfo(params.name);
    return json(info);
  } catch (err) {
    throw error(500, err instanceof Error ? err.message : 'falha');
  }
};

const patchSchema = z.object({
  seed: z.string().trim().min(1).max(32)
});

export const PATCH: RequestHandler = async (event) => {
  const { params, request } = event;
  if (!params.name) throw error(400);
  await requireServerPermission(event, params.name, "edit_world");

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) throw error(400, 'seed obrigatória');

  try {
    await setSeed(params.name, parsed.data.seed);
    return json({ ok: true });
  } catch (err) {
    throw error(500, err instanceof Error ? err.message : 'falha');
  }
};
