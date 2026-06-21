import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { getServer } from '$lib/docker/server-actions';
import { getStatus } from '$lib/mc/monitor';
import { db, schema } from '$lib/db';
import { getSetting } from '$lib/settings';
import { tServer } from '$lib/i18n/server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  if (!params.name) throw error(400);
  const server = await getServer(params.name);
  if (!server) throw error(404, tServer(locals.locale, 'serverrors.servers.notFound'));

  let mc = null;
  if (server.state === 'running' && server.hostPort) {
    mc = await getStatus('host.docker.internal', server.hostPort, 3000).catch(() => null);
  } else if (server.state === 'running') {
    mc = await getStatus('host.docker.internal', 25565, 3000).catch(() => null);
  }

  const dbRow = await db()
    .select()
    .from(schema.servers)
    .where(eq(schema.servers.containerName, params.name))
    .get();

  const [baseUrl, cfToken, cnameTarget, mcHostAddress] = await Promise.all([
    getSetting('forja.public_base_url'),
    getSetting('cloudflare.api_token'),
    getSetting('cloudflare.cname_target'),
    getSetting('forja.mc_host_address')
  ]);

  let baseHostname: string | null = null;
  if (baseUrl && cfToken && cnameTarget) {
    try {
      baseHostname = new URL(
        baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`
      ).hostname
        .split('.')
        .slice(-2)
        .join('.');
    } catch {
      /* ignore */
    }
  }

  return {
    server,
    mc,
    publicUrl: dbRow?.publicUrl ?? null,
    publicMode: dbRow?.publicMode ?? null,
    modloaderType: dbRow?.modloaderType ?? 'VANILLA',
    managed: !!dbRow,
    baseHostname,
    mcHostAddress
  };
};
