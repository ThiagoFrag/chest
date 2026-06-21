import { describe, it, expect } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name === '+server.ts') out.push(p);
  }
  return out;
}

describe('API routes auth coverage', () => {
  it('every +server.ts in /api/ has at least one auth check', async () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const apiDir = join(here, '..', '..', 'routes', 'api');
    const files = await walk(apiDir);
    expect(files.length).toBeGreaterThan(0);

    const ALLOWED_UNAUTH = ['auth/totp/verify'];
    const missing: string[] = [];
    for (const file of files) {
      const rel = file.replace(apiDir + '/', '');
      if (ALLOWED_UNAUTH.some((a) => rel.includes(a))) continue;
      const src = await readFile(file, 'utf8');
      const hasRequireRole = /requireRole\s*\(/.test(src);
      const hasLocalsUser = /locals\.user/.test(src);
      const hasRequireServerPermission = /requireServerPermission\s*\(/.test(src);
      if (!hasRequireRole && !hasLocalsUser && !hasRequireServerPermission) {
        missing.push(rel);
      }
    }
    expect(missing, 'routes without auth: ' + missing.join(', ')).toEqual([]);
  });
});
