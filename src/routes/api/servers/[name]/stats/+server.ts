import { requireServerPermission } from '$lib/auth/require-server-permission';
import { error } from '@sveltejs/kit';
import { dockerForContainer } from '$lib/docker/client';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  const { params } = event;
  if (!params.name) throw error(400);
  await requireServerPermission(event, params.name, 'view_logs');

  const container = (await dockerForContainer(params.name)).getContainer(params.name);
  try {
    await container.inspect();
  } catch {
    throw error(404);
  }

  const statsStream = (await container.stats({
    stream: true
  })) as unknown as NodeJS.ReadableStream;

  const HEARTBEAT_MS = 20_000;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let closed = false;

  const destroyStatsStream = () => {
    try {
      (statsStream as unknown as { destroy?: () => void }).destroy?.();
    } catch {
      /* ignore */
    }
  };

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let buf = '';

      const teardown = () => {
        if (closed) return;
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        destroyStatsStream();
      };

      const send = (frame: string): boolean => {
        try {
          controller.enqueue(encoder.encode(frame));
          return true;
        } catch {
          teardown();
          return false;
        }
      };

      statsStream.on('data', (chunk: Buffer) => {
        if (closed) return;
        buf += chunk.toString('utf8');
        let nl = buf.indexOf('\n');
        while (nl !== -1) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (line) {
            try {
              const raw = JSON.parse(line);
              const cpu = computeCpu(raw);
              const memUsed = raw.memory_stats?.usage ?? 0;
              const memLimit = raw.memory_stats?.limit ?? 0;
              const payload = {
                cpuPercent: cpu,
                memUsedMb: Math.round(memUsed / 1024 / 1024),
                memLimitMb: Math.round(memLimit / 1024 / 1024)
              };
              if (!send(`data: ${JSON.stringify(payload)}\n\n`)) return;
            } catch {
              /* skip */
            }
          }
          nl = buf.indexOf('\n');
        }
      });

      statsStream.on('end', () => {
        teardown();
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      });
      statsStream.on('error', () => {
        teardown();
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      });

      heartbeat = setInterval(() => {
        send(': ping\n\n');
      }, HEARTBEAT_MS);
    },
    cancel() {
      closed = true;
      if (heartbeat) clearInterval(heartbeat);
      destroyStatsStream();
    }
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no'
    }
  });
};

interface DockerStatsRaw {
  cpu_stats?: {
    cpu_usage?: { total_usage?: number };
    system_cpu_usage?: number;
    online_cpus?: number;
  };
  precpu_stats?: {
    cpu_usage?: { total_usage?: number };
    system_cpu_usage?: number;
  };
}

function computeCpu(s: DockerStatsRaw): number {
  const cur = s.cpu_stats?.cpu_usage?.total_usage ?? 0;
  const pre = s.precpu_stats?.cpu_usage?.total_usage ?? 0;
  const sysCur = s.cpu_stats?.system_cpu_usage ?? 0;
  const sysPre = s.precpu_stats?.system_cpu_usage ?? 0;
  const cpus = s.cpu_stats?.online_cpus ?? 1;
  const dCpu = cur - pre;
  const dSys = sysCur - sysPre;
  if (dSys <= 0 || dCpu < 0) return 0;
  return Math.round((dCpu / dSys) * cpus * 100 * 10) / 10;
}
