import type { Components, Parameter, SecurityRequirement, Tag } from './types';

export const COOKIE_NAME = 'forja_session';

export const securitySchemes: NonNullable<Components['securitySchemes']> = {
  cookieAuth: {
    type: 'apiKey',
    in: 'cookie',
    name: COOKIE_NAME,
    description: 'Cookie de sessão emitido após login. Httponly, sameSite lax.'
  }
};

export const defaultSecurity: SecurityRequirement[] = [{ cookieAuth: [] }];

export const schemas: NonNullable<Components['schemas']> = {
  Error: {
    type: 'object',
    required: ['message'],
    properties: {
      message: { type: 'string', description: 'Mensagem de erro legível.' }
    }
  }
};

export const tags: Tag[] = [
  { name: 'Auth', description: 'Login, sessão e 2FA (TOTP).' },
  { name: 'Servers', description: 'CRUD e controle de servidores Minecraft.' },
  { name: 'Files', description: 'Navegação e edição de arquivos do container.' },
  { name: 'Mods', description: 'Gerenciamento de mods e modpacks.' },
  { name: 'Backups', description: 'Criação e restauração de backups.' },
  { name: 'Tasks', description: 'Tarefas agendadas por servidor.' },
  { name: 'World', description: 'Operações de mundo (reset, info).' },
  { name: 'Config', description: 'server.properties e configuração de jogo.' },
  { name: 'Webhooks', description: 'Webhooks de eventos.' },
  { name: 'Settings', description: 'Configurações globais do painel.' },
  { name: 'Users', description: 'Gerenciamento de usuários.' },
  { name: 'Invites', description: 'Convites de acesso.' },
  { name: 'Platform', description: 'Integrações externas (Modrinth, Discord, versões).' }
];

export const parameters: Record<string, Parameter> = {
  serverName: {
    name: 'name',
    in: 'path',
    required: true,
    description: 'containerName do servidor.',
    schema: { type: 'string' }
  },
  id: {
    name: 'id',
    in: 'path',
    required: true,
    description: 'Identificador do recurso.',
    schema: { type: 'string' }
  }
};

export const components: Components = {
  securitySchemes,
  schemas,
  parameters
};
