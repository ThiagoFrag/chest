import { requireRole } from '$lib/auth/permissions';
import { json, error } from '@sveltejs/kit';
import { getSetting } from '$lib/settings';
import { sendEmbedTo } from '$lib/discord/notifier';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
  requireRole(locals.user, 'admin');

  const url = await getSetting('discord.webhook_url');
  if (!url) throw error(400, 'discord.webhook_url não configurado');

  const ok = await sendEmbedTo(url, {
    title: '🧪 webhook de teste',
    description: 'se você vê isso, a integração tá funcionando!',
    color: 'success',
    fields: [
      { name: 'origem', value: 'Chest panel', inline: true },
      { name: 'hora', value: new Date().toLocaleString('pt-BR'), inline: true }
    ]
  });

  if (!ok) throw error(502, 'webhook respondeu com erro (verifique URL)');

  return json({ ok: true });
};
