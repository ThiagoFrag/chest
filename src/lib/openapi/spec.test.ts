import { describe, it, expect } from 'vitest';
import { existsSync, statSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { buildSpec } from './spec';

const spec = buildSpec();

// Routes that intentionally have no OpenAPI entry (the spec endpoint itself).
const UNDOCUMENTED_ALLOWLIST = new Set(['/api/openapi.json']);

// Walk src/routes/api for every +server.ts and return its OpenAPI-style path.
// Both a normal param [name] and a rest param [...path] map to {name}/{path}
// (OpenAPI 3.1 has no catch-all syntax, so a rest param is documented as {path}).
function listRoutePaths(apiRoot: string): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === '+server.ts') {
        const rel = relative(apiRoot, dir).split(sep).filter(Boolean);
        const path =
          '/api' +
          (rel.length
            ? '/' +
              rel
                .map((seg) =>
                  seg.replace(/^\[\.\.\.(.+)\]$/, '{$1}').replace(/^\[(.+)\]$/, '{$1}')
                )
                .join('/')
            : '');
        out.push(path);
      }
    }
  };
  walk(apiRoot);
  return out;
}

// A documented {param} segment can resolve to either [param] or [...param] on
// disk. Return true if any candidate +server.ts exists.
function specPathHasRoute(apiPath: string): boolean {
  const segments = apiPath.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const expand = (i: number, acc: string[]): string[][] => {
    if (i === segments.length) return [acc];
    const seg = segments[i];
    const m = seg.match(/^\{(.+)\}$/);
    const variants = m ? [`[${m[1]}]`, `[...${m[1]}]`] : [seg];
    return variants.flatMap((v) => expand(i + 1, [...acc, v]));
  };
  const apiRoot = join(process.cwd(), 'src', 'routes', 'api');
  return expand(0, []).some((parts) => existsSync(join(apiRoot, ...parts, '+server.ts')));
}

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

describe('drift: spec <-> filesystem', () => {
  const apiRoot = join(process.cwd(), 'src', 'routes', 'api');
  const haveApi = existsSync(apiRoot) && statSync(apiRoot).isDirectory();
  const documented = Object.keys(spec.paths);

  it.runIf(haveApi && documented.length > 0)(
    'every documented path maps to a real +server.ts',
    () => {
      const missing = documented.filter((p) => !specPathHasRoute(p));
      expect(missing, `paths sem +server.ts:\n${missing.join('\n')}`).toEqual([]);
    }
  );

  it.runIf(haveApi)('every +server.ts under /api is documented in the spec', () => {
    const documentedSet = new Set(documented);
    const routes = listRoutePaths(apiRoot).filter((r) => !UNDOCUMENTED_ALLOWLIST.has(r));
    const missing = routes.filter((r) => !documentedSet.has(r));
    expect(missing, `rotas sem doc OpenAPI:\n${missing.join('\n')}`).toEqual([]);
  });

  it('always runs (sanity)', () => {
    expect(Array.isArray(documented)).toBe(true);
  });
});
