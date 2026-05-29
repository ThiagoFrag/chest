import { requireServerPermission } from '$lib/auth/require-server-permission';
import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { detectAuthMode, setAuthMode } from '$lib/mc/auth-mode';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  const { params } = event;
  if (!params.name) throw error(400);
  await requireServerPermission(event, params.name, 'view_logs');
  try {
    const status = await detectAuthMode(params.name);
    return json(status);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'falha';
    throw error(500, msg);
  }
};

const postSchema = z.object({
  mode: z.enum(['mojang', 'drasl', 'offline']),
  draslUrl: z.string().url().optional()
});

export const POST: RequestHandler = async (event) => {
  const { params, request } = event;
  if (!params.name) throw error(400);
  await requireServerPermission(event, params.name, 'edit_config');

  const body = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) throw error(400, 'body inválido');

  try {
    const result = await setAuthMode(params.name, parsed.data.mode, {
      draslUrl: parsed.data.draslUrl
    });
    return json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'falha';
    throw error(500, msg);
  }
};
