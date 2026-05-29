import { docker } from '$lib/docker/client';
import { listManagedServers } from '$lib/docker/server-actions';
import { events as discord } from '$lib/discord/notifier';
import { notifyServerLifecycle, notifyAdminDM } from '$lib/discord/bot';
import { emitEvent } from '$lib/webhooks/dispatcher';
import { db, schema } from '$lib/db';
import { eq } from 'drizzle-orm';

const CHECK_INTERVAL_MS = 30_000;
const MANUAL_STOP_WINDOW_MS = 120_000;

interface ServerState {
  state: string;
  lastSeen: number;
  reportedCrash: boolean;
}

const lastState = new Map<string, ServerState>();
const manualStops = new Map<string, number>();

let started = false;

export function startCrashWatcher(): void {
  if (started) return;
  started = true;
  setInterval(() => tick().catch(() => undefined), CHECK_INTERVAL_MS);
  setTimeout(() => tick().catch(() => undefined), 15_000);
}

export function recordManualStop(containerName: string): void {
  manualStops.set(containerName, Date.now());
}

async function tick(): Promise<void> {
  const servers = await listManagedServers().catch(() => []);
  const now = Date.now();

  for (const s of servers) {
    const prev = lastState.get(s.containerName);
    const isRunning = s.state === 'running';

    if (prev && prev.state === 'running' && !isRunning && !prev.reportedCrash) {
      const manualStopAt = manualStops.get(s.containerName);
      const wasManual = manualStopAt && now - manualStopAt < MANUAL_STOP_WINDOW_MS;

      if (!wasManual) {
        const exitCode = await getExitCode(s.containerName);
        discord.serverCrashed(s.containerName, exitCode).catch(() => undefined);
        notifyServerLifecycle(s.containerName, { type: 'crashed', exitCode }).catch(() => undefined);
        notifyAdminDM(
          `💥 Server **${s.displayName || s.containerName}** crashou${
            exitCode !== undefined ? ` (exit code ${exitCode})` : ''
          }.`
        ).catch(() => undefined);
        emitCrashEvent(s.containerName, s.displayName, exitCode, prev.lastSeen).catch(
          () => undefined
        );
        lastState.set(s.containerName, {
          state: s.state,
          lastSeen: now,
          reportedCrash: true
        });
        continue;
      }
    }

    lastState.set(s.containerName, {
      state: s.state,
      lastSeen: now,
      reportedCrash: isRunning ? false : (prev?.reportedCrash ?? false)
    });
  }

  for (const [name, entry] of lastState) {
    if (!servers.find((s) => s.containerName === name) && now - entry.lastSeen > 5 * 60_000) {
      lastState.delete(name);
    }
  }
  for (const [name, ts] of manualStops) {
    if (now - ts > MANUAL_STOP_WINDOW_MS) manualStops.delete(name);
  }
}

async function getExitCode(containerName: string): Promise<number | undefined> {
  try {
    const info = await docker().getContainer(containerName).inspect();
    return info.State.ExitCode;
  } catch {
    return undefined;
  }
}

async function emitCrashEvent(
  containerName: string,
  displayName: string,
  exitCode: number | undefined,
  lastSeenMs: number
): Promise<void> {
  const row = await db()
    .select({ id: schema.servers.id })
    .from(schema.servers)
    .where(eq(schema.servers.containerName, containerName))
    .get();
  if (!row) return;
  emitEvent({
    type: 'server.crashed',
    serverId: row.id,
    payload: {
      serverId: row.id,
      containerName,
      displayName,
      exitCode,
      crashedAt: new Date().toISOString(),
      lastSeenAt: new Date(lastSeenMs).toISOString()
    }
  });
}
