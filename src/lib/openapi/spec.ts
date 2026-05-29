import type { OpenAPIDocument } from './types';
import { components, defaultSecurity, tags } from './components';
import { allPaths } from './paths';

export function buildSpec(): OpenAPIDocument {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Chest API',
      version: '0.1.0',
      description: 'API REST do painel Chest para gerenciamento de servidores Minecraft.'
    },
    servers: [{ url: '/' }],
    security: defaultSecurity,
    tags,
    components,
    paths: allPaths
  };
}
