import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { setChannelForServer } from '$lib/mc/chat-bridge';
import { requireServerPermission } from '$lib/auth/require-server-permission';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  const { server } = await requireServerPermission(event, event.params.name!, 'manage_discord');

  return json({ channelId: server.discordChannelId ?? null });
};

const putSchema = z.object({
  channelId: z.string().nullable()
});

export const PUT: RequestHandler = async (event) => {
  await requireServerPermission(event, event.params.name!, 'manage_discord');

  const body = await event.request.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) throw error(400);

  await setChannelForServer(event.params.name!, parsed.data.channelId);
  return json({ ok: true });
};
