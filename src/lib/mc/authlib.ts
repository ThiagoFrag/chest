import { docker } from '$lib/docker/client';
import { writeContainerFile } from './files';

const AUTHLIB_INJECTOR_URL =
  'https://github.com/yushijinhun/authlib-injector/releases/download/v1.2.5/authlib-injector-1.2.5.jar';

export const AUTHLIB_INJECTOR_PATH = '/data/authlib-injector.jar';

export function buildJvmOpts(draslUrl: string): string {
  const trimmed = draslUrl.replace(/\/$/, '');
  return `-javaagent:${AUTHLIB_INJECTOR_PATH}=${trimmed}/authlib-injector`;
}

export async function ensureAuthlibInjector(containerName: string): Promise<void> {
  try {
    const exec = await docker().getContainer(containerName).exec({
      Cmd: ['sh', '-c', `test -f ${AUTHLIB_INJECTOR_PATH} && echo ok || echo missing`],
      AttachStdout: true,
      AttachStderr: true
    });
    const stream = await exec.start({});
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve) => {
      stream.on('data', (c: Buffer) => chunks.push(c));
      stream.on('end', () => resolve());
      stream.on('error', () => resolve());
    });
    const out = Buffer.concat(chunks).toString('utf8');
    if (out.includes('ok')) return;
  } catch {
    /* fallthrough — try to install */
  }

  const res = await fetch(AUTHLIB_INJECTOR_URL);
  if (!res.ok) throw new Error(`falha ao baixar authlib-injector: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeContainerFile(containerName, AUTHLIB_INJECTOR_PATH, buf);
}
