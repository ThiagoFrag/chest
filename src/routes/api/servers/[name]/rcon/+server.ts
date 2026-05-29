import { requireServerPermission } from "$lib/auth/require-server-permission";
import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { sendCommand } from '$lib/mc/rcon';
import type { RequestHandler } from './$types';

const bodySchema = z.object({
  command: z.string().trim().min(1).max(500)
});

export const POST: RequestHandler = async (event) => {
  const { params, request } = event;
  if (!params.name) throw error(400, 'slug obrigatório');

  await requireServerPermission(event, params.name, "console");

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) throw error(400, 'comando inválido');

  try {
    const response = await sendCommand(params.name, parsed.data.command);
    return json({ response });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'falha rcon';
    if (msg.includes('disponível só pra servers criados')) throw error(409, msg);
    throw error(500, msg);
  }
};
