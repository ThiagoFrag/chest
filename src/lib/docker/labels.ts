/**
 * Pure container-label helpers. Kept dependency-free (no db / dockerode) so
 * tests can import them without pulling bun:sqlite through the module graph.
 */

export const MANAGED_LABEL = 'forja.managed';
export const DISPLAY_LABEL = 'forja.display';
export const SIDECAR_LABEL = 'forja.bluemap';

/**
 * BlueMap sidecars are tagged forja.managed=true (so background workers manage
 * them) but are NOT Minecraft servers and have no `servers` table row. They
 * must never appear in the server list nor resolve as a server.
 */
export function isSidecar(c: { Labels?: Record<string, string> | null }): boolean {
  return c.Labels?.[SIDECAR_LABEL] === 'true';
}
