import type { PathItem, PathsModule } from '../types';
import { examplePaths } from './_example';
import { authaccountPaths } from './auth-account';
import { serverscorePaths } from './servers-core';
import { serverscontentPaths } from './servers-content';
import { serversdataPaths } from './servers-data';
import { serversconfigPaths } from './servers-config';
import { platformPaths } from './platform';

const modules: PathsModule[] = [
  examplePaths,
  authaccountPaths,
  serverscorePaths,
  serverscontentPaths,
  serversdataPaths,
  serversconfigPaths,
  platformPaths
];

// Spread perde métodos quando dois módulos declaram o mesmo path string.
// Faz merge por path: combina get/post/put/patch/delete do mesmo PathItem.
function mergePaths(targets: PathsModule[]): PathsModule {
  const out: PathsModule = {};
  for (const mod of targets) {
    for (const [path, item] of Object.entries(mod)) {
      const existing = out[path];
      out[path] = existing ? mergePathItem(existing, item, path) : item;
    }
  }
  return out;
}

function mergePathItem(a: PathItem, b: PathItem, path: string): PathItem {
  const merged: PathItem = { ...a };
  for (const [method, op] of Object.entries(b) as [
    keyof PathItem,
    PathItem[keyof PathItem]
  ][]) {
    if (merged[method] !== undefined) {
      throw new Error(
        `Colisão de método "${String(method)}" no path "${path}" entre módulos de OpenAPI`
      );
    }
    merged[method] = op as never;
  }
  return merged;
}

export const allPaths: PathsModule = mergePaths(modules);
