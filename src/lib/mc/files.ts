import { dockerForContainer } from '$lib/docker/client';
import * as tar from 'node:stream/web';
import { Readable } from 'node:stream';

export async function readContainerFile(
  containerName: string,
  pathInContainer: string
): Promise<string> {
  const container = (await dockerForContainer(containerName)).getContainer(containerName);
  const stream = (await container.getArchive({
    path: pathInContainer
  })) as unknown as NodeJS.ReadableStream;
  const chunks: Buffer[] = [];
  for await (const c of stream as AsyncIterable<Buffer>) chunks.push(c);
  const buf = Buffer.concat(chunks);
  return extractSingleFileFromTar(buf);
}

export async function writeContainerFile(
  containerName: string,
  pathInContainer: string,
  content: string | Buffer
): Promise<void> {
  const container = (await dockerForContainer(containerName)).getContainer(containerName);
  const buffer = typeof content === 'string' ? Buffer.from(content, 'utf8') : content;
  const name = pathInContainer.split('/').pop() ?? 'file';
  const dir = pathInContainer.substring(0, pathInContainer.lastIndexOf('/')) || '/';
  const tarBuf = makeSingleFileTar(name, buffer);
  await container.putArchive(tarBuf, { path: dir });
}

function makeSingleFileTar(name: string, content: Buffer): Buffer {
  const header = Buffer.alloc(512);
  header.write(name.slice(0, 100), 0, 100, 'ascii');
  header.write('0000644', 100, 7, 'ascii');
  header.write('0000000', 108, 7, 'ascii');
  header.write('0000000', 116, 7, 'ascii');
  header.write(content.length.toString(8).padStart(11, '0'), 124, 11, 'ascii');
  header.write(
    Math.floor(Date.now() / 1000)
      .toString(8)
      .padStart(11, '0'),
    136,
    11,
    'ascii'
  );
  header.write('        ', 148, 8, 'ascii');
  header.write('0', 156, 1, 'ascii');
  header.write('ustar', 257, 5, 'ascii');
  let sum = 0;
  for (let i = 0; i < 512; i++) sum += header[i];
  header.write(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'ascii');

  const padded = Buffer.alloc(Math.ceil(content.length / 512) * 512);
  content.copy(padded);
  const trailer = Buffer.alloc(1024);
  return Buffer.concat([header, padded, trailer]);
}

function extractSingleFileFromTar(buf: Buffer): string {
  let offset = 0;
  while (offset + 512 <= buf.length) {
    const header = buf.subarray(offset, offset + 512);
    const name = header.subarray(0, 100).toString('ascii').replace(/\0+$/, '');
    if (!name) break;
    const sizeStr = header
      .subarray(124, 135)
      .toString('ascii')
      .replace(/\0+$/, '')
      .trim();
    const size = parseInt(sizeStr, 8);
    if (isNaN(size)) break;
    const typeflag = header.subarray(156, 157).toString('ascii');
    offset += 512;
    if (typeflag === '0' || typeflag === '') {
      return buf.subarray(offset, offset + size).toString('utf8');
    }
    offset += Math.ceil(size / 512) * 512;
  }
  return '';
}

export interface ServerProperties {
  [key: string]: string;
}

export function parseProperties(content: string): ServerProperties {
  const out: ServerProperties = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

export function serializeProperties(props: ServerProperties): string {
  return (
    Object.entries(props)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n') + '\n'
  );
}

export function mergeProperties(originalText: string, updates: ServerProperties): string {
  const lines = originalText.split('\n');
  const seen = new Set<string>();
  const out = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return line;
    const key = trimmed.slice(0, eq).trim();
    if (key in updates) {
      seen.add(key);
      return `${key}=${updates[key]}`;
    }
    return line;
  });
  for (const [k, v] of Object.entries(updates)) {
    if (!seen.has(k)) out.push(`${k}=${v}`);
  }
  return out.join('\n');
}
