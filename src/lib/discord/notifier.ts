import { getSetting } from '$lib/settings';

export type DiscordColor = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const COLORS: Record<DiscordColor, number> = {
  success: 0x5ba34d,
  warning: 0xf0a526,
  danger: 0xaa2828,
  info: 0x4aedd9,
  neutral: 0x7e7e7e
};

interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface EmbedInput {
  title: string;
  description?: string;
  color?: DiscordColor;
  fields?: EmbedField[];
  thumbnailUrl?: string;
  url?: string;
  timestamp?: string;
}

interface DiscordWebhookPayload {
  username: string;
  avatar_url: string;
  embeds: Array<{
    title: string;
    description?: string;
    color: number;
    fields?: EmbedField[];
    thumbnail?: { url: string };
    url?: string;
    timestamp?: string;
    footer?: { text: string; icon_url?: string };
  }>;
}

const DEFAULT_AVATAR = 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21.1/assets/minecraft/textures/block/grass_block_top.png';
const FOOTER_TEXT = 'Chest · painel de servidores minecraft';

export async function sendEmbed(embed: EmbedInput): Promise<boolean> {
  const webhookUrl = await getSetting('discord.webhook_url');
  if (!webhookUrl) return false;

  return sendEmbedTo(webhookUrl, embed);
}

export async function sendEmbedTo(webhookUrl: string, embed: EmbedInput): Promise<boolean> {
  const payload: DiscordWebhookPayload = {
    username: 'Chest',
    avatar_url: DEFAULT_AVATAR,
    embeds: [
      {
        title: embed.title,
        description: embed.description,
        color: COLORS[embed.color ?? 'neutral'],
        fields: embed.fields,
        thumbnail: embed.thumbnailUrl ? { url: embed.thumbnailUrl } : undefined,
        url: embed.url,
        timestamp: embed.timestamp ?? new Date().toISOString(),
        footer: { text: FOOTER_TEXT }
      }
    ]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const events = {
  serverStarted: (name: string, version?: string) =>
    sendEmbed({
      title: `${name} iniciado`,
      description: 'server está online e pronto pra players entrarem',
      color: 'success',
      fields: version ? [{ name: 'versão', value: version, inline: true }] : undefined
    }),

  serverStopped: (name: string) =>
    sendEmbed({
      title: `${name} parado`,
      description: 'server foi desligado manualmente',
      color: 'neutral'
    }),

  serverCrashed: (name: string, exitCode?: number) =>
    sendEmbed({
      title: `⚠ ${name} crashou`,
      description: 'container saiu inesperadamente',
      color: 'danger',
      fields: exitCode !== undefined ? [{ name: 'exit code', value: String(exitCode), inline: true }] : undefined
    }),

  serverRestarted: (name: string) =>
    sendEmbed({
      title: `${name} reiniciado`,
      color: 'info'
    }),

  backupCreated: (serverName: string, scope: 'world' | 'full', sizeMb: number) =>
    sendEmbed({
      title: `backup criado: ${serverName}`,
      color: 'info',
      fields: [
        { name: 'scope', value: scope, inline: true },
        { name: 'tamanho', value: `${sizeMb.toFixed(1)} MB`, inline: true }
      ]
    }),

  taskRan: (serverName: string, taskType: string, status: string) =>
    sendEmbed({
      title: `tarefa agendada: ${taskType}`,
      description: `executada em ${serverName}`,
      color: status === 'ok' ? 'success' : 'warning',
      fields: [{ name: 'status', value: status, inline: true }]
    }),

  playerJoin: (serverName: string, player: string) =>
    sendEmbed({
      title: `${player} entrou em ${serverName}`,
      color: 'success',
      thumbnailUrl: `https://mc-heads.net/avatar/${encodeURIComponent(player)}/64/nohelm`
    }),

  playerLeave: (serverName: string, player: string) =>
    sendEmbed({
      title: `${player} saiu de ${serverName}`,
      color: 'neutral',
      thumbnailUrl: `https://mc-heads.net/avatar/${encodeURIComponent(player)}/64/nohelm`
    })
};
