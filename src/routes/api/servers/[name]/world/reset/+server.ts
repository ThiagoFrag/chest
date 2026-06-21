import { requireServerPermission } from '$lib/auth/require-server-permission';
import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { resetWorld } from '$lib/mc/world';
import type { RequestHandler } from './$types';

const schema = z.object({
  newSeed: z.string().trim().max(32).optional(),
  resetNether: z.boolean().default(true),
  resetEnd: z.boolean().default(true),
  confirm: z.literal(true)
});

export const POST: RequestHandler = async (event) => {
  if (!event.params.name) throw error(400);
  await requireServerPermission(event, event.params.name, 'edit_world');

  const body = await event.request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw error(400, 'precisa confirm: true');

  try {
    const result = await resetWorld(event.params.name, parsed.data);
    return json({ ok: true, ...result });
  } catch (err) {
    throw error(500, err instanceof Error ? err.message : 'falha');
  }
};
