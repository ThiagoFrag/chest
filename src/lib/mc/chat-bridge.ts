import { docker } from '$lib/docker/client';
import { db, schema } from '$lib/db';
import { eq, isNotNull } from 'drizzle-orm';
import { sendToChannel, sendEmbedToChannel, onMessage, ensureBot } from '$lib/discord/bot';
import { EmbedBuilder } from 'discord.js';
import { sendCommand } from './rcon';
import { emitEvent } from '$lib/webhooks/dispatcher';

const COLOR_JOIN = 0x5ba34d;
const COLOR_LEAVE = 0x7e7e7e;
const COLOR_DEATH = 0xaa2828;

interface BridgeState {
  containerName: string;
  channelId: string;
  slug: string;
  stream: NodeJS.ReadableStream | null;
}

const active = new Map<string, BridgeState>();
const bridgeLocks = new Map<string, Promise<void>>();
let started = false;
let unsubDiscord: (() => void) | null = null;

const CHAT_REGEX = /\[(?:Server|Async Chat) thread\/INFO\]:?\s*(?:\[Not Secure\]\s*)?<([^>]+)>\s*(.+)$/;
const JOIN_REGEX = /\[Server thread\/INFO\]:?\s*([A-Za-z0-9_]+)\s+joined the game/;
const LEAVE_REGEX = /\[Server thread\/INFO\]:?\s*([A-Za-z0-9_]+)\s+left the game/;
const DEATH_PATTERNS = [
  / was slain by /,
  / drowned/,
  / fell from a high place/,
  / blew up/,
  / hit the ground too hard/,
  / was shot by /,
  / tried to swim in lava/,
  / went up in flames/,
  / starved to death/,
  / suffocated in a wall/,
  / was killed/
];

export function startChatBridge(): void {
  if (started) return;
  started = true;

  unsubDiscord = onMessage(async (channelId, author, content) => {
    for (const bridge of active.values()) {
      if (bridge.channelId !== channelId) continue;
      try {
        const escaped = content.replace(/"/g, '\\"').slice(0, 200);
        const payload = `tellraw @a {"text":"","extra":[{"text":"[Discord] ","color":"aqua","bold":true},{"text":"<${author}> ","color":"white","bold":true},{"text":"${escaped}","color":"white"}]}`;
        await sendCommand(bridge.slug, payload);
      } catch {
        /* ignore */
      }
    }
  });

  setInterval(() => reconcile().catch(() => undefined), 30_000);
  setTimeout(() => reconcile().catch(() => undefined), 8_000);
}

async function reconcile(): Promise<void> {
  await ensureBot();

  const rows = await db()
    .select()
    .from(schema.servers)
    .where(isNotNull(schema.servers.discordChannelId))
    .catch(() => []);

  const desired = new Set(rows.map((r) => r.containerName));

  for (const [name, state] of active) {
    const row = rows.find((r) => r.containerName === name);
    if (!row || row.discordChannelId !== state.channelId) {
      stopBridge(name);
    }
  }

  for (const row of rows) {
    if (!row.discordChannelId) continue;
    if (active.has(row.containerName)) continue;
    await startBridge(row.containerName, row.discordChannelId, row.slug).catch(() => undefined);
  }
}

async function startBridge(containerName: string, channelId: string, slug: string): Promise<void> {
  const existing = bridgeLocks.get(containerName);
  if (existing) await existing.catch(() => undefined);

  const work = (async () => {
    if (active.has(containerName)) return;

    const container = docker().getContainer(containerName);
    let info;
    try {
      info = await container.inspect();
    } catch {
      return;
    }
    if (!info.State.Running) return;

    const stream = (await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
      tail: 0,
      timestamps: false
    })) as unknown as NodeJS.ReadableStream;

    if (active.has(containerName)) {
      try {
        (stream as unknown as { destroy?: () => void }).destroy?.();
      } catch {
        /* ignore */
      }
      return;
    }

    const state: BridgeState = { containerName, channelId, slug, stream };
    active.set(containerName, state);

    let buf = Buffer.alloc(0);
    stream.on('data', (chunk: Buffer) => {
      buf = Buffer.concat([buf, chunk]);
      while (buf.length >= 8) {
        const size = buf.readUInt32BE(4);
        if (buf.length < 8 + size) break;
        const payload = buf.subarray(8, 8 + size).toString('utf8');
        buf = buf.subarray(8 + size);
        for (const line of payload.split('\n')) {
          if (!line.trim()) continue;
          handleLogLine(state, line);
        }
      }
    });

    stream.on('end', () => stopBridge(containerName));
    stream.on('error', () => stopBridge(containerName));
  })();

  bridgeLocks.set(containerName, work);
  try {
    await work;
  } finally {
    if (bridgeLocks.get(containerName) === work) {
      bridgeLocks.delete(containerName);
    }
  }
}

function stopBridge(containerName: string): void {
  const state = active.get(containerName);
  if (!state) return;
  active.delete(containerName);
  const stream = state.stream as
    | (NodeJS.ReadableStream & { destroy?: () => void; removeAllListeners?: () => void })
    | null;
  state.stream = null;
  if (stream) {
    try {
      stream.removeAllListeners?.();
    } catch {
      /* ignore */
    }
    try {
      stream.destroy?.();
    } catch {
      /* ignore */
    }
  }
}

function handleLogLine(state: BridgeState, line: string): void {
  const chatMatch = line.match(CHAT_REGEX);
  if (chatMatch) {
    const [, player, msg] = chatMatch;
    sendToChannel(state.channelId, msg, {
      username: player,
      avatarUrl: `https://mc-heads.net/avatar/${encodeURIComponent(player)}/64/nohelm`
    }).catch(() => undefined);
    return;
  }

  const joinMatch = line.match(JOIN_REGEX);
  if (joinMatch) {
    const player = joinMatch[1];
    const embed = new EmbedBuilder()
      .setColor(COLOR_JOIN)
      .setAuthor({
        name: `${player} entrou no jogo`,
        iconURL: `https://mc-heads.net/avatar/${encodeURIComponent(player)}/32/nohelm`
      })
      .setTimestamp(new Date());
    sendEmbedToChannel(state.channelId, embed.toJSON()).catch(() => undefined);
    emitPlayerEvent('player.joined', state.containerName, player).catch(() => undefined);
    return;
  }

  const leaveMatch = line.match(LEAVE_REGEX);
  if (leaveMatch) {
    const player = leaveMatch[1];
    const embed = new EmbedBuilder()
      .setColor(COLOR_LEAVE)
      .setAuthor({
        name: `${player} saiu do jogo`,
        iconURL: `https://mc-heads.net/avatar/${encodeURIComponent(player)}/32/nohelm`
      })
      .setTimestamp(new Date());
    sendEmbedToChannel(state.channelId, embed.toJSON()).catch(() => undefined);
    emitPlayerEvent('player.left', state.containerName, player).catch(() => undefined);
    return;
  }

  if (DEATH_PATTERNS.some((p) => p.test(line))) {
    const m = line.match(/\[(?:Server) thread\/INFO\]:?\s*(.+)$/);
    if (m && m[1] && !m[1].startsWith('[')) {
      const deathMsg = m[1].trim();
      const playerMatch = deathMsg.match(/^([A-Za-z0-9_]+)/);
      const player = playerMatch?.[1];
      const embed = new EmbedBuilder()
        .setColor(COLOR_DEATH)
        .setDescription(`💀 ${deathMsg}`)
        .setTimestamp(new Date());
      if (player) {
        embed.setThumbnail(`https://mc-heads.net/avatar/${encodeURIComponent(player)}/64/nohelm`);
      }
      sendEmbedToChannel(state.channelId, embed.toJSON()).catch(() => undefined);
    }
  }
}

async function emitPlayerEvent(
  type: 'player.joined' | 'player.left',
  containerName: string,
  playerName: string
): Promise<void> {
  const row = await db()
    .select({ id: schema.servers.id })
    .from(schema.servers)
    .where(eq(schema.servers.containerName, containerName))
    .get();
  if (!row) return;
  const tsKey = type === 'player.joined' ? 'joinedAt' : 'leftAt';
  emitEvent({
    type,
    serverId: row.id,
    payload: {
      serverId: row.id,
      containerName,
      playerName,
      [tsKey]: new Date().toISOString()
    }
  });
}

export async function setChannelForServer(
  containerName: string,
  channelId: string | null
): Promise<void> {
  const slug = containerName.replace(/^forja-/, '');
  await db()
    .update(schema.servers)
    .set({ discordChannelId: channelId, updatedAt: new Date() })
    .where(eq(schema.servers.containerName, containerName));

  if (channelId) {
    stopBridge(containerName);
    await startBridge(containerName, channelId, slug).catch(() => undefined);
  } else {
    stopBridge(containerName);
  }
}
