import { requireServerPermission } from "$lib/auth/require-server-permission";
import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import {
  readContainerFile,
  writeContainerFile,
  parseProperties,
  mergeProperties
} from '$lib/mc/files';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  const { params } = event;
  if (!params.name) throw error(400);
  await requireServerPermission(event, params.name, "edit_config");
  try {
    const raw = await readContainerFile(params.name, '/data/server.properties');
    return json({ properties: parseProperties(raw), raw });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'falha';
    throw error(500, msg);
  }
};

const putSchema = z.object({
  properties: z.record(z.string(), z.string())
});

export const PUT: RequestHandler = async (event) => {
  const { params, request } = event;
  if (!params.name) throw error(400);
  await requireServerPermission(event, params.name, "edit_config");

  const body = await request.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) throw error(400, 'body inválido');

  try {
    let original = '';
    try {
      original = await readContainerFile(params.name, '/data/server.properties');
    } catch {
      /* server may not have written it yet — fall back to empty */
    }
    const content = mergeProperties(original, parsed.data.properties);
    await writeContainerFile(params.name, '/data/server.properties', content);
    return json({ ok: true, restartNeeded: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'falha';
    throw error(500, msg);
  }
};
