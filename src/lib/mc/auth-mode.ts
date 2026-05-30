import { dockerForContainer } from '$lib/docker/client';
import { getSetting } from '$lib/settings';
import { ensureAuthlibInjector, buildJvmOpts } from './authlib';

export type AuthMode = 'mojang' | 'drasl' | 'offline';

export interface AuthModeStatus {
  mode: AuthMode;
  onlineMode: boolean;
  draslUrl: string | null;
  jvmOpts: string | null;
}

export async function detectAuthMode(containerName: string): Promise<AuthModeStatus> {
  const info = await (await dockerForContainer(containerName)).getContainer(containerName).inspect();
  const envArr = info.Config.Env ?? [];
  const env: Record<string, string> = {};
  for (const e of envArr) {
    const i = e.indexOf('=');
    if (i > 0) env[e.slice(0, i)] = e.slice(i + 1);
  }

  const onlineMode = (env.ONLINE_MODE ?? 'TRUE').toUpperCase() === 'TRUE';
  const jvm = env.JVM_OPTS ?? '';
  const draslMatch = jvm.match(/-javaagent:[^\s=]+=([^\s]+)/);
  const draslUrl = draslMatch?.[1] ?? null;

  let mode: AuthMode;
  if (draslUrl) mode = 'drasl';
  else if (!onlineMode) mode = 'offline';
  else mode = 'mojang';

  return { mode, onlineMode, draslUrl, jvmOpts: jvm || null };
}

export async function setAuthMode(
  containerName: string,
  mode: AuthMode,
  opts: { draslUrl?: string } = {}
): Promise<{ recreated: boolean; jvmOpts: string | null; onlineMode: boolean }> {
  const dockerClient = await dockerForContainer(containerName);
  const container = dockerClient.getContainer(containerName);
  const info = await container.inspect();
  const wasRunning = info.State.Running;

  const envArr = info.Config.Env ?? [];
  const envMap: Record<string, string> = {};
  for (const e of envArr) {
    const i = e.indexOf('=');
    if (i > 0) envMap[e.slice(0, i)] = e.slice(i + 1);
  }

  let onlineMode = true;
  let jvmOpts: string | null = null;

  if (mode === 'mojang') {
    onlineMode = true;
    jvmOpts = null;
  } else if (mode === 'offline') {
    onlineMode = false;
    jvmOpts = null;
  } else if (mode === 'drasl') {
    const url = opts.draslUrl ?? (await getSetting('drasl.url'));
    if (!url) throw new Error('drasl.url não configurado em Settings');
    await ensureAuthlibInjector(containerName);
    onlineMode = true;
    jvmOpts = buildJvmOpts(url);
  }

  envMap.ONLINE_MODE = onlineMode ? 'TRUE' : 'FALSE';
  if (jvmOpts) {
    envMap.JVM_OPTS = jvmOpts;
  } else {
    delete envMap.JVM_OPTS;
  }
  const newEnv = Object.entries(envMap).map(([k, v]) => `${k}=${v}`);

  if (wasRunning) {
    try {
      await container.stop({ t: 30 });
    } catch {
      /* ignore */
    }
  }

  const cfg = info.Config;
  const hostCfg = info.HostConfig;

  await container.remove({ force: true });

  await dockerClient.createContainer({
    name: containerName,
    Image: cfg.Image,
    Env: newEnv,
    ExposedPorts: cfg.ExposedPorts,
    Labels: cfg.Labels,
    HostConfig: hostCfg,
    NetworkingConfig: {
      EndpointsConfig: info.NetworkSettings?.Networks ?? {}
    }
  });

  if (wasRunning) {
    await dockerClient.getContainer(containerName).start();
  }

  return { recreated: true, jvmOpts, onlineMode };
}
