import { docker } from './client';
import type { ContainerInfo, ContainerInspectInfo } from 'dockerode';
import { events as discord } from '$lib/discord/notifier';
import { notifyServerLifecycle } from '$lib/discord/bot';
import { recordManualStop } from '$lib/mc/crash-watcher';
import { dispatchWebhook, emitEvent } from '$lib/webhooks/dispatcher';
import { db, schema } from '$lib/db';
import { eq } from 'drizzle-orm';

async function lookupServerId(containerName: string): Promise<string | null> {
  const row = await db()
    .select({ id: schema.servers.id })
    .from(schema.servers)
    .where(eq(schema.servers.containerName, containerName))
    .get();
  return row?.id ?? null;
}

async function lookupServerMeta(
  containerName: string
): Promise<{ id: string; displayName: string; mcVersion: string; hostPort: number } | null> {
  const row = await db()
    .select({
      id: schema.servers.id,
      displayName: schema.servers.displayName,
      mcVersion: schema.servers.mcVersion,
      hostPort: schema.servers.hostPortHttp
    })
    .from(schema.servers)
    .where(eq(schema.servers.containerName, containerName))
    .get();
  return row ?? null;
}

async function emitLifecycle(
  type: 'server.started' | 'server.stopped' | 'server.restarted',
  containerName: string,
  extra: Record<string, unknown> = {}
): Promise<void> {
  const meta = await lookupServerMeta(containerName);
  if (!meta) return;
  const tsKey =
    type === 'server.started'
      ? 'startedAt'
      : type === 'server.stopped'
        ? 'stoppedAt'
        : 'restartedAt';
  emitEvent({
    type,
    serverId: meta.id,
    payload: {
      serverId: meta.id,
      containerName,
      displayName: meta.displayName,
      mcVersion: meta.mcVersion,
      hostPort: meta.hostPort,
      [tsKey]: new Date().toISOString(),
      ...extra
    }
  });
}

export interface ManagedServer {
  id: string;
  containerName: string;
  displayName: string;
  image: string;
  state: 'running' | 'exited' | 'created' | 'restarting' | 'paused' | 'dead';
  status: string;
  uptime: number | null;
  mcVersion: string | null;
  hostPort: number | null;
  rconPort: number | null;
}

const MANAGED_LABEL = 'forja.managed';
const DISPLAY_LABEL = 'forja.display';

export async function listManagedServers(): Promise<ManagedServer[]> {
  const containers = await docker().listContainers({
    all: true,
    filters: { label: [`${MANAGED_LABEL}=true`] }
  });
  return containers.map(toManagedServer);
}

export async function getServer(
  containerName: string
): Promise<ManagedServer | null> {
  const containers = await docker().listContainers({
    all: true,
    filters: { name: [containerName] }
  });
  const found = containers.find(
    (c) => c.Labels?.[MANAGED_LABEL] === 'true' && c.Names.includes(`/${containerName}`)
  );
  return found ? toManagedServer(found) : null;
}

export async function inspectServer(
  containerName: string
): Promise<ContainerInspectInfo | null> {
  try {
    return await docker().getContainer(containerName).inspect();
  } catch {
    return null;
  }
}

async function fireServerWebhook(
  event: 'server.started' | 'server.stopped' | 'server.restarted',
  containerName: string
): Promise<void> {
  const serverId = await lookupServerId(containerName);
  if (!serverId) return;
  await dispatchWebhook({ event, data: { containerName, serverId }, serverId });
}

export async function startServer(containerName: string): Promise<void> {
  await assertManaged(containerName);
  await docker().getContainer(containerName).start();
  discord.serverStarted(containerName).catch(() => undefined);
  notifyServerLifecycle(containerName, { type: 'started' }).catch(() => undefined);
  fireServerWebhook('server.started', containerName).catch(() => undefined);
  emitLifecycle('server.started', containerName).catch(() => undefined);
}

export async function stopServer(containerName: string, timeout = 60): Promise<void> {
  await assertManaged(containerName);
  recordManualStop(containerName);
  await docker().getContainer(containerName).stop({ t: timeout });
  discord.serverStopped(containerName).catch(() => undefined);
  notifyServerLifecycle(containerName, { type: 'stopped' }).catch(() => undefined);
  fireServerWebhook('server.stopped', containerName).catch(() => undefined);
  emitLifecycle('server.stopped', containerName, { manual: true }).catch(() => undefined);
}

export async function restartServer(
  containerName: string,
  timeout = 60
): Promise<void> {
  await assertManaged(containerName);
  recordManualStop(containerName);
  await docker().getContainer(containerName).restart({ t: timeout });
  discord.serverRestarted(containerName).catch(() => undefined);
  notifyServerLifecycle(containerName, { type: 'restarted' }).catch(() => undefined);
  fireServerWebhook('server.restarted', containerName).catch(() => undefined);
  emitLifecycle('server.restarted', containerName).catch(() => undefined);
}

async function assertManaged(containerName: string): Promise<void> {
  const info = await inspectServer(containerName);
  if (!info) throw new Error(`container ${containerName} não existe`);
  if (info.Config.Labels?.[MANAGED_LABEL] !== 'true') {
    throw new Error(`container ${containerName} não está marcado forja.managed=true`);
  }
}

function toManagedServer(c: ContainerInfo): ManagedServer {
  const name = c.Names[0]?.replace(/^\//, '') ?? 'unknown';
  const labels = c.Labels ?? {};
  const startedAt = c.State === 'running' ? extractUptime(c.Status) : null;
  const portInfo = findHostPort(c, 25565);
  const rconPort = findHostPort(c, 25575);

  return {
    id: c.Id,
    containerName: name,
    displayName: labels[DISPLAY_LABEL] ?? name,
    image: c.Image,
    state: (c.State as ManagedServer['state']) ?? 'dead',
    status: c.Status,
    uptime: startedAt,
    mcVersion: null,
    hostPort: portInfo,
    rconPort
  };
}

function extractUptime(status: string): number | null {
  const m = status.match(/Up (?:About )?(\d+)\s+(second|minute|hour|day|week)s?/i);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const mult: Record<string, number> = {
    second: 1,
    minute: 60,
    hour: 3600,
    day: 86400,
    week: 604800
  };
  return n * (mult[unit] ?? 0);
}

function findHostPort(c: ContainerInfo, privatePort: number): number | null {
  const port = c.Ports?.find((p) => p.PrivatePort === privatePort && p.PublicPort);
  return port?.PublicPort ?? null;
}
