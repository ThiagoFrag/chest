import { requireRole } from "$lib/auth/permissions";
import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { getAllSettings, setSetting, deleteSetting, type SettingKey } from '$lib/settings';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  requireRole(locals.user, "admin");
  const settings = await getAllSettings();
  return json({ settings });
};

const VALID_KEYS = [
  'drasl.url',
  'drasl.admin_token',
  'cloudflare.api_token',
  'cloudflare.zone_id',
  'cloudflare.cname_target',
  'playit.secret_key',
  'discord.webhook_url',
  'discord.bot_token',
  'discord.admin_user_id',
  'forja.public_base_url',
  'forja.mc_host_address',
  'mods.modrinth_user_agent'
] as const;

const putSchema = z.object({
  key: z.enum(VALID_KEYS),
  value: z.string()
});

export const PUT: RequestHandler = async ({ request, locals }) => {
  requireRole(locals.user, "admin");
  const body = await request.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) throw error(400, 'key/value inválidos');

  if (parsed.data.value === '') {
    await deleteSetting(parsed.data.key as SettingKey);
  } else {
    await setSetting(parsed.data.key as SettingKey, parsed.data.value);
  }
  return json({ ok: true });
};
