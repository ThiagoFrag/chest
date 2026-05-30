import {
  Client,
  GatewayIntentBits,
  Partials,
  ChannelType,
  REST,
  Routes,
  EmbedBuilder,
  type APIEmbed,
  type Guild,
  type TextChannel
} from 'discord.js';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/db';
import { getSetting } from '$lib/settings';
import { COMMANDS, autocompleteServers, handleSlashCommand } from './commands';
import { BOT_AVATAR_PNG_BASE64 } from './bot-avatar';
import { buildInviteUrl, extractAppIdFromToken } from './invite-url';

export { buildInviteUrl };

const DESIRED_USERNAME = 'Chest';
const DESIRED_AVATAR_DATA_URL = `data:image/png;base64,${BOT_AVATAR_PNG_BASE64}`;
let identitySynced = false;

let client: Client | null = null;
let currentToken: string | null = null;
let ready = false;
let connecting = false;
const messageHandlers = new Set<(channelId: string, author: string, content: string) => void>();

export interface BotStatus {
  configured: boolean;
  connected: boolean;
  username: string | null;
  applicationId: string | null;
  inviteUrl: string | null;
  guilds: Array<{ id: string; name: string; iconUrl: string | null }>;
}


export async function ensureBot(): Promise<Client | null> {
  const token = await getSetting('discord.bot_token');
  if (!token) {
    await disconnectBot();
    return null;
  }
  if (client && currentToken === token && ready) return client;
  if (connecting) return client;
  await disconnectBot();

  connecting = true;
  currentToken = token;
  try {
    const c = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ],
      partials: [Partials.Message, Partials.Channel]
    });

    c.on('messageCreate', (msg) => {
      if (msg.author.bot) return;
      if (!msg.content) return;
      for (const handler of messageHandlers) {
        try {
          handler(msg.channelId, msg.author.username, msg.content);
        } catch {
          /* ignore */
        }
      }
    });

    c.on('interactionCreate', async (i) => {
      try {
        if (i.isAutocomplete()) {
          const focused = i.options.getFocused(true);
          if (focused.name === 'server') {
            const choices = await autocompleteServers(String(focused.value ?? ''));
            await i.respond(choices);
          }
          return;
        }
        if (i.isChatInputCommand()) {
          await handleSlashCommand(i);
        }
      } catch (err) {
        console.error('[discord-bot] interaction error:', err);
      }
    });

    await c.login(token);
    await new Promise<void>((resolve) => {
      if (c.isReady()) return resolve();
      c.once('ready', () => resolve());
    });
    client = c;
    ready = true;

    if (c.user) {
      try {
        const rest = new REST({ version: '10' }).setToken(token);
        await rest.put(Routes.applicationCommands(c.user.id), { body: COMMANDS });
      } catch (err) {
        console.error('[discord-bot] register commands failed:', err);
      }

      if (!identitySynced) {
        try {
          if (c.user.username !== DESIRED_USERNAME) {
            await c.user.setUsername(DESIRED_USERNAME);
          }
        } catch (err) {
          if ((err as { code?: number }).code !== 50035) {
            console.error('[discord-bot] setUsername failed:', err);
          }
        }
        try {
          if (!c.user.avatar) {
            await c.user.setAvatar(DESIRED_AVATAR_DATA_URL);
          }
        } catch (err) {
          console.error('[discord-bot] setAvatar failed:', err);
        }
        identitySynced = true;
      }
    }

    return client;
  } catch (err) {
    console.error('[discord-bot] login failed:', err instanceof Error ? err.message : err);
    client = null;
    ready = false;
    currentToken = null;
    return null;
  } finally {
    connecting = false;
  }
}

export async function disconnectBot(): Promise<void> {
  if (!client) return;
  try {
    await client.destroy();
  } catch {
    /* ignore */
  }
  client = null;
  ready = false;
  currentToken = null;
}

export async function getStatus(): Promise<BotStatus> {
  const token = await getSetting('discord.bot_token');
  if (!token) {
    return {
      configured: false,
      connected: false,
      username: null,
      applicationId: null,
      inviteUrl: null,
      guilds: []
    };
  }

  const c = await ensureBot();
  if (!c || !c.isReady()) {
    const appId = extractAppIdFromToken(token);
    return {
      configured: true,
      connected: false,
      username: null,
      applicationId: appId,
      inviteUrl: appId ? buildInviteUrl(appId) : null,
      guilds: []
    };
  }

  const appId = c.user?.id ?? null;
  const guilds = c.guilds.cache.map((g: Guild) => ({
    id: g.id,
    name: g.name,
    iconUrl: g.iconURL({ size: 64 })
  }));

  return {
    configured: true,
    connected: true,
    username: c.user?.tag ?? null,
    applicationId: appId,
    inviteUrl: appId ? buildInviteUrl(appId) : null,
    guilds
  };
}

export async function listTextChannels(
  guildId: string
): Promise<Array<{ id: string; name: string }>> {
  const c = await ensureBot();
  if (!c || !c.isReady()) return [];
  const guild = await c.guilds.fetch(guildId).catch(() => null);
  if (!guild) return [];

  const channels = await guild.channels.fetch();
  return channels
    .filter((ch) => ch !== null && ch.type === ChannelType.GuildText)
    .map((ch) => ({ id: ch!.id, name: ch!.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function sendToChannel(
  channelId: string,
  content: string,
  opts: { username?: string; avatarUrl?: string } = {}
): Promise<boolean> {
  const c = await ensureBot();
  if (!c || !c.isReady()) return false;

  try {
    const channel = await c.channels.fetch(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) return false;
    const textChannel = channel as TextChannel;

    if (opts.username) {
      const webhooks = await textChannel.fetchWebhooks().catch(() => null);
      let hook = webhooks?.find((w) => w.owner?.id === c.user?.id) ?? null;
      if (!hook) {
        hook = await textChannel
          .createWebhook({ name: 'Chest Bridge', reason: 'chat bridge' })
          .catch(() => null);
      }
      if (hook) {
        await hook.send({
          content,
          username: opts.username,
          avatarURL: opts.avatarUrl
        });
        return true;
      }
    }

    await textChannel.send(content);
    return true;
  } catch {
    return false;
  }
}

export function onMessage(
  handler: (channelId: string, author: string, content: string) => void
): () => void {
  messageHandlers.add(handler);
  return () => messageHandlers.delete(handler);
}

const COLOR_OK = 0x5ba34d;
const COLOR_INFO = 0x4aedd9;
const COLOR_WARN = 0xf0a526;
const COLOR_NEUTRAL = 0x7e7e7e;
const COLOR_ERR = 0xaa2828;

export async function sendEmbedToChannel(
  channelId: string,
  embed: APIEmbed
): Promise<boolean> {
  const c = await ensureBot();
  if (!c || !c.isReady()) return false;
  try {
    const channel = await c.channels.fetch(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) return false;
    await (channel as TextChannel).send({ embeds: [embed] });
    return true;
  } catch {
    return false;
  }
}

export type ServerLifecycleEvent =
  | { type: 'started'; version?: string; hostPort?: number | null }
  | { type: 'stopped' }
  | { type: 'restarted' }
  | { type: 'crashed'; exitCode?: number };

export async function notifyServerLifecycle(
  containerName: string,
  event: ServerLifecycleEvent
): Promise<void> {
  const rows = await db()
    .select({
      displayName: schema.servers.displayName,
      discordChannelId: schema.servers.discordChannelId
    })
    .from(schema.servers)
    .where(eq(schema.servers.containerName, containerName))
    .catch(() => []);

  const row = rows[0];
  if (!row?.discordChannelId) return;

  const name = row.displayName || containerName;
  const embed = new EmbedBuilder().setTimestamp(new Date());

  switch (event.type) {
    case 'started': {
      embed.setColor(COLOR_OK).setTitle(`🟢 ${name} online`);
      const fields: { name: string; value: string; inline: boolean }[] = [];
      if (event.version) fields.push({ name: 'versão', value: event.version, inline: true });
      if (event.hostPort) fields.push({ name: 'porta', value: String(event.hostPort), inline: true });
      if (fields.length) embed.addFields(fields);
      embed.setDescription('server pronto, players podem conectar');
      break;
    }
    case 'stopped':
      embed.setColor(COLOR_NEUTRAL).setTitle(`⚪ ${name} offline`).setDescription('parado manualmente');
      break;
    case 'restarted':
      embed.setColor(COLOR_INFO).setTitle(`🔄 ${name} reiniciado`);
      break;
    case 'crashed':
      embed.setColor(COLOR_ERR).setTitle(`💥 ${name} crashou`);
      embed.setDescription('container saiu inesperadamente');
      if (event.exitCode !== undefined) {
        embed.addFields({ name: 'exit code', value: String(event.exitCode), inline: true });
      }
      break;
  }

  await sendEmbedToChannel(row.discordChannelId, embed.toJSON());
}

export async function notifyAdminDM(content: string, embed?: APIEmbed): Promise<boolean> {
  const adminId = await getSetting('discord.admin_user_id');
  if (!adminId) return false;
  const c = await ensureBot();
  if (!c || !c.isReady()) return false;
  try {
    const user = await c.users.fetch(adminId);
    await user.send({ content, embeds: embed ? [embed] : undefined });
    return true;
  } catch (err) {
    console.error('[discord-bot] DM admin failed:', err);
    return false;
  }
}

export const lifecycleColors = { ok: COLOR_OK, info: COLOR_INFO, warn: COLOR_WARN, err: COLOR_ERR };
