import { requireRole } from '$lib/auth/permissions';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface MojangVersion {
  id: string;
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha';
  releaseTime: string;
}

interface MojangManifest {
  latest: { release: string; snapshot: string };
  versions: MojangVersion[];
}

interface CacheEntry {
  data: { release: string[]; latest: string; snapshot: string[] };
  expiresAt: number;
}

let cache: CacheEntry | null = null;
const TTL_MS = 6 * 60 * 60 * 1000;

const MANIFEST_URL = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';

async function fetchVersions(): Promise<CacheEntry['data']> {
  if (cache && cache.expiresAt > Date.now()) return cache.data;

  const res = await fetch(MANIFEST_URL, {
    headers: { 'User-Agent': 'chest-panel/0.1.0' }
  });
  if (!res.ok) throw new Error(`Mojang manifest ${res.status}`);
  const manifest = (await res.json()) as MojangManifest;

  const releases: string[] = [];
  const snapshots: string[] = [];
  for (const v of manifest.versions) {
    if (v.type === 'release') releases.push(v.id);
    else if (v.type === 'snapshot') snapshots.push(v.id);
  }

  const data = {
    release: releases,
    latest: manifest.latest.release,
    snapshot: snapshots.slice(0, 20)
  };

  cache = { data, expiresAt: Date.now() + TTL_MS };
  return data;
}

export const GET: RequestHandler = async ({ locals }) => {
  requireRole(locals.user, 'viewer');
  try {
    const data = await fetchVersions();
    return json(data, {
      headers: { 'cache-control': 'public, max-age=3600' }
    });
  } catch (err) {
    throw error(502, err instanceof Error ? err.message : 'falha Mojang');
  }
};
