import { listManagedServers } from '$lib/docker/server-actions';
import { getStatus } from '$lib/mc/monitor';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const servers = await listManagedServers().catch(() => []);

  const enriched = await Promise.all(
    servers.map(async (s) => {
      if (s.state !== 'running') return { ...s, mc: null };
      const port = s.hostPort ?? 25565;
      const mc = await getStatus('host.docker.internal', port, 3000).catch(() => null);
      return { ...s, mc };
    })
  );

  return { servers: enriched };
};
