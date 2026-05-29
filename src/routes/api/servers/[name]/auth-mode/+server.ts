import { requireRole } from '$lib/auth/permissions';
import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { detectAuthMode, setAuthMode } from '$lib/mc/auth-mode';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  requireRole(locals.user, 'viewer');
  if (!params.name) throw error(400);
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

export const POST: RequestHandler = async ({ params, request, locals }) => {
  requireRole(locals.user, 'operator');
  if (!params.name) throw error(400);

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
