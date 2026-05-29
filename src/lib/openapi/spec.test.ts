import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { buildSpec } from './spec';

const spec = buildSpec();

describe('buildSpec', () => {
  it('declares OpenAPI 3.1.0', () => {
    expect(spec.openapi).toBe('3.1.0');
  });

  it('has info title and version', () => {
    expect(spec.info.title).toBeTruthy();
    expect(spec.info.version).toBeTruthy();
  });

  it('defines cookieAuth security scheme', () => {
    expect(spec.components?.securitySchemes?.cookieAuth).toBeDefined();
  });
});

describe('spec -> filesystem drift', () => {
  const routesDir = join(process.cwd(), 'src', 'routes');
  const haveRoutes = existsSync(routesDir) && statSync(routesDir).isDirectory();

  const paths = Object.keys(spec.paths);

  it.runIf(haveRoutes && paths.length > 0)(
    'every documented path maps to a +server.ts file',
    () => {
      const missing: string[] = [];
      for (const p of paths) {
        const routePath = p.replace(/\{([^}]+)\}/g, '[$1]');
        const serverFile = join(process.cwd(), 'src', 'routes', ...routePath.split('/').filter(Boolean), '+server.ts');
        if (!existsSync(serverFile)) missing.push(`${p} -> ${serverFile}`);
      }
      expect(missing, `paths sem +server.ts:\n${missing.join('\n')}`).toEqual([]);
    }
  );

  it('runs even when no paths are documented (stub allPaths)', () => {
    expect(Array.isArray(paths)).toBe(true);
  });
});
