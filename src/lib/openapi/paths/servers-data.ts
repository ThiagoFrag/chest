import type { PathsModule } from '../types';
import { defaultSecurity } from '../components';

export const serversdataPaths: PathsModule = {
  '/api/servers/{name}/backups': {
    get: {
      tags: ['Backups'],
      summary: 'Lista os backups de um servidor',
      description: 'Retorna todos os backups registrados para o servidor. Requer a permissão `manage_backups`.',
      operationId: 'listServerBackups',
      security: defaultSecurity,
      parameters: [
        {
          name: 'name',
          in: 'path',
          required: true,
          description: 'containerName do servidor.',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Lista de backups.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['backups'],
                properties: {
                  backups: { type: 'array', items: { type: 'object' } }
                }
              }
            }
          }
        },
        '401': {
          description: 'Não autenticado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Sem permissão `manage_backups`.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '404': {
          description: 'Servidor não encontrado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    },
    post: {
      tags: ['Backups'],
      summary: 'Cria um backup do servidor',
      description: 'Cria um novo backup. `scope` controla se é só o mundo (`world`) ou completo (`full`). Requer a permissão `manage_backups`.',
      operationId: 'createServerBackup',
      security: defaultSecurity,
      parameters: [
        {
          name: 'name',
          in: 'path',
          required: true,
          description: 'containerName do servidor.',
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                scope: {
                  type: 'string',
                  enum: ['world', 'full'],
                  default: 'world',
                  description: 'Escopo do backup: apenas o mundo ou completo.'
                }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Backup criado.',
          content: {
            'application/json': {
              schema: { type: 'object', description: 'Entrada do backup criado.' }
            }
          }
        },
        '400': {
          description: 'scope inválido.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '401': {
          description: 'Não autenticado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Sem permissão `manage_backups`.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '404': {
          description: 'Servidor não encontrado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/servers/{name}/backups/{id}': {
    get: {
      tags: ['Backups'],
      summary: 'Baixa um backup',
      description: 'Faz o download do arquivo do backup como `application/gzip` (anexo `.tar.gz`). Requer a permissão `manage_backups`.',
      operationId: 'downloadServerBackup',
      security: defaultSecurity,
      parameters: [
        {
          name: 'name',
          in: 'path',
          required: true,
          description: 'containerName do servidor.',
          schema: { type: 'string' }
        },
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Identificador do backup.',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Arquivo do backup.',
          content: {
            'application/gzip': {
              schema: { type: 'string', format: 'binary' }
            }
          }
        },
        '401': {
          description: 'Não autenticado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Sem permissão `manage_backups`.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '404': {
          description: 'Backup não encontrado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    },
    delete: {
      tags: ['Backups'],
      summary: 'Remove um backup',
      description: 'Apaga o backup informado. Requer a permissão `manage_backups`.',
      operationId: 'deleteServerBackup',
      security: defaultSecurity,
      parameters: [
        {
          name: 'name',
          in: 'path',
          required: true,
          description: 'containerName do servidor.',
          schema: { type: 'string' }
        },
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Identificador do backup.',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '204': {
          description: 'Backup removido.'
        },
        '401': {
          description: 'Não autenticado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Sem permissão `manage_backups`.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '404': {
          description: 'Backup não encontrado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/servers/{name}/backups/{id}/restore': {
    post: {
      tags: ['Backups'],
      summary: 'Restaura um backup',
      description: 'Restaura o servidor a partir do backup informado. Requer a permissão `manage_backups`.',
      operationId: 'restoreServerBackup',
      security: defaultSecurity,
      parameters: [
        {
          name: 'name',
          in: 'path',
          required: true,
          description: 'containerName do servidor.',
          schema: { type: 'string' }
        },
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Identificador do backup.',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Backup restaurado.',
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
          description: 'Sem permissão `manage_backups`.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '404': {
          description: 'Backup não encontrado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/servers/{name}/tasks': {
    get: {
      tags: ['Tasks'],
      summary: 'Lista as tarefas agendadas do servidor',
      description: 'Retorna as tarefas agendadas (cron) do servidor, ordenadas por data de criação. Requer a permissão `manage_scheduled`.',
      operationId: 'listServerTasks',
      security: defaultSecurity,
      parameters: [
        {
          name: 'name',
          in: 'path',
          required: true,
          description: 'containerName do servidor.',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Lista de tarefas agendadas.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['tasks'],
                properties: {
                  tasks: { type: 'array', items: { type: 'object' } }
                }
              }
            }
          }
        },
        '401': {
          description: 'Não autenticado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Sem permissão `manage_scheduled`.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '404': {
          description: 'Servidor não encontrado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    },
    post: {
      tags: ['Tasks'],
      summary: 'Cria uma tarefa agendada',
      description: 'Cria uma nova tarefa agendada por expressão cron. `cronExpr` é validada no servidor. Requer a permissão `manage_scheduled`.',
      operationId: 'createServerTask',
      security: defaultSecurity,
      parameters: [
        {
          name: 'name',
          in: 'path',
          required: true,
          description: 'containerName do servidor.',
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['taskType', 'cronExpr'],
              properties: {
                taskType: {
                  type: 'string',
                  enum: ['backup', 'restart', 'command'],
                  description: 'Tipo da tarefa a executar.'
                },
                cronExpr: {
                  type: 'string',
                  minLength: 1,
                  description: 'Expressão cron que define o agendamento.'
                },
                params: {
                  type: 'object',
                  additionalProperties: true,
                  default: {},
                  description: 'Parâmetros específicos da tarefa.'
                },
                enabled: {
                  type: 'boolean',
                  default: true,
                  description: 'Se a tarefa começa habilitada.'
                }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Tarefa criada.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id', 'nextRunAt'],
                properties: {
                  id: { type: 'string' },
                  nextRunAt: { type: 'string', format: 'date-time', description: 'Próxima execução calculada.' }
                }
              }
            }
          }
        },
        '400': {
          description: 'Body inválido ou cron inválido.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '401': {
          description: 'Não autenticado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Sem permissão `manage_scheduled`.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '404': {
          description: 'Servidor não encontrado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/servers/{name}/tasks/{id}': {
    patch: {
      tags: ['Tasks'],
      summary: 'Atualiza uma tarefa agendada',
      description: 'Atualiza campos de uma tarefa agendada. Todos os campos são opcionais; `cronExpr`, quando enviada, é validada. Requer a permissão `manage_scheduled`.',
      operationId: 'updateServerTask',
      security: defaultSecurity,
      parameters: [
        {
          name: 'name',
          in: 'path',
          required: true,
          description: 'containerName do servidor.',
          schema: { type: 'string' }
        },
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Identificador da tarefa.',
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                cronExpr: {
                  type: 'string',
                  minLength: 1,
                  description: 'Nova expressão cron.'
                },
                params: {
                  type: 'object',
                  additionalProperties: true,
                  description: 'Novos parâmetros da tarefa.'
                },
                enabled: {
                  type: 'boolean',
                  description: 'Habilita ou desabilita a tarefa.'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Tarefa atualizada.',
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
          description: 'Body inválido ou cron inválido.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '401': {
          description: 'Não autenticado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Sem permissão `manage_scheduled`.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '404': {
          description: 'Tarefa não encontrada.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    },
    delete: {
      tags: ['Tasks'],
      summary: 'Remove uma tarefa agendada',
      description: 'Apaga a tarefa agendada informada. Requer a permissão `manage_scheduled`.',
      operationId: 'deleteServerTask',
      security: defaultSecurity,
      parameters: [
        {
          name: 'name',
          in: 'path',
          required: true,
          description: 'containerName do servidor.',
          schema: { type: 'string' }
        },
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Identificador da tarefa.',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '204': {
          description: 'Tarefa removida.'
        },
        '401': {
          description: 'Não autenticado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Sem permissão `manage_scheduled`.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '404': {
          description: 'Tarefa não encontrada.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/servers/{name}/players/skin': {
    get: {
      tags: ['Players'],
      summary: 'Proxy da cabeça/skin do jogador (resolvida via Drasl)',
      description:
        'Resolve a skin do jogador pelo próprio Drasl (protocolo Yggdrasil) e devolve o PNG da skin inteira (`image/png`), para que o painel não dependa de serviço externo no modo drasl. O cliente recorta a face (8x8 em x=8,y=8) e compõe o overlay (x=40,y=8) num `<canvas>`. Requer a permissão `view_logs` sobre o servidor.',
      operationId: 'getServerPlayerSkin',
      security: defaultSecurity,
      parameters: [
        {
          name: 'name',
          in: 'path',
          required: true,
          description: 'containerName do servidor.',
          schema: { type: 'string' }
        },
        {
          name: 'uuid',
          in: 'query',
          required: true,
          description: 'UUID do jogador (com ou sem hifens).',
          schema: { type: 'string' }
        },
        {
          name: 'name',
          in: 'query',
          required: false,
          description: 'Nome do jogador (usado apenas como rótulo/fallback).',
          schema: { type: 'string' }
        },
        {
          name: 'size',
          in: 'query',
          required: false,
          description: 'Tamanho desejado da renderização da cabeça no cliente.',
          schema: { type: 'integer' }
        }
      ],
      responses: {
        '200': {
          description: 'PNG da skin do jogador.',
          content: { 'image/png': { schema: { type: 'string', format: 'binary' } } }
        },
        '400': {
          description: 'uuid ausente.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '401': {
          description: 'Não autenticado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Sem permissão `view_logs`.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '404': {
          description: 'Skin indisponível (o cliente cai para o steve local).',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/servers/{name}/players/profile': {
    get: {
      tags: ['Players'],
      summary: 'Conquistas e estatísticas de um jogador',
      description:
        'Retorna o progresso de conquistas agrupado por árvore (story, nether, end, adventure, husbandry) e estatísticas resumidas de um jogador, lidos dos arquivos `advancements/<uuid>.json` e `stats/<uuid>.json` do mundo. Requer a permissão `view_logs` sobre o servidor.',
      operationId: 'getServerPlayerProfile',
      security: defaultSecurity,
      parameters: [
        {
          name: 'name',
          in: 'path',
          required: true,
          description: 'containerName do servidor.',
          schema: { type: 'string' }
        },
        {
          name: 'uuid',
          in: 'query',
          required: true,
          description: 'UUID canônico (com hifens) do jogador.',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Conquistas agrupadas por árvore e estatísticas resumidas.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['advancements', 'stats', 'hasData'],
                properties: {
                  advancements: {
                    type: 'object',
                    properties: {
                      trees: { type: 'array', items: { type: 'object' } },
                      totalDone: { type: 'integer' },
                      totalAll: { type: 'integer' },
                      recent: { type: 'array', items: { type: 'object' } }
                    }
                  },
                  stats: { type: 'object' },
                  hasData: { type: 'boolean' }
                }
              }
            }
          }
        },
        '400': {
          description: 'uuid ausente ou inválido.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '401': {
          description: 'Não autenticado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Sem permissão `view_logs`.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '404': {
          description: 'Servidor não encontrado.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  }
};
