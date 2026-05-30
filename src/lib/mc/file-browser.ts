import { dockerForContainer } from '$lib/docker/client';
import { readContainerFile, writeContainerFile } from './files';
import { withLock } from './locks';

const ALLOWED_ROOT = '/data';
const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const TEXT_EXTENSIONS = new Set([
  'txt', 'log', 'json', 'yml', 'yaml', 'toml', 'properties', 'conf', 'cfg',
  'md', 'sh', 'env', 'csv', 'xml', 'html', 'css', 'js', 'ts', 'mcfunction'
]);
const TEXT_FILENAMES = new Set([
  'server.properties', 'whitelist.json', 'banned-players.json', 'banned-ips.json',
  'ops.json', 'usercache.json', 'eula.txt', 'banned-ips.json'
]);

export interface DirEntry {
  name: string;
  path: string;
  type: 'file' | 'dir' | 'link';
  size: number;
  modified: string | null;
}

/**
 * Lock key for serializing writes to a container's filesystem. Granularity is
 * per-container so writes to different servers never block each other, while
 * concurrent writes to the same container are serialized to prevent lost
 * updates / interleaving (e.g. two writers racing on server.properties).
 */
function fileLockKey(containerName: string): string {
  return `file:${containerName}`;
}

export function isSafePath(path: string): boolean {
  if (!path.startsWith(ALLOWED_ROOT)) return false;
  if (path.includes('..')) return false;
  if (path.includes('\0')) return false;
  return true;
}

export function isTextFile(path: string): boolean {
  const name = path.split('/').pop() ?? '';
  if (TEXT_FILENAMES.has(name)) return true;
  const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() : '';
  return ext ? TEXT_EXTENSIONS.has(ext) : false;
}

async function execInContainer(containerName: string, cmd: string[]): Promise<string> {
  const container = (await dockerForContainer(containerName)).getContainer(containerName);
  const exec = await container.exec({
    Cmd: cmd,
    AttachStdout: true,
    AttachStderr: true
  });
  const stream = await exec.start({});
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    stream.on('data', (c: Buffer) => chunks.push(c));
    stream.on('end', () => resolve());
    stream.on('error', reject);
  });
  // dockerode multiplexed stream: 8 byte header per frame
  let out = '';
  let buf = Buffer.concat(chunks);
  while (buf.length >= 8) {
    const size = buf.readUInt32BE(4);
    if (buf.length < 8 + size) break;
    out += buf.subarray(8, 8 + size).toString('utf8');
    buf = buf.subarray(8 + size);
  }
  return out;
}

async function assertContainerReady(containerName: string): Promise<void> {
  try {
    const info = await (await dockerForContainer(containerName)).getContainer(containerName).inspect();
    if (info.State.Restarting) {
      throw new Error(`container ${containerName} está em loop de restart. veja logs no console pra debugar.`);
    }
    if (!info.State.Running) {
      throw new Error(`container ${containerName} está parado. inicie o server pra browsear arquivos.`);
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('container')) throw err;
    throw new Error(`container ${containerName} não encontrado ou inacessível.`);
  }
}

export async function listDir(containerName: string, path: string): Promise<DirEntry[]> {
  if (!isSafePath(path)) throw new Error('path inválido');
  await assertContainerReady(containerName);
  const normalized = path.replace(/\/+$/, '') || ALLOWED_ROOT;
  const out = await execInContainer(containerName, [
    'sh',
    '-c',
    `cd '${normalized.replace(/'/g, "'\\''")}' && ls -la --time-style=long-iso 2>/dev/null || echo ''`
  ]);
  const entries: DirEntry[] = [];
  for (const line of out.split('\n')) {
    const m = line.match(/^([-dl])\S+\s+\d+\s+\S+\s+\S+\s+(\d+)\s+(\S+\s+\S+)\s+(.+?)$/);
    if (!m) continue;
    const [, kind, size, modified, name] = m;
    if (name === '.' || name === '..') continue;
    const linkSplit = name.split(' -> ');
    const realName = linkSplit[0];
    entries.push({
      name: realName,
      path: `${normalized}/${realName}`,
      type: kind === 'd' ? 'dir' : kind === 'l' ? 'link' : 'file',
      size: parseInt(size, 10) || 0,
      modified
    });
  }
  return entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function readFile(containerName: string, path: string): Promise<{ content: string; truncated: boolean }> {
  if (!isSafePath(path)) throw new Error('path inválido');
  if (!isTextFile(path)) throw new Error('arquivo binário, não pode ser editado aqui');
  const raw = await readContainerFile(containerName, path);
  if (raw.length > MAX_FILE_SIZE) {
    return { content: raw.slice(0, MAX_FILE_SIZE), truncated: true };
  }
  return { content: raw, truncated: false };
}

export async function writeFile(containerName: string, path: string, content: string): Promise<void> {
  if (!isSafePath(path)) throw new Error('path inválido');
  if (!isTextFile(path)) throw new Error('arquivo binário, não pode ser editado aqui');
  if (content.length > MAX_FILE_SIZE) throw new Error('arquivo muito grande (>1MB)');
  await withLock(fileLockKey(containerName), () => writeContainerFile(containerName, path, content));
}

/**
 * Serialized read-modify-write of a single file inside a container. The whole
 * read → transform → write cycle runs under one per-container lock, so two
 * concurrent edits to the same file (e.g. the server.properties endpoint) can
 * never interleave or lose an update. Returns the content that was written.
 *
 * `transform` receives the current file content (empty string if the file does
 * not exist yet) and returns the new content to persist.
 */
export async function readModifyWrite(
  containerName: string,
  path: string,
  transform: (current: string) => string | Promise<string>
): Promise<string> {
  if (!isSafePath(path)) throw new Error('path inválido');
  if (!isTextFile(path)) throw new Error('arquivo binário, não pode ser editado aqui');
  return withLock(fileLockKey(containerName), async () => {
    let current = '';
    try {
      current = await readContainerFile(containerName, path);
    } catch {
      current = '';
    }
    const next = await transform(current);
    if (next.length > MAX_FILE_SIZE) throw new Error('arquivo muito grande (>1MB)');
    await writeContainerFile(containerName, path, next);
    return next;
  });
}
