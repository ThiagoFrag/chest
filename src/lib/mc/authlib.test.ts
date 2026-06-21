import { describe, it, expect } from 'vitest';
import { buildJvmOpts, AUTHLIB_INJECTOR_PATH } from './authlib';

describe('buildJvmOpts', () => {
  it('appends /authlib-injector to URL', () => {
    const opts = buildJvmOpts('https://mc.example.com');
    expect(opts).toBe(
      `-javaagent:${AUTHLIB_INJECTOR_PATH}=https://mc.example.com/authlib-injector`
    );
  });

  it('strips trailing slash from URL', () => {
    const opts = buildJvmOpts('https://mc.example.com/');
    expect(opts).toBe(
      `-javaagent:${AUTHLIB_INJECTOR_PATH}=https://mc.example.com/authlib-injector`
    );
  });

  it('handles URL with path', () => {
    const opts = buildJvmOpts('https://example.com/drasl');
    expect(opts).toContain('drasl/authlib-injector');
  });
});
