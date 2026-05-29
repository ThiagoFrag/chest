import unzipper from 'unzipper';
import { docker } from '$lib/docker/client';
import { downloadFile, getVersions } from '$lib/modrinth/client';

interface ModrinthPackFile {
  path: string;
  hashes: { sha1: string; sha512?: string };
  env?: { client: 'required' | 'optional' | 'unsupported'; server: 'required' | 'optional' | 'unsupported' };
  downloads: string[];
  fileSize: number;
}

interface ModrinthPackIndex {
  formatVersion: number;
  game: 'minecraft';
  versionId: string;
  name: string;
  summary?: string;
  files: ModrinthPackFile[];
  dependencies: {
    minecraft?: string;
    'fabric-loader'?: string;
    'forge'?: string;
    'neoforge'?: string;
    'quilt-loader'?: string;
  };
}

export interface InstallModpackResult {
  installed: number;
  skipped: number;
  errors: Array<{ path: string; reason: string }>;
  mcVersion: string;
  loader: string;
}

export async function installModrinthModpack(
  containerName: string,
  projectId: string
): Promise<InstallModpackResult> {
  const versions = await getVersions(projectId);
  if (versions.length === 0) {
    throw new Error('modpack sem versões publicadas');
  }
  const v = versions[0];
  const mrpackFile = v.files.find((f) => f.filename.endsWith('.mrpack') && f.primary)
    ?? v.files.find((f) => f.filename.endsWith('.mrpack'));
  if (!mrpackFile) throw new Error('versão sem .mrpack');

  const packBuf = await downloadFile(mrpackFile.url);
  const index = await extractPackIndex(packBuf);

  const mcVersion = index.dependencies.minecraft ?? '1.21.1';
  const loader =
    index.dependencies['fabric-loader'] ? 'fabric'
    : index.dependencies['neoforge'] ? 'neoforge'
    : index.dependencies['forge'] ? 'forge'
    : index.dependencies['quilt-loader'] ? 'quilt'
    : 'vanilla';

  const result: InstallModpackResult = {
    installed: 0,
    skipped: 0,
    errors: [],
    mcVersion,
    loader
  };

  for (const file of index.files) {
    if (file.env?.server === 'unsupported') {
      result.skipped += 1;
      continue;
    }
    if (!file.path.startsWith('mods/')) continue;

    const filename = file.path.replace(/^mods\//, '');
    try {
      const url = file.downloads[0];
      if (!url) {
        result.errors.push({ path: file.path, reason: 'sem url' });
        continue;
      }
      const content = await downloadFile(url);
      await putModFile(containerName, filename, content);
      result.installed += 1;
    } catch (err) {
      result.errors.push({ path: file.path, reason: err instanceof Error ? err.message : String(err) });
    }
  }

  await extractOverrides(packBuf, containerName);

  return result;
}

async function extractPackIndex(buf: Buffer): Promise<ModrinthPackIndex> {
  const dir = await unzipper.Open.buffer(buf);
  const entry = dir.files.find((f) => f.path === 'modrinth.index.json');
  if (!entry) throw new Error('modrinth.index.json não encontrado no .mrpack');
  const content = await entry.buffer();
  return JSON.parse(content.toString('utf8')) as ModrinthPackIndex;
}

async function extractOverrides(buf: Buffer, containerName: string): Promise<void> {
  const dir = await unzipper.Open.buffer(buf);
  const container = docker().getContainer(containerName);

  for (const entry of dir.files) {
    if (entry.type !== 'File') continue;
    if (!entry.path.startsWith('overrides/')) continue;

    const relativePath = entry.path.replace(/^overrides\//, '');
    if (!relativePath || relativePath.includes('..')) continue;

    const content = await entry.buffer();
    const destDir = '/data/' + relativePath.substring(0, relativePath.lastIndexOf('/'));
    const filename = relativePath.substring(relativePath.lastIndexOf('/') + 1);

    try {
      await container.exec({
        Cmd: ['mkdir', '-p', destDir],
        AttachStdout: false,
        AttachStderr: false
      }).then((e) =>
        new Promise<void>((resolve) => {
          e.start({}, (_err, stream) => {
            if (!stream) return resolve();
            stream.on('end', () => resolve());
            stream.on('error', () => resolve());
          });
        })
      );
      const tarBuf = makeSingleFileTar(filename, content);
      await container.putArchive(tarBuf, { path: destDir });
    } catch {
      /* skip individual overrides errors */
    }
  }
}

async function putModFile(containerName: string, filename: string, content: Buffer): Promise<void> {
  const container = docker().getContainer(containerName);
  const tarBuf = makeSingleFileTar(filename, content);
  await container.putArchive(tarBuf, { path: '/data/mods' });
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
