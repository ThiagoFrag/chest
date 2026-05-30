import { dockerForContainer } from '$lib/docker/client';
import { sendCommand } from './rcon';
import { Readable } from 'node:stream';
import { events as discord } from '$lib/discord/notifier';
import { emitEvent } from '$lib/webhooks/dispatcher';
import { db, schema } from '$lib/db';
import { eq } from 'drizzle-orm';
import { getStorage } from '$lib/backup/factory';

export interface BackupEntry {
  id: string;
  filename: string;
  sizeBytes: number;
  createdAt: number;
  containerName: string;
  scope: 'world' | 'full';
}

export async function listBackups(containerName: string): Promise<BackupEntry[]> {
  const storage = await getStorage();
  const objs = await storage.list(`${containerName}__`);
  const out: BackupEntry[] = [];
  for (const obj of objs) {
    if (!obj.key.endsWith('.tar.gz')) continue;
    const m = obj.key.match(/^([^_]+)__(\d+)__(world|full)\.tar\.gz$/);
    if (!m) continue;
    out.push({
      id: obj.key.replace('.tar.gz', ''),
      filename: obj.key,
      sizeBytes: obj.sizeBytes,
      createdAt: Number(m[2]),
      containerName,
      scope: m[3] as 'world' | 'full'
    });
  }
  return out.sort((a, b) => b.createdAt - a.createdAt);
}

export async function createBackup(
  containerName: string,
  scope: 'world' | 'full'
): Promise<BackupEntry> {
  const storage = await getStorage();
  const container = (await dockerForContainer(containerName)).getContainer(containerName);

  let wasRunning = false;
  try {
    const info = await container.inspect();
    if (info.State.Restarting) {
      throw new Error(
        `container ${containerName} está em loop de restart (provável crash). espere estabilizar antes do backup.`
      );
    }
    wasRunning = info.State.Running;
    if (scope === 'world' && !wasRunning) {
      throw new Error(
        `container precisa rodar pelo menos 1x pra gerar o /data/world antes do backup. use scope "full" ou inicie o server primeiro.`
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('container')) throw err;
    /* offline / inspect fail */
  }

  if (wasRunning) {
    try {
      await sendCommand(containerName, 'save-off');
      await sendCommand(containerName, 'save-all flush');
      await new Promise((r) => setTimeout(r, 1500));
    } catch {
      /* ignore */
    }
  }

  const ts = Math.floor(Date.now() / 1000);
  const id = `${containerName}__${ts}__${scope}`;
  const filename = `${id}.tar.gz`;

  let sizeBytes = 0;
  try {
    const sourcePath = scope === 'world' ? '/data/world' : '/data';
    let archiveStream: NodeJS.ReadableStream;
    try {
      archiveStream = (await container.getArchive({ path: sourcePath })) as unknown as NodeJS.ReadableStream;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('404') || msg.includes('Could not find')) {
        throw new Error(
          `pasta ${sourcePath} não existe no container — server ainda não foi iniciado ou crashou antes de gerar o mundo.`
        );
      }
      if (msg.includes('409') || msg.includes('restarting')) {
        throw new Error(
          `container está reiniciando. espere o server estabilizar antes do backup.`
        );
      }
      throw err;
    }
    const result = await storage.put(filename, archiveStream);
    sizeBytes = result.sizeBytes;
  } finally {
    if (wasRunning) {
      try {
        await sendCommand(containerName, 'save-on');
      } catch {
        /* ignore */
      }
    }
  }

  const entry: BackupEntry = {
    id,
    filename,
    sizeBytes,
    createdAt: ts,
    containerName,
    scope
  };
  discord.backupCreated(containerName, scope, sizeBytes / 1024 / 1024).catch(() => undefined);
  emitBackupEvent('backup.created', containerName, {
    backupId: id,
    filename,
    scope,
    sizeBytes,
    createdAt: new Date(ts * 1000).toISOString()
  }).catch(() => undefined);
  return entry;
}

async function emitBackupEvent(
  type: 'backup.created' | 'backup.restored',
  containerName: string,
  extra: Record<string, unknown>
): Promise<void> {
  const row = await db()
    .select({ id: schema.servers.id })
    .from(schema.servers)
    .where(eq(schema.servers.containerName, containerName))
    .get();
  if (!row) return;
  emitEvent({
    type,
    serverId: row.id,
    payload: {
      serverId: row.id,
      containerName,
      ...extra
    }
  });
}

function isValidBackupId(id: string): boolean {
  return /^[a-z0-9-]+__\d+__(world|full)$/i.test(id);
}

/**
 * @deprecated Use `getBackupStream` instead. Retorna o caminho local apenas
 * quando o driver de storage é "local" (filesystem). Para drivers remotos
 * (ex.: s3) sempre retorna `null` — os callers devem migrar para
 * `getBackupStream`, que funciona em qualquer driver.
 */
export async function getBackupPath(id: string): Promise<string | null> {
  if (!isValidBackupId(id)) return null;
  const storage = await getStorage();
  if (storage.driver !== 'local') return null;
  const filename = `${id}.tar.gz`;
  // local-only: best-effort confirm existence via list
  const objs = await storage.list(`${id.split('__')[0]}__`);
  if (!objs.some((o) => o.key === filename)) return null;
  const { default: path } = await import('node:path');
  const { LocalStorage } = await import('$lib/backup/storage');
  if (!(storage instanceof LocalStorage)) return null;
  // LocalStorage.dir is private; reconstruct via env default (matches factory)
  const dir = process.env.FORJA_BACKUP_DIR ?? '/app/data/backups';
  return path.join(dir, filename);
}

/**
 * Stream-based download that works for any storage driver (local, s3, etc.).
 * Prefira este método em novos callers.
 */
export async function getBackupStream(
  id: string,
  containerName: string
): Promise<{ stream: NodeJS.ReadableStream; sizeBytes: number; filename: string } | null> {
  if (!isValidBackupId(id)) return null;
  if (!id.startsWith(`${containerName}__`)) return null;
  const storage = await getStorage();
  const filename = `${id}.tar.gz`;
  const objs = await storage.list(`${containerName}__`);
  const meta = objs.find((o) => o.key === filename);
  if (!meta) return null;
  const stream = await storage.get(filename);
  return { stream, sizeBytes: meta.sizeBytes, filename };
}

export async function deleteBackup(id: string): Promise<void> {
  if (!isValidBackupId(id)) return;
  const storage = await getStorage();
  await storage.delete(`${id}.tar.gz`);
}

export async function restoreBackup(id: string, containerName: string): Promise<void> {
  if (!isValidBackupId(id)) throw new Error('backup id inválido');
  if (!id.startsWith(`${containerName}__`)) throw new Error('backup não pertence a este container');

  const storage = await getStorage();
  const filename = `${id}.tar.gz`;
  const objs = await storage.list(`${containerName}__`);
  if (!objs.some((o) => o.key === filename)) throw new Error('backup não encontrado');

  const container = (await dockerForContainer(containerName)).getContainer(containerName);
  let wasRunning = false;
  try {
    const info = await container.inspect();
    wasRunning = info.State.Running;
  } catch {
    /* offline */
  }

  if (wasRunning) {
    await container.stop({ t: 30 });
  }

  await container.start();
  await new Promise((r) => setTimeout(r, 1500));

  const scope = id.endsWith('__full') ? 'full' : 'world';
  if (scope === 'world') {
    await execInContainer(containerName, ['sh', '-c', 'rm -rf /data/world /data/world_nether /data/world_the_end']);
  }

  const remoteStream = await storage.get(filename);
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    remoteStream.on('data', (c: Buffer | string) =>
      chunks.push(typeof c === 'string' ? Buffer.from(c) : c)
    );
    remoteStream.on('end', resolve);
    remoteStream.on('error', reject);
  });
  const tarBuf = Buffer.concat(chunks);
  await container.putArchive(Readable.from([tarBuf]) as unknown as NodeJS.ReadableStream, {
    path: '/data'
  });

  await container.restart({ t: 10 });

  emitBackupEvent('backup.restored', containerName, {
    backupId: id,
    scope,
    restoredAt: new Date().toISOString()
  }).catch(() => undefined);
}

async function execInContainer(containerName: string, cmd: string[]): Promise<void> {
  const container = (await dockerForContainer(containerName)).getContainer(containerName);
  const exec = await container.exec({
    Cmd: cmd,
    AttachStdout: true,
    AttachStderr: true,
    User: 'root'
  });
  await new Promise<void>((resolve, reject) => {
    exec.start({}, (err: Error | null, stream) => {
      if (err) return reject(err);
      if (!stream) return resolve();
      stream.on('end', () => resolve());
      stream.on('error', reject);
    });
  });
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
