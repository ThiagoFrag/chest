const BASE = 'https://api.modrinth.com/v2';
const UA = 'chest-panel/0.1.0 (github.com/forja-mc)';

export interface ModpackHit {
  project_id: string;
  slug: string;
  title: string;
  description: string;
  categories: string[];
  display_categories: string[];
  versions: string[];
  loaders: string[];
  client_side: string;
  server_side: string;
  downloads: number;
  follows: number;
  icon_url: string | null;
  author: string;
  latest_version: string;
  date_modified: string;
}

export interface ModpackSearchResult {
  hits: ModpackHit[];
  offset: number;
  limit: number;
  total_hits: number;
}

export interface SearchOpts {
  query?: string;
  loader?: 'fabric' | 'forge' | 'neoforge' | 'quilt';
  mcVersion?: string;
  category?: string;
  sort?: 'relevance' | 'downloads' | 'follows' | 'newest' | 'updated';
  offset?: number;
  limit?: number;
}

export async function searchModpacks(opts: SearchOpts): Promise<ModpackSearchResult> {
  const facets: string[][] = [['project_type:modpack']];
  if (opts.loader) facets.push([`categories:${opts.loader}`]);
  if (opts.mcVersion) facets.push([`versions:${opts.mcVersion}`]);
  if (opts.category) facets.push([`categories:${opts.category}`]);

  const params = new URLSearchParams({
    query: opts.query?.trim() ?? '',
    facets: JSON.stringify(facets),
    index: opts.sort ?? 'downloads',
    offset: String(opts.offset ?? 0),
    limit: String(Math.min(opts.limit ?? 24, 100))
  });

  const res = await fetch(`${BASE}/search?${params}`, {
    headers: { 'User-Agent': UA }
  });
  if (!res.ok) throw new Error(`Modrinth ${res.status}`);
  return (await res.json()) as ModpackSearchResult;
}

export const MODPACK_CATEGORIES = [
  { id: 'adventure', label: 'Adventure' },
  { id: 'challenging', label: 'Challenging' },
  { id: 'combat', label: 'Combat' },
  { id: 'kitchen-sink', label: 'Kitchen Sink' },
  { id: 'lightweight', label: 'Lightweight' },
  { id: 'magic', label: 'Magic' },
  { id: 'multiplayer', label: 'Multiplayer' },
  { id: 'optimization', label: 'Optimization' },
  { id: 'quests', label: 'Quests' },
  { id: 'technology', label: 'Technology' }
] as const;

export const POPULAR_MC_VERSIONS = [
  '1.21.1',
  '1.21',
  '1.20.4',
  '1.20.1',
  '1.19.4',
  '1.19.2',
  '1.18.2',
  '1.16.5',
  '1.12.2'
];
