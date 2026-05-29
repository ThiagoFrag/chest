import { requireRole } from "$lib/auth/permissions";
import { json, error } from '@sveltejs/kit';
import { searchProjects } from '$lib/modrinth/client';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  requireRole(locals.user, "viewer");

  const query = url.searchParams.get('q') ?? '';
  const mcVersion = url.searchParams.get('mc') ?? undefined;
  const loader = url.searchParams.get('loader') ?? undefined;
  const projectType =
    (url.searchParams.get('type') as 'mod' | 'modpack' | 'plugin' | 'datapack' | null) ?? undefined;

  if (!query || query.trim().length < 2) {
    return json({ hits: [], total_hits: 0, offset: 0, limit: 0 });
  }

  try {
    const result = await searchProjects({
      query: query.trim(),
      mcVersion,
      loader: loader === 'vanilla' ? undefined : loader,
      projectType,
      limit: 20
    });
    return json(result);
  } catch (err) {
    throw error(502, err instanceof Error ? err.message : 'Modrinth indisponível');
  }
};
