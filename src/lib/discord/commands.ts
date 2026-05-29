import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder
} from 'discord.js';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/db';
import { listManagedServers, startServer, stopServer, restartServer } from '$lib/docker/server-actions';
import { getStatus } from '$lib/mc/monitor';
import { sendCommand, listPlayers } from '$lib/mc/rcon';
import { createBackup } from '$lib/mc/backup';

const COLOR_OK = 0x5ba34d;
const COLOR_INFO = 0x4aedd9;
const COLOR_WARN = 0xf0a526;
const COLOR_ERR = 0xaa2828;

export const COMMANDS = [
  new SlashCommandBuilder()
    .setName('servers')
    .setDescription('lista todos os servers gerenciados pela Chest'),
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('mostra status detalhado de um server')
    .addStringOption((opt) =>
      opt.setName('server').setDescription('nome do container').setRequired(true).setAutocomplete(true)
    ),
  new SlashCommandBuilder()
    .setName('list')
    .setDescription('lista players online em um server')
    .addStringOption((opt) =>
      opt.setName('server').setDescription('nome do container').setRequired(true).setAutocomplete(true)
    ),
  new SlashCommandBuilder()
    .setName('say')
    .setDescription('envia mensagem ao chat in-game')
    .addStringOption((opt) =>
      opt.setName('server').setDescription('nome do container').setRequired(true).setAutocomplete(true)
    )
    .addStringOption((opt) =>
      opt.setName('mensagem').setDescription('mensagem').setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('backup')
    .setDescription('cria backup do server')
    .addStringOption((opt) =>
      opt.setName('server').setDescription('nome do container').setRequired(true).setAutocomplete(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('scope')
        .setDescription('mundo apenas ou tudo')
        .addChoices({ name: 'mundo', value: 'world' }, { name: 'tudo', value: 'full' })
    ),
  new SlashCommandBuilder()
    .setName('start')
    .setDescription('inicia um server')
    .addStringOption((opt) =>
      opt.setName('server').setDescription('nome do container').setRequired(true).setAutocomplete(true)
    ),
  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('para um server')
    .addStringOption((opt) =>
      opt.setName('server').setDescription('nome do container').setRequired(true).setAutocomplete(true)
    ),
  new SlashCommandBuilder()
    .setName('restart')
    .setDescription('reinicia um server')
    .addStringOption((opt) =>
      opt.setName('server').setDescription('nome do container').setRequired(true).setAutocomplete(true)
    )
].map((c) => c.toJSON());

export async function autocompleteServers(query: string): Promise<Array<{ name: string; value: string }>> {
  const servers = await listManagedServers().catch(() => []);
  return servers
    .filter((s) => s.containerName.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 25)
    .map((s) => ({ name: `${s.displayName} (${s.containerName})`.slice(0, 100), value: s.containerName }));
}

export async function handleSlashCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const { commandName } = interaction;
  await interaction.deferReply();

  try {
    switch (commandName) {
      case 'servers':
        await handleServers(interaction);
        break;
      case 'status':
        await handleStatus(interaction);
        break;
      case 'list':
        await handleList(interaction);
        break;
      case 'say':
        await handleSay(interaction);
        break;
      case 'backup':
        await handleBackup(interaction);
        break;
      case 'start':
        await handleControl(interaction, 'start');
        break;
      case 'stop':
        await handleControl(interaction, 'stop');
        break;
      case 'restart':
        await handleControl(interaction, 'restart');
        break;
      default:
        await interaction.editReply('❓ comando desconhecido');
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await interaction
      .editReply({
        embeds: [new EmbedBuilder().setColor(COLOR_ERR).setTitle('❌ erro').setDescription(msg.slice(0, 1000))]
      })
      .catch(() => undefined);
  }
}

async function handleServers(i: ChatInputCommandInteraction): Promise<void> {
  const servers = await listManagedServers();
  if (servers.length === 0) {
    await i.editReply('nenhum server gerenciado.');
    return;
  }
  const embed = new EmbedBuilder()
    .setColor(COLOR_INFO)
    .setTitle('📦 Servers Chest')
    .setDescription(
      servers
        .map((s) => {
          const dot = s.state === 'running' ? '🟢' : '⚪';
          return `${dot} **${s.displayName}** — \`${s.containerName}\` (${s.state})`;
        })
        .join('\n')
    )
    .setFooter({ text: `${servers.length} servers` });
  await i.editReply({ embeds: [embed] });
}

async function handleStatus(i: ChatInputCommandInteraction): Promise<void> {
  const name = i.options.getString('server', true);
  const servers = await listManagedServers();
  const s = servers.find((x) => x.containerName === name);
  if (!s) {
    await i.editReply(`❌ server \`${name}\` não encontrado`);
    return;
  }

  let mcInfo = '';
  if (s.state === 'running') {
    const port = s.hostPort ?? 25565;
    const mc = await getStatus('host.docker.internal', port, 3000).catch(() => null);
    if (mc?.online) {
      mcInfo = `\n**versão:** ${mc.version}\n**players:** ${mc.players.online}/${mc.players.max}\n**motd:** ${mc.motd}`;
    }
  }

  const embed = new EmbedBuilder()
    .setColor(s.state === 'running' ? COLOR_OK : COLOR_WARN)
    .setTitle(`📊 ${s.displayName}`)
    .setDescription(
      `**status:** ${s.state}\n**container:** \`${s.containerName}\`\n**image:** ${s.image}${mcInfo}`
    );
  await i.editReply({ embeds: [embed] });
}

async function handleList(i: ChatInputCommandInteraction): Promise<void> {
  const name = i.options.getString('server', true);
  try {
    const players = await listPlayers(name);
    if (players.length === 0) {
      await i.editReply(`👥 nenhum player online em \`${name}\``);
    } else {
      const embed = new EmbedBuilder()
        .setColor(COLOR_OK)
        .setTitle(`👥 players em ${name}`)
        .setDescription(players.map((p) => `• ${p}`).join('\n'))
        .setFooter({ text: `${players.length} online` });
      await i.editReply({ embeds: [embed] });
    }
  } catch (err) {
    await i.editReply(`❌ ${err instanceof Error ? err.message : 'falha'}`);
  }
}

async function handleSay(i: ChatInputCommandInteraction): Promise<void> {
  const name = i.options.getString('server', true);
  const msg = i.options.getString('mensagem', true);
  const author = i.user.username;
  try {
    const escaped = msg.replace(/"/g, '\\"').slice(0, 200);
    await sendCommand(
      name,
      `tellraw @a {"text":"","extra":[{"text":"[Discord] ","color":"aqua","bold":true},{"text":"<${author}> ","color":"white","bold":true},{"text":"${escaped}","color":"white"}]}`
    );
    await i.editReply(`✅ mensagem enviada pra \`${name}\``);
  } catch (err) {
    await i.editReply(`❌ ${err instanceof Error ? err.message : 'falha'}`);
  }
}

async function handleBackup(i: ChatInputCommandInteraction): Promise<void> {
  const name = i.options.getString('server', true);
  const scope = (i.options.getString('scope') as 'world' | 'full' | null) ?? 'world';
  try {
    const entry = await createBackup(name, scope);
    const sizeMb = (entry.sizeBytes / 1024 / 1024).toFixed(1);
    const embed = new EmbedBuilder()
      .setColor(COLOR_OK)
      .setTitle('💾 backup criado')
      .setDescription(`\`${name}\` (${scope})`)
      .addFields(
        { name: 'tamanho', value: `${sizeMb} MB`, inline: true },
        { name: 'data', value: new Date(entry.createdAt * 1000).toLocaleString('pt-BR'), inline: true }
      );
    await i.editReply({ embeds: [embed] });
  } catch (err) {
    await i.editReply(`❌ ${err instanceof Error ? err.message : 'falha'}`);
  }
}

async function handleControl(
  i: ChatInputCommandInteraction,
  action: 'start' | 'stop' | 'restart'
): Promise<void> {
  const name = i.options.getString('server', true);
  try {
    if (action === 'start') await startServer(name);
    else if (action === 'stop') await stopServer(name);
    else await restartServer(name);
    const verb = { start: 'iniciado', stop: 'parado', restart: 'reiniciado' }[action];
    await i.editReply(`✅ server \`${name}\` ${verb}`);
  } catch (err) {
    await i.editReply(`❌ ${err instanceof Error ? err.message : 'falha'}`);
  }
}
