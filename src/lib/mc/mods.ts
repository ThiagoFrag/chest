import { docker } from '$lib/docker/client';
import { db, schema } from '$lib/db';
import { eq } from 'drizzle-orm';

export interface ModFile {
  filename: string;
  enabled: boolean;
  sizeBytes: number;
  modifiedAt: number;
}

export async function listMods(containerName: string): Promise<ModFile[]> {
  const container = docker().getContainer(containerName);
  try {
    const stream = (await container.getArchive({ path: '/data/mods/' })) as unknown as NodeJS.ReadableStream;
    const chunks: Buffer[] = [];
    for await (const c of stream as AsyncIterable<Buffer>) chunks.push(c);
    return parseTarMods(Buffer.concat(chunks));
  } catch (err) {
    if (isNotFound(err)) return [];
    throw err;
  }
}

function parseTarMods(buf: Buffer): ModFile[] {
  const out: ModFile[] = [];
  let offset = 0;
  while (offset + 512 <= buf.length) {
    const header = buf.subarray(offset, offset + 512);
    const name = header.subarray(0, 100).toString('ascii').replace(/\0+$/, '');
    if (!name) {
      offset += 512;
      continue;
    }
    const sizeStr = header.subarray(124, 135).toString('ascii').replace(/\0+$/, '').trim();
    const size = parseInt(sizeStr, 8) || 0;
    const mtimeStr = header.subarray(136, 147).toString('ascii').replace(/\0+$/, '').trim();
    const mtime = parseInt(mtimeStr, 8) || 0;
    const typeflag = header.subarray(156, 157).toString('ascii');
    offset += 512 + Math.ceil(size / 512) * 512;

    if (typeflag !== '0' && typeflag !== '') continue;
    const base = name.replace(/^mods\//, '');
    if (!base || base.includes('/')) continue;
    if (base.endsWith('.jar')) {
      out.push({ filename: base, enabled: true, sizeBytes: size, modifiedAt: mtime });
    } else if (base.endsWith('.jar.disabled')) {
      out.push({
        filename: base.replace(/\.disabled$/, ''),
        enabled: false,
        sizeBytes: size,
        modifiedAt: mtime
      });
    }
  }
  return out.sort((a, b) => a.filename.localeCompare(b.filename));
}

export async function installMod(
  containerName: string,
  filename: string,
  content: Buffer
): Promise<void> {
  if (!filename.endsWith('.jar')) {
    throw new Error('apenas .jar permitido');
  }
  if (content.length < 4 || !content.slice(0, 2).equals(Buffer.from('PK'))) {
    throw new Error('arquivo não é jar válido (magic bytes ausentes)');
  }
  const container = docker().getContainer(containerName);
  await container.putArchive(makeSingleFileTar(filename, content), { path: '/data/mods' });
}

export async function removeMod(containerName: string, filename: string): Promise<void> {
  if (!filename.endsWith('.jar') && !filename.endsWith('.jar.disabled')) {
    throw new Error('filename inválido');
  }
  if (filename.includes('/') || filename.includes('..')) {
    throw new Error('path traversal');
  }
  const container = docker().getContainer(containerName);
  const exec = await container.exec({
    Cmd: ['rm', '-f', `/data/mods/${filename}`, `/data/mods/${filename}.disabled`],
    AttachStdout: true,
    AttachStderr: true
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

export async function toggleMod(
  containerName: string,
  filename: string,
  enabled: boolean
): Promise<void> {
  if (filename.includes('/') || filename.includes('..')) {
    throw new Error('path traversal');
  }
  const container = docker().getContainer(containerName);
  const current = enabled ? `/data/mods/${filename}.disabled` : `/data/mods/${filename}`;
  const target = enabled ? `/data/mods/${filename}` : `/data/mods/${filename}.disabled`;
  const exec = await container.exec({
    Cmd: ['sh', '-c', `mv -f "${current}" "${target}" 2>/dev/null || true`],
    AttachStdout: true,
    AttachStderr: true
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

export async function getServerMcInfo(slug: string): Promise<{ mcVersion: string; loader: string }> {
  const server = await db()
    .select()
    .from(schema.servers)
    .where(eq(schema.servers.slug, slug))
    .get();
  if (!server) {
    return { mcVersion: '1.21.1', loader: 'fabric' };
  }
  return {
    mcVersion: server.mcVersion,
    loader: server.modloaderType.toLowerCase()
  };
}

function makeSingleFileTar(name: string, content: Buffer): Buffer {
  const header = Buffer.alloc(512);
  header.write(name.slice(0, 100), 0, 100, 'ascii');
  header.write('0000644', 100, 7, 'ascii');
  header.write('0000000', 108, 7, 'ascii');
  header.write('0000000', 116, 7, 'ascii');
  header.write(content.length.toString(8).padStart(11, '0'), 124, 11, 'ascii');
  header.write(Math.floor(Date.now() / 1000).toString(8).padStart(11, '0'), 136, 11, 'ascii');
  header.write('        ', 148, 8, 'ascii');
  header.write('0', 156, 1, 'ascii');
  header.write('ustar', 257, 5, 'ascii');
  let sum = 0;
  for (let i = 0; i < 512; i++) sum += header[i];
  header.write(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'ascii');
  const padded = Buffer.alloc(Math.ceil(content.length / 512) * 512);
  content.copy(padded);
  return Buffer.concat([header, padded, Buffer.alloc(1024)]);
}

function isNotFound(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { statusCode?: number; message?: string };
  return e.statusCode === 404 || /no such/i.test(e.message ?? '');
}
