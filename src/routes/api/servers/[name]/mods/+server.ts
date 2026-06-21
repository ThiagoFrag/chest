import { requireServerPermission } from '$lib/auth/require-server-permission';
import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { listMods, installMod, getServerMcInfo } from '$lib/mc/mods';
import { getVersions, downloadFile } from '$lib/modrinth/client';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  const { params } = event;
  if (!params.name) throw error(400);
  await requireServerPermission(event, params.name, 'manage_files');
  try {
    const mods = await listMods(params.name);
    return json({ mods });
  } catch (err) {
    throw error(500, err instanceof Error ? err.message : 'falha');
  }
};

const installSchema = z.object({
  projectId: z.string().min(1)
});

export const POST: RequestHandler = async (event) => {
  const { params, request } = event;
  if (!params.name) throw error(400);
  await requireServerPermission(event, params.name, 'manage_files');

  const body = await request.json().catch(() => null);
  const parsed = installSchema.safeParse(body);
  if (!parsed.success) throw error(400, 'projectId obrigatório');

  try {
    const info = await getServerMcInfo(params.name);
    const versions = await getVersions(parsed.data.projectId, {
      mcVersion: info.mcVersion,
      loader: info.loader === 'vanilla' ? undefined : info.loader
    });
    if (versions.length === 0) {
      throw error(
        409,
        `nenhuma versão compatível com MC ${info.mcVersion} + ${info.loader}`
      );
    }
    const v = versions[0];
    const file = v.files.find((f) => f.primary) ?? v.files[0];
    if (!file) throw error(500, 'sem arquivo no Modrinth');

    const content = await downloadFile(file.url);
    await installMod(params.name, file.filename, content);
    return json({
      filename: file.filename,
      version: v.version_number,
      sizeBytes: file.size
    });
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) throw err;
    throw error(500, err instanceof Error ? err.message : 'falha');
  }
};
