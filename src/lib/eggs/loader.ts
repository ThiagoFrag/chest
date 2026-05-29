import { readdir, readFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { eggSchema, type Egg } from './types';

const EGG_DIR = process.env.CHEST_EGG_DIR ?? defaultEggDir();

function defaultEggDir(): string {
  try {
    return resolve(dirname(fileURLToPath(import.meta.url)), '../../../eggs');
  } catch {
    return resolve(process.cwd(), 'eggs');
  }
}

let cache: { loadedAt: number; eggs: Egg[] } | null = null;
const CACHE_TTL_MS = 30_000;

export async function loadAllEggs(force = false): Promise<Egg[]> {
  if (!force && cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) {
    return cache.eggs;
  }

  let files: string[];
  try {
    files = (await readdir(EGG_DIR)).filter((f) => f.endsWith('.json'));
  } catch {
    cache = { loadedAt: Date.now(), eggs: [] };
    return [];
  }

  const eggs: Egg[] = [];
  for (const file of files) {
    try {
      const raw = await readFile(join(EGG_DIR, file), 'utf8');
      const parsed = JSON.parse(raw);
      const egg = eggSchema.parse(parsed);
      eggs.push(egg);
    } catch (err) {
      console.warn(`[eggs] skipped ${file}:`, err instanceof Error ? err.message : err);
    }
  }

  eggs.sort((a, b) => a.name.localeCompare(b.name));
  cache = { loadedAt: Date.now(), eggs };
  return eggs;
}

export async function getEgg(slug: string): Promise<Egg | null> {
  const all = await loadAllEggs();
  return all.find((e) => e.slug === slug) ?? null;
}

export function clearEggCache(): void {
  cache = null;
}
