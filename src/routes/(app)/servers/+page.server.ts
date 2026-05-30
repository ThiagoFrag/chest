import { listManagedServers } from '$lib/docker/server-actions';
import { listHosts } from '$lib/docker/hosts';
import { getStatus } from '$lib/mc/monitor';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const [servers, hosts] = await Promise.all([
    listManagedServers().catch(() => []),
    listHosts().catch(() => [])
  ]);

  const hostNameById = new Map(hosts.map((h) => [h.id, h.name]));
  const hasMultipleHosts = hosts.length > 1;

  const enriched = await Promise.all(
    servers.map(async (s) => {
      const hostName = hostNameById.get(s.hostId) ?? null;
      if (s.state !== 'running') return { ...s, mc: null, hostName };
      const port = s.hostPort ?? 25565;
      const mc = await getStatus('host.docker.internal', port, 3000).catch(() => null);
      return { ...s, mc, hostName };
    })
  );

  return { servers: enriched, hasMultipleHosts };
};
