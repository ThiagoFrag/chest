import { requireServerPermission } from '$lib/auth/require-server-permission';
import { error } from '@sveltejs/kit';
import { detectAuthMode } from '$lib/mc/auth-mode';
import { resolveDraslSkinUrl } from '$lib/mc/skin';
import type { RequestHandler } from './$types';

/**
 * Proxies a player's full skin PNG resolved via the server's Drasl (Yggdrasil)
 * instance, so the panel never depends on an external skin service for drasl
 * mode. The client (PlayerHead.svelte) crops the face on a <canvas>.
 *
 * Never throws to break the page: any failure returns 404 and the client
 * falls back to a local steve head.
 */
export const GET: RequestHandler = async (event) => {
  const { params, url } = event;
  if (!params.name) throw error(400);
  await requireServerPermission(event, params.name, 'view_logs');

  const uuid = url.searchParams.get('uuid');
  if (!uuid) throw error(400, 'uuid obrigatório');

  try {
    const auth = await detectAuthMode(params.name);
    if (!auth.draslUrl) throw error(404, 'server não está em modo drasl');

    const skinUrl = await resolveDraslSkinUrl(auth.draslUrl, uuid);
    if (!skinUrl) throw error(404, 'skin não encontrada');

    const skinRes = await fetch(skinUrl);
    if (!skinRes.ok) throw error(404, 'falha ao baixar skin');

    const buf = Buffer.from(await skinRes.arrayBuffer());
    return new Response(buf, {
      headers: {
        'content-type': 'image/png',
        'cache-control': 'private, max-age=300'
      }
    });
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) throw err;
    throw error(404, 'skin indisponível');
  }
};
