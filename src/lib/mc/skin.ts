import type { AuthMode } from './auth-mode';

export interface ResolveHeadInput {
  mode?: AuthMode;
  uuid?: string | null;
  name: string;
  draslUrl?: string | null;
  size?: number;
  containerName?: string | null;
}

export type HeadSource =
  | { kind: 'url'; url: string }
  | { kind: 'proxy'; url: string }
  | { kind: 'steve' };

const DEFAULT_SIZE = 32;
const MC_HEADS = 'https://mc-heads.net/avatar';

function clampSize(size?: number): number {
  const n = Number(size);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_SIZE;
  return Math.min(512, Math.max(8, Math.round(n)));
}

/**
 * Pure decision function: given auth mode + identity, returns where the panel
 * should fetch the player's 2D head from. No network calls — testable.
 *
 * - mojang/online with uuid: public service by uuid (most accurate).
 * - mojang/online without uuid: public service by name (fallback).
 * - drasl: panel proxy endpoint (no external service dependency).
 * - offline / unresolvable: local steve.
 */
export function resolveHeadSource(input: ResolveHeadInput): HeadSource {
  const size = clampSize(input.size);
  const name = input.name?.trim() ?? '';
  const uuid = input.uuid?.trim() || null;

  if (input.mode === 'drasl') {
    if (input.containerName) {
      const q = new URLSearchParams();
      if (uuid) q.set('uuid', uuid);
      if (name) q.set('name', name);
      q.set('size', String(size));
      return {
        kind: 'proxy',
        url: `/api/servers/${encodeURIComponent(input.containerName)}/players/skin?${q.toString()}`
      };
    }
    return { kind: 'steve' };
  }

  if (input.mode === 'offline') {
    return { kind: 'steve' };
  }

  // mojang / online — or unspecified mode (backward compat: name-only calls).
  if (uuid) {
    return { kind: 'url', url: `${MC_HEADS}/${encodeURIComponent(uuid)}/${size}/nohelm` };
  }
  if (name) {
    return { kind: 'url', url: `${MC_HEADS}/${encodeURIComponent(name)}/${size}/nohelm` };
  }
  return { kind: 'steve' };
}

/**
 * Resolves the raw skin PNG URL from a Drasl (Yggdrasil) instance.
 * Returns null if it can't be resolved. Used server-side by the proxy.
 */
export async function resolveDraslSkinUrl(
  draslUrl: string,
  uuid: string,
  fetchFn: typeof fetch = fetch
): Promise<string | null> {
  const base = draslUrl.replace(/\/$/, '');
  const id = uuid.replace(/-/g, '');
  if (!/^[0-9a-fA-F]{32}$/.test(id)) return null;

  const res = await fetchFn(`${base}/session/minecraft/profile/${id}`);
  if (!res.ok) return null;

  const profile = (await res.json()) as {
    properties?: Array<{ name: string; value: string }>;
  };
  const texturesProp = profile.properties?.find((p) => p.name === 'textures');
  if (!texturesProp) return null;

  let decoded: { textures?: { SKIN?: { url?: string } } };
  try {
    decoded = JSON.parse(Buffer.from(texturesProp.value, 'base64').toString('utf8'));
  } catch {
    return null;
  }
  return decoded.textures?.SKIN?.url ?? null;
}
