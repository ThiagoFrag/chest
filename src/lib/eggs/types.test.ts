import { describe, it, expect } from 'vitest';
import { eggSchema, toSummary } from './types';

const baseEgg = {
  slug: 'test-egg',
  name: 'Test Egg',
  loader: 'VANILLA',
  mcVersion: '1.21.1'
};

describe('eggSchema', () => {
  it('parses minimal valid egg with defaults', () => {
    const out = eggSchema.parse(baseEgg);
    expect(out.slug).toBe('test-egg');
    expect(out.category).toBe('other');
    expect(out.author).toBe('Chest');
    expect(out.defaults.memoryGb).toBe(4);
    expect(out.defaults.maxPlayers).toBe(10);
    expect(out.defaults.difficulty).toBe('normal');
    expect(out.tags).toEqual([]);
    expect(out.envExtras).toEqual({});
  });

  it('rejects invalid slug formats', () => {
    expect(() => eggSchema.parse({ ...baseEgg, slug: 'BAD_Slug' })).toThrow();
    expect(() => eggSchema.parse({ ...baseEgg, slug: 'with spaces' })).toThrow();
    expect(() => eggSchema.parse({ ...baseEgg, slug: 'has.dot' })).toThrow();
    expect(() => eggSchema.parse({ ...baseEgg, slug: '-leading' })).toThrow();
  });

  it('accepts kebab-case slugs', () => {
    expect(() => eggSchema.parse({ ...baseEgg, slug: 'my-egg-123' })).not.toThrow();
  });

  it('rejects invalid loader', () => {
    expect(() => eggSchema.parse({ ...baseEgg, loader: 'BUKKIT' })).toThrow();
  });

  it('clamps memoryGb to valid range', () => {
    expect(() => eggSchema.parse({ ...baseEgg, defaults: { memoryGb: 0 } })).toThrow();
    expect(() => eggSchema.parse({ ...baseEgg, defaults: { memoryGb: 999 } })).toThrow();
    expect(eggSchema.parse({ ...baseEgg, defaults: { memoryGb: 16 } }).defaults.memoryGb).toBe(16);
  });

  it('accepts icon as URL or absolute path', () => {
    expect(() => eggSchema.parse({ ...baseEgg, icon: 'https://example.com/x.png' })).not.toThrow();
    expect(() => eggSchema.parse({ ...baseEgg, icon: '/textures/x.png' })).not.toThrow();
    expect(() => eggSchema.parse({ ...baseEgg, icon: 'relative/path.png' })).toThrow();
  });

  it('preserves envExtras and modrinthProjectId', () => {
    const out = eggSchema.parse({
      ...baseEgg,
      envExtras: { LEVEL_TYPE: 'flat' },
      modrinthProjectId: 'abc123'
    });
    expect(out.envExtras.LEVEL_TYPE).toBe('flat');
    expect(out.modrinthProjectId).toBe('abc123');
  });
});

describe('toSummary', () => {
  it('returns a subset for listing', () => {
    const full = eggSchema.parse({
      ...baseEgg,
      envExtras: { secret: 'do-not-leak' },
      modrinthProjectId: 'X',
      postCreate: { notes: 'private' }
    });
    const summary = toSummary(full);
    expect(summary.slug).toBe('test-egg');
    expect((summary as unknown as { envExtras?: unknown }).envExtras).toBeUndefined();
    expect((summary as unknown as { postCreate?: unknown }).postCreate).toBeUndefined();
  });
});
