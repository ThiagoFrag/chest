const BASE = 'https://api.modrinth.com/v2';
const USER_AGENT = 'forja-panel/0.1.0 (github.com/forja-mc)';

export interface ModrinthProject {
  project_id: string;
  slug: string;
  title: string;
  description: string;
  categories: string[];
  client_side: string;
  server_side: string;
  project_type: string;
  downloads: number;
  icon_url: string | null;
  author: string;
  latest_version?: string;
  versions: string[];
  follows: number;
}

export interface ModrinthSearchResult {
  hits: ModrinthProject[];
  offset: number;
  limit: number;
  total_hits: number;
}

export interface ModrinthVersionFile {
  url: string;
  filename: string;
  primary: boolean;
  size: number;
  hashes: { sha512: string; sha1: string };
}

export interface ModrinthVersion {
  id: string;
  project_id: string;
  name: string;
  version_number: string;
  game_versions: string[];
  loaders: string[];
  files: ModrinthVersionFile[];
  date_published: string;
  downloads: number;
}

interface SearchOpts {
  query: string;
  mcVersion?: string;
  loader?: string;
  projectType?: 'mod' | 'modpack' | 'plugin' | 'datapack';
  limit?: number;
}

export async function searchProjects(opts: SearchOpts): Promise<ModrinthSearchResult> {
  const facets: string[][] = [];
  if (opts.mcVersion) facets.push([`versions:${opts.mcVersion}`]);
  if (opts.loader) facets.push([`categories:${opts.loader.toLowerCase()}`]);
  if (opts.projectType) facets.push([`project_type:${opts.projectType}`]);
  else facets.push(['project_type:mod']);

  const params = new URLSearchParams({
    query: opts.query,
    limit: String(opts.limit ?? 20),
    facets: JSON.stringify(facets)
  });

  const res = await fetch(`${BASE}/search?${params}`, {
    headers: { 'User-Agent': USER_AGENT }
  });
  if (!res.ok) throw new Error(`Modrinth ${res.status}: ${await res.text()}`);
  return (await res.json()) as ModrinthSearchResult;
}

export async function getProject(idOrSlug: string): Promise<ModrinthProject> {
  const res = await fetch(`${BASE}/project/${encodeURIComponent(idOrSlug)}`, {
    headers: { 'User-Agent': USER_AGENT }
  });
  if (!res.ok) throw new Error(`Modrinth ${res.status}`);
  return (await res.json()) as ModrinthProject;
}

export async function getVersions(
  projectIdOrSlug: string,
  opts: { mcVersion?: string; loader?: string } = {}
): Promise<ModrinthVersion[]> {
  const params = new URLSearchParams();
  if (opts.mcVersion) {
    params.set('game_versions', JSON.stringify([opts.mcVersion]));
  }
  if (opts.loader) {
    params.set('loaders', JSON.stringify([opts.loader.toLowerCase()]));
  }

  const qs = params.toString() ? `?${params}` : '';
  const res = await fetch(
    `${BASE}/project/${encodeURIComponent(projectIdOrSlug)}/version${qs}`,
    { headers: { 'User-Agent': USER_AGENT } }
  );
  if (!res.ok) throw new Error(`Modrinth ${res.status}`);
  return (await res.json()) as ModrinthVersion[];
}

export async function downloadFile(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`download falhou ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
