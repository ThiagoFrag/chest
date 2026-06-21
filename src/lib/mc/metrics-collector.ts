import { dockerForContainer } from '$lib/docker/client';
import { db, schema } from '$lib/db';
import { listManagedServers, type ManagedServer } from '$lib/docker/server-actions';
import { getStatus } from './monitor';
import { eq, lt } from 'drizzle-orm';

const INTERVAL_MS = 30_000;
const RETENTION_DAYS = 30;

let started = false;

export function startMetricsCollector(): void {
  if (started) return;
  started = true;
  setInterval(() => {
    collect().catch(() => undefined);
  }, INTERVAL_MS);
  setTimeout(() => collect().catch(() => undefined), 5_000);
  setInterval(() => purgeOld().catch(() => undefined), 1000 * 60 * 60);
}

async function collect(): Promise<void> {
  const servers = await listManagedServers().catch(() => []);
  const now = new Date();

  const byHost = new Map<string, ManagedServer[]>();
  for (const s of servers) {
    if (s.state !== 'running') continue;
    const list = byHost.get(s.hostId);
    if (list) list.push(s);
    else byHost.set(s.hostId, [s]);
  }

  // One host being unreachable must never sink the others, so each host runs in
  // its own settled branch and failures only log.
  await Promise.allSettled(
    [...byHost.entries()].map(([hostId, hostServers]) =>
      collectHost(hostId, hostServers, now)
    )
  );
}

async function collectHost(
  hostId: string,
  hostServers: ManagedServer[],
  now: Date
): Promise<void> {
  for (const s of hostServers) {
    try {
      const stats = await getOneShotStats(s.containerName);
      let playersOnline: number | null = null;
      if (s.hostPort) {
        const mc = await getStatus('host.docker.internal', s.hostPort, 2000).catch(
          () => null
        );
        if (mc?.online) playersOnline = mc.players.online;
      }

      let serverRow: typeof schema.servers.$inferSelect | undefined;
      try {
        serverRow = await db()
          .select()
          .from(schema.servers)
          .where(eq(schema.servers.containerName, s.containerName))
          .get();
      } catch {
        serverRow = undefined;
      }

      if (!serverRow) continue;

      await db()
        .insert(schema.metricSnapshots)
        .values({
          serverId: serverRow.id,
          timestamp: now,
          cpuPercent: stats.cpuPercent,
          ramUsedMb: stats.ramUsedMb,
          playersOnline
        })
        .catch(() => undefined);
    } catch (err) {
      console.warn(
        `[metrics-collector] failed to collect ${s.containerName} on host "${hostId}", skipping:`,
        err instanceof Error ? err.message : err
      );
    }
  }
}

async function purgeOld(): Promise<void> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  await db()
    .delete(schema.metricSnapshots)
    .where(lt(schema.metricSnapshots.timestamp, cutoff))
    .catch(() => undefined);
}

interface OneShotStats {
  cpuPercent: number;
  ramUsedMb: number;
}

async function getOneShotStats(containerName: string): Promise<OneShotStats> {
  const d = await dockerForContainer(containerName);
  const container = d.getContainer(containerName);
  const raw = (await container.stats({ stream: false })) as unknown as {
    cpu_stats?: {
      cpu_usage?: { total_usage?: number };
      system_cpu_usage?: number;
      online_cpus?: number;
    };
    precpu_stats?: {
      cpu_usage?: { total_usage?: number };
      system_cpu_usage?: number;
    };
    memory_stats?: { usage?: number; limit?: number };
  };

  const cur = raw.cpu_stats?.cpu_usage?.total_usage ?? 0;
  const pre = raw.precpu_stats?.cpu_usage?.total_usage ?? 0;
  const sysCur = raw.cpu_stats?.system_cpu_usage ?? 0;
  const sysPre = raw.precpu_stats?.system_cpu_usage ?? 0;
  const cpus = raw.cpu_stats?.online_cpus ?? 1;
  const dCpu = cur - pre;
  const dSys = sysCur - sysPre;
  const cpuPercent = dSys > 0 ? Math.round((dCpu / dSys) * cpus * 100 * 10) / 10 : 0;

  return {
    cpuPercent: cpuPercent < 0 ? 0 : cpuPercent,
    ramUsedMb: Math.round((raw.memory_stats?.usage ?? 0) / 1024 / 1024)
  };
}
