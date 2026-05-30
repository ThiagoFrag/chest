import { dockerForContainer } from '$lib/docker/client';
import {
  readContainerFile,
  writeContainerFile,
  parseProperties,
  serializeProperties
} from './files';
import { sendCommand } from './rcon';

export interface WorldInfo {
  seed: string | null;
  levelName: string;
  difficulty: string;
  gameMode: string | null;
  hardcore: boolean;
  pvp: boolean;
}

export async function getWorldInfo(containerName: string): Promise<WorldInfo> {
  const raw = await readContainerFile(containerName, '/data/server.properties').catch(() => '');
  const props = parseProperties(raw);
  return {
    seed: props['level-seed'] || null,
    levelName: props['level-name'] || 'world',
    difficulty: props['difficulty'] || 'normal',
    gameMode: props['gamemode'] || null,
    hardcore: props['hardcore'] === 'true',
    pvp: props['pvp'] !== 'false'
  };
}

export async function setSeed(containerName: string, seed: string): Promise<void> {
  const raw = await readContainerFile(containerName, '/data/server.properties');
  const props = parseProperties(raw);
  props['level-seed'] = seed.trim();
  await writeContainerFile(containerName, '/data/server.properties', serializeProperties(props));
}

interface ResetOptions {
  newSeed?: string;
  resetNether?: boolean;
  resetEnd?: boolean;
}

export async function resetWorld(
  containerName: string,
  opts: ResetOptions = {}
): Promise<{ paused: boolean }> {
  const container = (await dockerForContainer(containerName)).getContainer(containerName);

  let wasRunning = false;
  try {
    const info = await container.inspect();
    wasRunning = info.State.Running;
  } catch {
    /* container offline */
  }

  if (wasRunning) {
    try {
      await sendCommand(containerName, 'save-off');
      await sendCommand(containerName, 'save-all flush');
    } catch {
      /* ignore - vai forçar stop */
    }
    await container.stop({ t: 30 });
  }

  const raw = await readContainerFile(containerName, '/data/server.properties').catch(() => '');
  const props = parseProperties(raw);
  const levelName = props['level-name'] || 'world';

  const pathsToRemove = [
    `/data/${levelName}`,
    opts.resetNether !== false ? `/data/${levelName}_nether` : null,
    opts.resetEnd !== false ? `/data/${levelName}_the_end` : null
  ].filter((p): p is string => p !== null);

  await container.start();
  await new Promise((r) => setTimeout(r, 1500));

  await execInContainer(containerName, ['rm', '-rf', ...pathsToRemove]);

  if (opts.newSeed !== undefined) {
    const propsRaw = await readContainerFile(containerName, '/data/server.properties').catch(() => raw);
    const newProps = parseProperties(propsRaw);
    newProps['level-seed'] = opts.newSeed.trim();
    await writeContainerFile(containerName, '/data/server.properties', serializeProperties(newProps));
  }

  await container.restart({ t: 10 });

  return { paused: wasRunning };
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
