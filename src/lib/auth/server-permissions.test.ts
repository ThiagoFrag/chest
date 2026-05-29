import { describe, it, expect } from 'vitest';
import {
  parsePermissions,
  serializePermissions,
  SERVER_PERMISSIONS,
  ROLE_DEFAULTS
} from './permissions-constants';

describe('parsePermissions', () => {
  it('parses valid JSON array of permissions', () => {
    expect(parsePermissions('["control","console"]')).toEqual(['control', 'console']);
  });

  it('returns empty for null/empty', () => {
    expect(parsePermissions(null)).toEqual([]);
    expect(parsePermissions('')).toEqual([]);
  });

  it('returns empty for invalid JSON', () => {
    expect(parsePermissions('not json')).toEqual([]);
    expect(parsePermissions('{}')).toEqual([]);
  });

  it('filters out unknown permissions', () => {
    expect(parsePermissions('["control","made_up_perm","console"]')).toEqual([
      'control',
      'console'
    ]);
  });
});

describe('serializePermissions', () => {
  it('serializes deterministically and dedupes', () => {
    const json = serializePermissions(['control', 'console', 'control']);
    expect(JSON.parse(json)).toEqual(['control', 'console']);
  });

  it('drops unknown perms', () => {
    const json = serializePermissions(['control', 'bogus' as never]);
    expect(JSON.parse(json)).toEqual(['control']);
  });

  it('round-trips through parse', () => {
    const perms = ['control', 'console', 'manage_files'] as const;
    expect(parsePermissions(serializePermissions([...perms]))).toEqual([...perms]);
  });
});

describe('ROLE_DEFAULTS', () => {
  it('admin has all permissions', () => {
    expect(ROLE_DEFAULTS.admin.length).toBe(SERVER_PERMISSIONS.length);
  });

  it('operator does not include delete', () => {
    expect(ROLE_DEFAULTS.operator).not.toContain('delete');
  });

  it('viewer only has view_logs', () => {
    expect(ROLE_DEFAULTS.viewer).toEqual(['view_logs']);
  });
});
