import { listManagedServers } from '$lib/docker/server-actions';
import { getStatus } from '$lib/mc/monitor';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const servers = await listManagedServers().catch(() => []);
  const running = servers.filter((s) => s.state === 'running');

  let playersOnline = 0;
  let playersMax = 0;
  for (const s of running) {
    const port = s.hostPort ?? 25565;
    const mc = await getStatus('host.docker.internal', port, 2000).catch(() => null);
    if (mc?.online) {
      playersOnline += mc.players.online;
      playersMax += mc.players.max;
    }
  }

  return {
    counts: {
      total: servers.length,
      running: running.length,
      playersOnline,
      playersMax
    }
  };
};
