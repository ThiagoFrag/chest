import { eq, and, lte } from 'drizzle-orm';
import { db, schema } from '$lib/db';
import { dockerForContainer } from '$lib/docker/client';
import { createBackup } from '$lib/mc/backup';
import { sendCommand } from '$lib/mc/rcon';
import { parseCron, matches, nextRunAt } from './cron';

const CHECK_INTERVAL_MS = 60_000;

let started = false;

export function startScheduler(): void {
  if (started) return;
  started = true;
  setInterval(() => tick().catch(() => undefined), CHECK_INTERVAL_MS);
  setTimeout(() => tick().catch(() => undefined), 10_000);
}

async function tick(): Promise<void> {
  const now = new Date();
  now.setSeconds(0, 0);

  const tasks = await db()
    .select()
    .from(schema.scheduledTasks)
    .where(eq(schema.scheduledTasks.enabled, true))
    .catch(() => []);

  for (const task of tasks) {
    try {
      const cron = parseCron(task.cronExpr);
      if (!matches(cron, now)) continue;

      const last = task.lastRunAt ? task.lastRunAt.getTime() : 0;
      const sameMinute = Math.floor(last / 60_000) === Math.floor(now.getTime() / 60_000);
      if (sameMinute) continue;

      await runOne(task);
    } catch {
      /* ignore individual */
    }
  }
}

async function runOne(task: schema.ScheduledTask): Promise<void> {
  const serverRow = await db()
    .select()
    .from(schema.servers)
    .where(eq(schema.servers.id, task.serverId))
    .get();
  if (!serverRow) return;

  let status = 'ok';
  try {
    const params = JSON.parse(task.params) as Record<string, unknown>;
    if (task.taskType === 'backup') {
      const scope = (params.scope === 'full' ? 'full' : 'world') as 'world' | 'full';
      await createBackup(serverRow.containerName, scope);
    } else if (task.taskType === 'restart') {
      const d = await dockerForContainer(serverRow.containerName);
      await d.getContainer(serverRow.containerName).restart({ t: 30 });
    } else if (task.taskType === 'command') {
      const cmd = String(params.command ?? '');
      if (cmd) await sendCommand(serverRow.slug, cmd);
    }
  } catch (err) {
    status = err instanceof Error ? err.message.slice(0, 200) : 'erro';
  }

  const next = nextRunAt(task.cronExpr, new Date());
  await db()
    .update(schema.scheduledTasks)
    .set({
      lastRunAt: new Date(),
      lastRunStatus: status,
      nextRunAt: next,
      updatedAt: new Date()
    })
    .where(eq(schema.scheduledTasks.id, task.id))
    .catch(() => undefined);
}
