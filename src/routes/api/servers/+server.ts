import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { createServer } from '$lib/mc/server-lifecycle';
import { requireRole } from '$lib/auth/permissions';
import { getEgg } from '$lib/eggs/loader';
import { getHost, LOCAL_HOST_ID } from '$lib/docker/hosts';
import { logAudit } from '$lib/audit';
import type { RequestHandler } from './$types';

const bodySchema = z.object({
  displayName: z.string().trim().min(1).max(64),
  modloaderType: z.enum([
    'VANILLA',
    'PAPER',
    'FABRIC',
    'FORGE',
    'NEOFORGE',
    'PURPUR',
    'SPIGOT',
    'QUILT'
  ]),
  mcVersion: z
    .string()
    .trim()
    .regex(/^\d+\.\d+(\.\d+)?$/, 'versão inválida (ex: 1.21.1)'),
  loaderVersion: z.string().trim().max(32).optional(),
  memoryMb: z.number().int().min(1024).max(32768),
  maxPlayers: z.number().int().min(1).max(500).default(10),
  difficulty: z.enum(['peaceful', 'easy', 'normal', 'hard']).default('normal'),
  motd: z.string().max(120).optional(),
  draslEnabled: z.boolean().default(false),
  eggSlug: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{1,40}$/)
    .optional(),
  hostId: z.string().trim().min(1).default(LOCAL_HOST_ID)
});

export const POST: RequestHandler = async (event) => {
  const { request, locals } = event;
  requireRole(locals.user, 'admin');

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    throw error(400, parsed.error.issues[0]?.message ?? 'body inválido');
  }

  const host = await getHost(parsed.data.hostId);
  if (!host) throw error(400, `host "${parsed.data.hostId}" não existe`);
  if (!host.enabled) throw error(400, `host "${host.name}" está desabilitado`);

  let envExtras: Record<string, string> | undefined;
  let jvmOptsExtra: string | undefined;

  if (parsed.data.eggSlug) {
    const egg = await getEgg(parsed.data.eggSlug);
    if (!egg) throw error(400, `egg "${parsed.data.eggSlug}" não existe`);
    envExtras = Object.keys(egg.envExtras).length > 0 ? egg.envExtras : undefined;
    jvmOptsExtra = egg.jvmOpts;
  }

  try {
    const result = await createServer({
      ...parsed.data,
      envExtras,
      jvmOptsExtra
    });
    await logAudit(event, {
      action: 'server.create',
      resourceType: 'server',
      resourceId: result.containerName,
      details: { eggSlug: parsed.data.eggSlug ?? null, mcVersion: parsed.data.mcVersion }
    });
    return json(result, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'falha ao criar';
    await logAudit(event, {
      action: 'server.create',
      status: 'fail',
      details: msg
    });
    throw error(500, msg);
  }
};
