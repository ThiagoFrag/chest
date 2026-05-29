import { requireRole } from "$lib/auth/permissions";
import { json, error } from '@sveltejs/kit';
import { searchModpacks } from '$lib/modrinth/modpacks';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  requireRole(locals.user, "viewer");

  const query = url.searchParams.get('q') ?? '';
  const loader = url.searchParams.get('loader') as 'fabric' | 'forge' | 'neoforge' | 'quilt' | null;
  const mcVersion = url.searchParams.get('mc') ?? undefined;
  const category = url.searchParams.get('category') ?? undefined;
  const sort = url.searchParams.get('sort') as 'relevance' | 'downloads' | 'follows' | 'newest' | 'updated' | null;
  const offset = Number(url.searchParams.get('offset') ?? '0');

  try {
    const result = await searchModpacks({
      query,
      loader: loader ?? undefined,
      mcVersion,
      category,
      sort: sort ?? 'downloads',
      offset: isNaN(offset) ? 0 : Math.max(0, offset),
      limit: 24
    });
    return json(result);
  } catch (err) {
    throw error(502, err instanceof Error ? err.message : 'Modrinth indisponível');
  }
};
