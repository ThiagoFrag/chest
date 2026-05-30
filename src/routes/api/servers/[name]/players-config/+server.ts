import { requireServerPermission } from '$lib/auth/require-server-permission';
import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { readContainerFile, writeContainerFile } from '$lib/mc/files';
import { sendCommand } from '$lib/mc/rcon';
import { dockerForContainer } from '$lib/docker/client';
import type { RequestHandler } from './$types';

interface WhitelistEntry { uuid?: string; name: string }
interface BanEntry {
  uuid?: string;
  name?: string;
  ip?: string;
  created?: string;
  source?: string;
  expires?: string;
  reason?: string;
}
interface OpEntry { uuid?: string; name: string; level: number; bypassesPlayerLimit?: boolean }

async function readJsonSafe<T>(name: string, path: string, fallback: T): Promise<T> {
  try {
    const raw = await readContainerFile(name, path);
    if (!raw.trim()) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function isRunning(name: string): Promise<boolean> {
  try {
    const info = await (await dockerForContainer(name)).getContainer(name).inspect();
    return info.State.Running;
  } catch {
    return false;
  }
}

export const GET: RequestHandler = async (event) => {
  const { params } = event;
  if (!params.name) throw error(400);
  await requireServerPermission(event, params.name, 'manage_players');

  const [whitelist, bans, banIps, ops] = await Promise.all([
    readJsonSafe<WhitelistEntry[]>(params.name, '/data/whitelist.json', []),
    readJsonSafe<BanEntry[]>(params.name, '/data/banned-players.json', []),
    readJsonSafe<BanEntry[]>(params.name, '/data/banned-ips.json', []),
    readJsonSafe<OpEntry[]>(params.name, '/data/ops.json', [])
  ]);

  return json({ whitelist, bans, banIps, ops });
};

const actionSchema = z.discriminatedUnion('list', [
  z.object({
    list: z.literal('whitelist'),
    action: z.enum(['add', 'remove']),
    player: z.string().min(1).max(32)
  }),
  z.object({
    list: z.literal('ops'),
    action: z.enum(['add', 'remove']),
    player: z.string().min(1).max(32)
  }),
  z.object({
    list: z.literal('bans'),
    action: z.enum(['add', 'remove']),
    player: z.string().min(1).max(32),
    reason: z.string().max(200).optional()
  }),
  z.object({
    list: z.literal('banIps'),
    action: z.enum(['add', 'remove']),
    ip: z.string().min(1).max(45),
    reason: z.string().max(200).optional()
  })
]);

function escapeForJson(s: string): string {
  return s.replace(/[\\"]/g, '\\$&');
}

async function runOrWrite(
  containerName: string,
  rconCmd: string,
  fallbackFiles: Array<{ path: string; transform: (raw: string) => string }>
): Promise<void> {
  if (await isRunning(containerName)) {
    await sendCommand(containerName, rconCmd);
    return;
  }
  for (const f of fallbackFiles) {
    const original = await readContainerFile(containerName, f.path).catch(() => '[]');
    const updated = f.transform(original);
    await writeContainerFile(containerName, f.path, updated);
  }
}

export const POST: RequestHandler = async (event) => {
  const { params, request } = event;
  if (!params.name) throw error(400);
  await requireServerPermission(event, params.name, 'manage_players');

  const body = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) throw error(400, 'body inválido');

  const cn = params.name;
  const d = parsed.data;

  try {
    if (d.list === 'whitelist') {
      const cmd = d.action === 'add' ? `whitelist add ${d.player}` : `whitelist remove ${d.player}`;
      await runOrWrite(cn, cmd, [{
        path: '/data/whitelist.json',
        transform: (raw) => {
          const list = (JSON.parse(raw || '[]') as WhitelistEntry[]) ?? [];
          if (d.action === 'add' && !list.find((e) => e.name.toLowerCase() === d.player.toLowerCase())) {
            list.push({ name: d.player });
          } else if (d.action === 'remove') {
            return JSON.stringify(list.filter((e) => e.name.toLowerCase() !== d.player.toLowerCase()), null, 2);
          }
          return JSON.stringify(list, null, 2);
        }
      }]);
    } else if (d.list === 'ops') {
      const cmd = d.action === 'add' ? `op ${d.player}` : `deop ${d.player}`;
      await runOrWrite(cn, cmd, [{
        path: '/data/ops.json',
        transform: (raw) => {
          const list = (JSON.parse(raw || '[]') as OpEntry[]) ?? [];
          if (d.action === 'add' && !list.find((e) => e.name.toLowerCase() === d.player.toLowerCase())) {
            list.push({ name: d.player, level: 4 });
          } else if (d.action === 'remove') {
            return JSON.stringify(list.filter((e) => e.name.toLowerCase() !== d.player.toLowerCase()), null, 2);
          }
          return JSON.stringify(list, null, 2);
        }
      }]);
    } else if (d.list === 'bans') {
      const reason = d.reason ? ` ${escapeForJson(d.reason)}` : '';
      const cmd = d.action === 'add' ? `ban ${d.player}${reason}` : `pardon ${d.player}`;
      await runOrWrite(cn, cmd, [{
        path: '/data/banned-players.json',
        transform: (raw) => {
          const list = (JSON.parse(raw || '[]') as BanEntry[]) ?? [];
          if (d.action === 'add' && !list.find((e) => e.name?.toLowerCase() === d.player.toLowerCase())) {
            list.push({
              name: d.player,
              created: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' +0000',
              source: 'Chest',
              expires: 'forever',
              reason: d.reason ?? 'Banned by an operator.'
            });
          } else if (d.action === 'remove') {
            return JSON.stringify(list.filter((e) => e.name?.toLowerCase() !== d.player.toLowerCase()), null, 2);
          }
          return JSON.stringify(list, null, 2);
        }
      }]);
    } else if (d.list === 'banIps') {
      const reason = d.reason ? ` ${escapeForJson(d.reason)}` : '';
      const cmd = d.action === 'add' ? `ban-ip ${d.ip}${reason}` : `pardon-ip ${d.ip}`;
      await runOrWrite(cn, cmd, [{
        path: '/data/banned-ips.json',
        transform: (raw) => {
          const list = (JSON.parse(raw || '[]') as BanEntry[]) ?? [];
          if (d.action === 'add' && !list.find((e) => e.ip === d.ip)) {
            list.push({
              ip: d.ip,
              created: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' +0000',
              source: 'Chest',
              expires: 'forever',
              reason: d.reason ?? 'Banned by an operator.'
            });
          } else if (d.action === 'remove') {
            return JSON.stringify(list.filter((e) => e.ip !== d.ip), null, 2);
          }
          return JSON.stringify(list, null, 2);
        }
      }]);
    }

    return json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'falha';
    throw error(500, msg);
  }
};
