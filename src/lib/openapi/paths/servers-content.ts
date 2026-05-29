import type { PathsModule } from '../types';

const nameParam = {
  name: 'name',
  in: 'path' as const,
  required: true,
  description: 'containerName do servidor.',
  schema: { type: 'string' }
};

export const serverscontentPaths: PathsModule = {
  '/api/servers/{name}/files': {
    get: {
      tags: ['Files'],
      summary: 'Lista um diretório ou lê um arquivo de texto',
      description:
        'Com `?mode=list` (padrão) lista as entradas do diretório em `?path`. Com `?mode=read` retorna o conteúdo de um arquivo de texto. Requer a permissão `manage_files` no servidor.',
      operationId: 'browseServerFiles',
      parameters: [
        nameParam,
        {
          name: 'path',
          in: 'query',
          required: false,
          description: 'Caminho do diretório ou arquivo. Padrão "/data".',
          schema: { type: 'string', default: '/data' }
        },
        {
          name: 'mode',
          in: 'query',
          required: false,
          description: 'Operação: "list" lista o diretório, "read" lê um arquivo de texto.',
          schema: { type: 'string', enum: ['list', 'read'], default: 'list' }
        }
      ],
      responses: {
        '200': {
          description: 'Lista de entradas (mode=list) ou conteúdo do arquivo (mode=read).',
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  {
                    type: 'object',
                    required: ['path', 'entries'],
                    properties: {
                      path: { type: 'string' },
                      entries: { type: 'array', items: { type: 'object' } }
                    }
                  },
                  {
                    type: 'object',
                    required: ['content', 'truncated', 'isText'],
                    properties: {
                      content: { type: 'string' },
                      truncated: { type: 'boolean' },
                      isText: { type: 'boolean' }
                    }
                  }
                ]
              }
            }
          }
        },
        '400': {
          description: 'Caminho inválido ou nome ausente.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '401': {
          description: 'Não autenticado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Sem permissão (`manage_files`).',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '415': {
          description: 'Arquivo binário, não pode ser lido como texto.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    },
    put: {
      tags: ['Files'],
      summary: 'Escreve o conteúdo de um arquivo',
      description: 'Grava `content` no arquivo indicado por `path`. Requer a permissão `manage_files` no servidor.',
      operationId: 'writeServerFile',
      parameters: [nameParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['path', 'content'],
              properties: {
                path: { type: 'string', minLength: 1, description: 'Caminho do arquivo a escrever.' },
                content: { type: 'string', description: 'Conteúdo de texto do arquivo.' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Arquivo escrito.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ok'],
                properties: { ok: { type: 'boolean' } }
              }
            }
          }
        },
        '400': {
          description: 'Body inválido.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '401': {
          description: 'Não autenticado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Sem permissão (`manage_files`).',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/servers/{name}/mods': {
    get: {
      tags: ['Mods'],
      summary: 'Lista os mods instalados',
      description: 'Retorna os mods instalados no servidor. Requer a permissão `manage_files` no servidor.',
      operationId: 'listServerMods',
      parameters: [nameParam],
      responses: {
        '200': {
          description: 'Lista de mods.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['mods'],
                properties: { mods: { type: 'array', items: { type: 'object' } } }
              }
            }
          }
        },
        '401': {
          description: 'Não autenticado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Sem permissão (`manage_files`).',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    },
    post: {
      tags: ['Mods'],
      summary: 'Instala um mod do Modrinth',
      description:
        'Instala um mod do Modrinth a partir de `projectId`, escolhendo a versão compatível com a versão e o loader do servidor. Requer a permissão `manage_files` no servidor.',
      operationId: 'installServerMod',
      parameters: [nameParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['projectId'],
              properties: {
                projectId: { type: 'string', minLength: 1, description: 'ID do projeto no Modrinth.' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Mod instalado.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['filename', 'version', 'sizeBytes'],
                properties: {
                  filename: { type: 'string' },
                  version: { type: 'string' },
                  sizeBytes: { type: 'integer' }
                }
              }
            }
          }
        },
        '400': {
          description: 'projectId ausente.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '401': {
          description: 'Não autenticado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Sem permissão (`manage_files`).',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '409': {
          description: 'Nenhuma versão compatível com a versão/loader do servidor.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/servers/{name}/mods/{filename}': {
    delete: {
      tags: ['Mods'],
      summary: 'Remove um mod',
      description: 'Remove o arquivo de mod indicado por `filename`. Requer a permissão `manage_files` no servidor.',
      operationId: 'deleteServerMod',
      parameters: [
        nameParam,
        {
          name: 'filename',
          in: 'path',
          required: true,
          description: 'Nome do arquivo do mod.',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Mod removido.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ok'],
                properties: { ok: { type: 'boolean' } }
              }
            }
          }
        },
        '401': {
          description: 'Não autenticado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Sem permissão (`manage_files`).',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    },
    patch: {
      tags: ['Mods'],
      summary: 'Ativa ou desativa um mod',
      description:
        'Alterna o estado de ativação do mod indicado por `filename` via `enabled`. Requer a permissão `manage_files` no servidor.',
      operationId: 'toggleServerMod',
      parameters: [
        nameParam,
        {
          name: 'filename',
          in: 'path',
          required: true,
          description: 'Nome do arquivo do mod.',
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['enabled'],
              properties: {
                enabled: { type: 'boolean', description: 'Estado de ativação desejado.' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Mod atualizado.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ok'],
                properties: { ok: { type: 'boolean' } }
              }
            }
          }
        },
        '400': {
          description: 'Body inválido.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '401': {
          description: 'Não autenticado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Sem permissão (`manage_files`).',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/servers/{name}/modpack': {
    post: {
      tags: ['Mods'],
      summary: 'Instala um modpack do Modrinth',
      description:
        'Instala um modpack do Modrinth a partir de `projectId`. Requer a permissão `manage_files` no servidor.',
      operationId: 'installServerModpack',
      parameters: [nameParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['projectId'],
              properties: {
                projectId: { type: 'string', minLength: 1, description: 'ID do projeto no Modrinth.' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Modpack instalado.',
          content: {
            'application/json': { schema: { type: 'object' } }
          }
        },
        '400': {
          description: 'projectId ausente.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '401': {
          description: 'Não autenticado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Sem permissão (`manage_files`).',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/servers/{name}/world': {
    get: {
      tags: ['World'],
      summary: 'Detalha o mundo do servidor',
      description: 'Retorna informações do mundo do servidor. Requer a permissão `view_logs` no servidor.',
      operationId: 'getServerWorld',
      parameters: [nameParam],
      responses: {
        '200': {
          description: 'Informações do mundo.',
          content: {
            'application/json': { schema: { type: 'object' } }
          }
        },
        '401': {
          description: 'Não autenticado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Sem permissão (`view_logs`).',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    },
    patch: {
      tags: ['World'],
      summary: 'Define a seed do mundo',
      description: 'Atualiza a seed do mundo do servidor. Requer a permissão `edit_world` no servidor.',
      operationId: 'updateServerWorldSeed',
      parameters: [nameParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['seed'],
              properties: {
                seed: { type: 'string', minLength: 1, maxLength: 32, description: 'Nova seed do mundo.' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Seed atualizada.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ok'],
                properties: { ok: { type: 'boolean' } }
              }
            }
          }
        },
        '400': {
          description: 'Seed inválida ou ausente.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '401': {
          description: 'Não autenticado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Sem permissão (`edit_world`).',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/servers/{name}/world/reset': {
    post: {
      tags: ['World'],
      summary: 'Reseta o mundo do servidor',
      description:
        'Apaga e regenera o mundo do servidor, opcionalmente com `newSeed`, e os mundos Nether/End. Exige `confirm: true`. Requer a permissão `edit_world` no servidor.',
      operationId: 'resetServerWorld',
      parameters: [nameParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['confirm'],
              properties: {
                newSeed: { type: 'string', maxLength: 32, description: 'Seed do novo mundo (opcional).' },
                resetNether: { type: 'boolean', default: true, description: 'Reseta também o Nether.' },
                resetEnd: { type: 'boolean', default: true, description: 'Reseta também o End.' },
                confirm: { type: 'boolean', enum: [true], description: 'Confirmação obrigatória do reset.' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Mundo resetado.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ok'],
                properties: { ok: { type: 'boolean' } }
              }
            }
          }
        },
        '400': {
          description: 'Confirmação ausente ou body inválido.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '401': {
          description: 'Não autenticado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Sem permissão (`edit_world`).',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  }
};
