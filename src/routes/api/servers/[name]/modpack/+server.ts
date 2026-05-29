import { requireServerPermission } from '$lib/auth/require-server-permission';
import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { installModrinthModpack } from '$lib/mc/modpack';
import type { RequestHandler } from './$types';

const schema = z.object({
  projectId: z.string().min(1)
});

export const POST: RequestHandler = async (event) => {
  const { params, request } = event;
  if (!params.name) throw error(400);
  await requireServerPermission(event, params.name, 'manage_files');

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw error(400, 'projectId obrigatório');

  try {
    const result = await installModrinthModpack(params.name, parsed.data.projectId);
    return json(result);
  } catch (err) {
    throw error(500, err instanceof Error ? err.message : 'falha install modpack');
  }
};
