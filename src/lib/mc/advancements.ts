export type AdvancementTree = 'story' | 'nether' | 'end' | 'adventure' | 'husbandry';

const TREES: AdvancementTree[] = ['story', 'nether', 'end', 'adventure', 'husbandry'];

export interface TreeProgress {
  tree: AdvancementTree;
  done: number;
  total: number;
}

export interface RecentAdvancement {
  id: string;
  name: string;
  tree: AdvancementTree;
  at: string;
}

export interface AdvancementsSummary {
  trees: TreeProgress[];
  totalDone: number;
  totalAll: number;
  recent: RecentAdvancement[];
}

interface RawAdvancement {
  done?: boolean;
  criteria?: Record<string, string>;
}

type RawAdvancements = Record<string, unknown>;

function treeOf(id: string): AdvancementTree | null {
  const match = id.match(/^minecraft:([a-z_]+)\//);
  if (!match) return null;
  const tree = match[1] as AdvancementTree;
  return TREES.includes(tree) ? tree : null;
}

export function prettyAdvancementName(id: string): string {
  const withoutPrefix = id.replace(/^minecraft:/, '');
  const last = withoutPrefix.split('/').pop() ?? withoutPrefix;
  return last
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function latestCriteriaDate(adv: RawAdvancement): string | null {
  if (!adv.criteria) return null;
  let latest: number | null = null;
  let latestRaw: string | null = null;
  for (const value of Object.values(adv.criteria)) {
    const ts = Date.parse(value);
    if (Number.isNaN(ts)) continue;
    if (latest === null || ts > latest) {
      latest = ts;
      latestRaw = value;
    }
  }
  return latestRaw;
}

export function summarizeAdvancements(
  raw: RawAdvancements,
  recentLimit = 5
): AdvancementsSummary {
  const counts = new Map<AdvancementTree, { done: number; total: number }>();
  for (const tree of TREES) counts.set(tree, { done: 0, total: 0 });

  const completed: Array<{ id: string; tree: AdvancementTree; at: string; ts: number }> =
    [];

  for (const [id, value] of Object.entries(raw)) {
    if (id === 'DataVersion') continue;
    if (id.startsWith('minecraft:recipes/')) continue;
    const tree = treeOf(id);
    if (!tree) continue;

    const adv = value as RawAdvancement;
    const bucket = counts.get(tree)!;
    bucket.total += 1;
    if (adv.done === true) {
      bucket.done += 1;
      const at = latestCriteriaDate(adv);
      if (at) {
        completed.push({ id, tree, at, ts: Date.parse(at) });
      }
    }
  }

  const trees: TreeProgress[] = TREES.map((tree) => {
    const bucket = counts.get(tree)!;
    return { tree, done: bucket.done, total: bucket.total };
  }).filter((t) => t.total > 0);

  const totalDone = trees.reduce((sum, t) => sum + t.done, 0);
  const totalAll = trees.reduce((sum, t) => sum + t.total, 0);

  const recent: RecentAdvancement[] = completed
    .sort((a, b) => b.ts - a.ts)
    .slice(0, recentLimit)
    .map(({ id, tree, at }) => ({ id, name: prettyAdvancementName(id), tree, at }));

  return { trees, totalDone, totalAll, recent };
}

const TICKS_PER_SECOND = 20;
const TICKS_PER_HOUR = TICKS_PER_SECOND * 3600;

export interface StatsSummary {
  playTimeHours: number;
  deaths: number;
  mobKills: number;
  playerKills: number;
  jumps: number;
  damageDealt: number;
  walkDistanceKm: number;
}

interface RawStats {
  stats?: {
    'minecraft:custom'?: Record<string, number>;
  };
}

function num(custom: Record<string, number> | undefined, ...keys: string[]): number {
  if (!custom) return 0;
  for (const key of keys) {
    const value = custom[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return 0;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function summarizeStats(raw: RawStats): StatsSummary {
  const custom = raw.stats?.['minecraft:custom'];

  const playTimeTicks = num(custom, 'minecraft:play_time', 'minecraft:playOneMinute');
  const walkCm = num(custom, 'minecraft:walk_one_cm', 'minecraft:walkOneCm');

  return {
    playTimeHours: round(playTimeTicks / TICKS_PER_HOUR, 2),
    deaths: num(custom, 'minecraft:deaths'),
    mobKills: num(custom, 'minecraft:mob_kills'),
    playerKills: num(custom, 'minecraft:player_kills'),
    jumps: num(custom, 'minecraft:jump'),
    damageDealt: num(custom, 'minecraft:damage_dealt'),
    walkDistanceKm: round(walkCm / 100 / 1000, 3)
  };
}
