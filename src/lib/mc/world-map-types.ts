export type MapType = 'bluemap' | 'dynmap' | 'squaremap' | 'pl3xmap';
export type LoaderType =
  | 'VANILLA'
  | 'PAPER'
  | 'FABRIC'
  | 'FORGE'
  | 'NEOFORGE'
  | 'PURPUR'
  | 'SPIGOT'
  | 'QUILT';

export interface MapStatus {
  installed: boolean;
  type: MapType | null;
  hostPort: number | null;
  reachable: boolean;
  detectedFiles: string[];
}

interface BlueMapVariant {
  loaderKey: 'paper' | 'fabric' | 'forge' | 'neoforge' | 'quilt';
  installDir: 'plugins' | 'mods';
}

export const BLUEMAP_PROJECT_ID = 'swbUV3cZ';

export function pickBlueMapVariant(loader: LoaderType): BlueMapVariant | null {
  switch (loader) {
    case 'PAPER':
    case 'PURPUR':
    case 'SPIGOT':
      return { loaderKey: 'paper', installDir: 'plugins' };
    case 'FABRIC':
      return { loaderKey: 'fabric', installDir: 'mods' };
    case 'FORGE':
      return { loaderKey: 'forge', installDir: 'mods' };
    case 'NEOFORGE':
      return { loaderKey: 'neoforge', installDir: 'mods' };
    case 'QUILT':
      return { loaderKey: 'quilt', installDir: 'mods' };
    case 'VANILLA':
    default:
      return null;
  }
}

export function loaderSupportsBlueMap(loader: LoaderType): boolean {
  return pickBlueMapVariant(loader) !== null;
}

export function classifyMapFile(filename: string): MapType | null {
  const lc = filename.toLowerCase();
  if (lc.includes('bluemap')) return 'bluemap';
  if (lc.includes('dynmap')) return 'dynmap';
  if (lc.includes('squaremap')) return 'squaremap';
  if (lc.includes('pl3xmap')) return 'pl3xmap';
  return null;
}

export function formatMapHost(host: string | null): string | null {
  if (!host) return null;
  return host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
}
