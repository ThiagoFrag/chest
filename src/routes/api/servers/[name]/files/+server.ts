import { requireServerPermission } from '$lib/auth/require-server-permission';
import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { listDir, readFile, writeFile, isSafePath, isTextFile } from '$lib/mc/file-browser';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  const { params, url } = event;
  if (!params.name) throw error(400);
  await requireServerPermission(event, params.name, 'manage_files');

  const path = url.searchParams.get('path') ?? '/data';
  const mode = url.searchParams.get('mode') ?? 'list';

  if (!isSafePath(path)) throw error(400, 'path inválido');

  try {
    if (mode === 'read') {
      if (!isTextFile(path)) throw error(415, 'arquivo binário, não pode ser editado aqui');
      const { content, truncated } = await readFile(params.name, path);
      return json({ content, truncated, isText: true });
    }
    const entries = await listDir(params.name, path);
    return json({ path, entries });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'falha';
    if (msg.includes('inválido') || msg.includes('binário')) throw error(400, msg);
    throw error(500, msg);
  }
};

const putSchema = z.object({
  path: z.string().min(1),
  content: z.string()
});

export const PUT: RequestHandler = async (event) => {
  const { params, request } = event;
  if (!params.name) throw error(400);
  await requireServerPermission(event, params.name, 'manage_files');

  const body = await request.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) throw error(400, 'body inválido');

  try {
    await writeFile(params.name, parsed.data.path, parsed.data.content);
    return json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'falha';
    throw error(500, msg);
  }
};
