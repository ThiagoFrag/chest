import { requireServerPermission } from "$lib/auth/require-server-permission";
import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import {
  startServer,
  stopServer,
  restartServer
} from '$lib/docker/server-actions';
import { logAudit } from '$lib/audit';
import type { RequestHandler } from './$types';

const bodySchema = z.object({
  action: z.enum(['start', 'stop', 'restart'])
});

export const POST: RequestHandler = async (event) => {
  const { params, request } = event;
  const name = params.name;
  if (!name) throw error(400, 'nome do container obrigatório');

  await requireServerPermission(event, name, 'control');

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) throw error(400, 'body inválido');

  try {
    if (parsed.data.action === 'start') await startServer(name);
    else if (parsed.data.action === 'stop') await stopServer(name);
    else await restartServer(name);
    await logAudit(event, {
      action: `server.${parsed.data.action}`,
      resourceType: 'server',
      resourceId: name
    });
    return json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'falha desconhecida';
    await logAudit(event, {
      action: `server.${parsed.data.action}`,
      resourceType: 'server',
      resourceId: name,
      status: 'fail',
      details: msg
    });
    throw error(409, msg);
  }
};
