import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/db';

export type SettingKey =
  | 'drasl.url'
  | 'drasl.admin_token'
  | 'cloudflare.api_token'
  | 'cloudflare.zone_id'
  | 'cloudflare.cname_target'
  | 'playit.secret_key'
  | 'discord.webhook_url'
  | 'discord.bot_token'
  | 'discord.admin_user_id'
  | 'discord.oauth_client_id'
  | 'discord.oauth_client_secret'
  | 'discord.oauth_guild_id'
  | 'forja.public_base_url'
  | 'forja.mc_host_address'
  | 'mods.modrinth_user_agent'
  | 'chest.storage.driver'
  | 'chest.storage.local.dir'
  | 'chest.storage.s3.endpoint'
  | 'chest.storage.s3.region'
  | 'chest.storage.s3.bucket'
  | 'chest.storage.s3.access_key'
  | 'chest.storage.s3.secret_key'
  | 'chest.storage.s3.path_prefix'
  | 'chest.storage.s3.force_path_style';

const SECRET_KEYS = new Set<SettingKey>([
  'drasl.admin_token',
  'cloudflare.api_token',
  'playit.secret_key',
  'discord.webhook_url',
  'discord.bot_token',
  'discord.oauth_client_secret',
  'chest.storage.s3.access_key',
  'chest.storage.s3.secret_key'
]);

export function isSecret(key: SettingKey): boolean {
  return SECRET_KEYS.has(key);
}

export async function getSetting(key: SettingKey): Promise<string | null> {
  const row = await db()
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.key, key))
    .get();
  return row?.value ?? null;
}

export async function setSetting(key: SettingKey, value: string): Promise<void> {
  await db().insert(schema.settings).values({ key, value }).onConflictDoUpdate({
    target: schema.settings.key,
    set: { value }
  });
}

export async function deleteSetting(key: SettingKey): Promise<void> {
  await db().delete(schema.settings).where(eq(schema.settings.key, key));
}

export async function getAllSettings(): Promise<
  Record<string, { value: string; isSecret: boolean }>
> {
  const rows = await db().select().from(schema.settings);
  const out: Record<string, { value: string; isSecret: boolean }> = {};
  for (const r of rows) {
    const k = r.key as SettingKey;
    out[r.key] = {
      value: isSecret(k) ? maskSecret(r.value) : r.value,
      isSecret: isSecret(k)
    };
  }
  return out;
}

export function maskSecret(value: string): string {
  if (!value) return '';
  if (value.length <= 8) return '••••••••';
  return value.slice(0, 4) + '••••' + value.slice(-4);
}
