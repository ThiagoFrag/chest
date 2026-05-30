import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireServerPermission } from '$lib/auth/require-server-permission';
import { readContainerFile } from '$lib/mc/files';
import {
  summarizeAdvancements,
  summarizeStats,
  type AdvancementsSummary,
  type StatsSummary
} from '$lib/mc/advancements';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EMPTY_ADVANCEMENTS: AdvancementsSummary = {
  trees: [],
  totalDone: 0,
  totalAll: 0,
  recent: []
};

const EMPTY_STATS: StatsSummary = {
  playTimeHours: 0,
  deaths: 0,
  mobKills: 0,
  playerKills: 0,
  jumps: 0,
  damageDealt: 0,
  walkDistanceKm: 0
};

async function readJson(containerName: string, path: string): Promise<unknown | null> {
  try {
    const raw = await readContainerFile(containerName, path);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const GET: RequestHandler = async (event) => {
  const { name } = event.params;
  if (!name) throw error(400);
  await requireServerPermission(event, name, 'view_logs');

  const uuid = event.url.searchParams.get('uuid');
  if (!uuid) {
    throw error(400, 'Missing required query param: uuid');
  }
  if (!UUID_RE.test(uuid)) {
    throw error(400, 'Invalid uuid format');
  }

  const [advRaw, statsRaw] = await Promise.all([
    readJson(name, `/data/world/advancements/${uuid}.json`),
    readJson(name, `/data/world/stats/${uuid}.json`)
  ]);

  const advancements = advRaw
    ? summarizeAdvancements(advRaw as Record<string, unknown>)
    : EMPTY_ADVANCEMENTS;
  const stats = statsRaw
    ? summarizeStats(statsRaw as Parameters<typeof summarizeStats>[0])
    : EMPTY_STATS;

  return json({
    advancements,
    stats,
    hasData: advRaw !== null || statsRaw !== null
  });
};
