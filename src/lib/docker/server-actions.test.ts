import { describe, it, expect } from 'vitest';
import { isSidecar } from './labels';

// Regression: BlueMap sidecars carry forja.managed=true (so workers manage
// them) but are NOT Minecraft servers and have no `servers` table row. They
// must be excluded from the server list and never resolve as a server —
// otherwise the detail page opens a "server" that every server-scoped query
// reports as "não encontrado".
describe('isSidecar', () => {
  it('flags a BlueMap sidecar container', () => {
    expect(
      isSidecar({ Labels: { 'forja.managed': 'true', 'forja.bluemap': 'true' } })
    ).toBe(true);
  });

  it('does not flag a real managed server', () => {
    expect(isSidecar({ Labels: { 'forja.managed': 'true' } })).toBe(false);
  });

  it('does not flag containers without labels', () => {
    expect(isSidecar({ Labels: {} })).toBe(false);
    expect(isSidecar({ Labels: null as unknown as Record<string, string> })).toBe(false);
  });
});
