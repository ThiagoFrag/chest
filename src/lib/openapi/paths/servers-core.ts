import type { PathsModule } from '../types';

const cookieAuth = [{ cookieAuth: [] as string[] }];

export const serverscorePaths: PathsModule = {
  '/api/servers': {
    post: {
      tags: ['Servers'],
      summary: 'Cria um novo servidor',
      description:
        'Provisiona um novo servidor Minecraft. Requer autenticação por sessão (cookie `forja_session`) e papel `admin`.',
      operationId: 'createServer',
      security: cookieAuth,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['displayName', 'modloaderType', 'mcVersion', 'memoryMb'],
              properties: {
                displayName: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 64,
                  description: 'Nome de exibição do servidor.'
                },
                modloaderType: {
                  type: 'string',
                  enum: [
                    'VANILLA',
                    'PAPER',
                    'FABRIC',
                    'FORGE',
                    'NEOFORGE',
                    'PURPUR',
                    'SPIGOT',
                    'QUILT'
                  ],
                  description: 'Tipo de modloader/distribuição do servidor.'
                },
                mcVersion: {
                  type: 'string',
                  pattern: '^\\d+\\.\\d+(\\.\\d+)?$',
                  description: 'Versão do Minecraft (ex: 1.21.1).'
                },
                loaderVersion: {
                  type: 'string',
                  maxLength: 32,
                  description: 'Versão do loader (opcional).'
                },
                memoryMb: {
                  type: 'integer',
                  minimum: 1024,
                  maximum: 32768,
                  description: 'Memória alocada em MB.'
                },
                maxPlayers: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 500,
                  default: 10,
                  description: 'Número máximo de jogadores.'
                },
                difficulty: {
                  type: 'string',
                  enum: ['peaceful', 'easy', 'normal', 'hard'],
                  default: 'normal',
                  description: 'Dificuldade do jogo.'
                },
                motd: {
                  type: 'string',
                  maxLength: 120,
                  description: 'Mensagem do dia (MOTD).'
                },
                draslEnabled: {
                  type: 'boolean',
                  default: false,
                  description: 'Habilita integração Drasl (auth alternativo).'
                },
                eggSlug: {
                  type: 'string',
                  pattern: '^[a-z0-9][a-z0-9-]{1,40}$',
                  description: 'Slug do egg base para variáveis e JVM opts extras.'
                }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Servidor criado.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['containerName'],
                properties: {
                  containerName: { type: 'string' }
                },
                additionalProperties: true
              }
            }
          }
        },
        '400': {
          description: 'Corpo da requisição inválido ou egg inexistente.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '401': {
          description: 'Não autenticado.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '403': {
          description: 'Sem permissão (papel admin requerido).',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '500': {
          description: 'Falha ao provisionar o servidor.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/servers/{name}': {
    delete: {
      tags: ['Servers'],
      summary: 'Remove um servidor',
      description:
        'Exclui o servidor e seus recursos associados. Requer a permissão `delete` sobre o servidor.',
      operationId: 'deleteServer',
      security: cookieAuth,
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
          description: 'Servidor removido.',
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
          description: 'Slug obrigatório ausente.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '401': {
          description: 'Não autenticado.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '403': {
          description: 'Sem permissão para remover este servidor.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '500': {
          description: 'Falha ao remover o servidor.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/servers/{name}/control': {
    post: {
      tags: ['Servers'],
      summary: 'Controla o estado de um servidor',
      description:
        'Inicia, para ou reinicia o servidor. Requer a permissão `control` sobre o servidor.',
      operationId: 'controlServer',
      security: cookieAuth,
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
              required: ['action'],
              properties: {
                action: {
                  type: 'string',
                  enum: ['start', 'stop', 'restart'],
                  description: 'Ação de controle a ser executada.'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Ação aplicada.',
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
          description: 'Ação inválida ou nome ausente.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '401': {
          description: 'Não autenticado.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '403': {
          description: 'Sem permissão para controlar este servidor.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '409': {
          description: 'Conflito ao executar a ação (ex: já em execução).',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/servers/{name}/rcon': {
    post: {
      tags: ['Servers'],
      summary: 'Envia um comando RCON',
      description:
        'Executa um comando no console do servidor via RCON. Requer a permissão `console` sobre o servidor.',
      operationId: 'sendServerRconCommand',
      security: cookieAuth,
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
              required: ['command'],
              properties: {
                command: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 500,
                  description: 'Comando a executar no console do servidor.'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Comando executado.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['response'],
                properties: { response: { type: 'string' } }
              }
            }
          }
        },
        '400': {
          description: 'Comando inválido ou nome ausente.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '401': {
          description: 'Não autenticado.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '403': {
          description: 'Sem permissão para enviar comandos a este servidor.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '409': {
          description: 'RCON indisponível para este servidor.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/servers/{name}/logs': {
    get: {
      tags: ['Servers'],
      summary: 'Stream de logs em tempo real (SSE)',
      description:
        'Abre um stream Server-Sent Events com as últimas 200 linhas e os logs subsequentes do servidor. Cada evento `data:` carrega um JSON `{ type, line }`. Requer a permissão `view_logs` sobre o servidor.',
      operationId: 'streamServerLogs',
      security: cookieAuth,
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
          description: 'Stream de eventos com as linhas de log do servidor.',
          content: {
            'text/event-stream': {
              schema: { type: 'string' }
            }
          }
        },
        '400': {
          description: 'Nome do servidor ausente.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '401': {
          description: 'Não autenticado.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '403': {
          description: 'Sem permissão para visualizar os logs deste servidor.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '404': {
          description: 'Container não existe.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/servers/{name}/stats': {
    get: {
      tags: ['Servers'],
      summary: 'Stream de estatísticas em tempo real (SSE)',
      description:
        'Abre um stream Server-Sent Events com uso de CPU e memória do container em tempo real. Cada evento `data:` carrega um JSON `{ cpuPercent, memUsedMb, memLimitMb }`. Requer a permissão `view_logs` sobre o servidor.',
      operationId: 'streamServerStats',
      security: cookieAuth,
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
          description: 'Stream de eventos com as estatísticas do container.',
          content: {
            'text/event-stream': {
              schema: { type: 'string' }
            }
          }
        },
        '400': {
          description: 'Nome do servidor ausente.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '401': {
          description: 'Não autenticado.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '403': {
          description: 'Sem permissão para visualizar as estatísticas deste servidor.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '404': {
          description: 'Container não existe.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/servers/{name}/metrics': {
    get: {
      tags: ['Servers'],
      summary: 'Histórico de métricas do servidor',
      description:
        'Retorna a série temporal de métricas (CPU, RAM, jogadores online) coletadas para o servidor dentro da janela `range`. Requer a permissão `view_logs` sobre o servidor.',
      operationId: 'getServerMetrics',
      security: cookieAuth,
      parameters: [
        {
          name: 'name',
          in: 'path',
          required: true,
          description: 'containerName do servidor.',
          schema: { type: 'string' }
        },
        {
          name: 'range',
          in: 'query',
          required: false,
          description: 'Janela de tempo do histórico. Padrão "1h".',
          schema: {
            type: 'string',
            enum: ['1h', '6h', '24h', '7d', '30d'],
            default: '1h'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Pontos de métrica no intervalo solicitado.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['points'],
                properties: {
                  points: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        ts: { type: 'integer', description: 'Timestamp em ms.' },
                        cpu: { type: 'number', description: 'CPU em %.' },
                        ram: { type: 'integer', description: 'RAM usada em MB.' },
                        players: { type: 'integer', description: 'Jogadores online.' }
                      }
                    }
                  },
                  range: { type: 'string' },
                  note: {
                    type: 'string',
                    description: 'Presente quando o servidor não tem histórico.'
                  }
                }
              }
            }
          }
        },
        '400': {
          description: 'Nome do servidor ausente.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '401': {
          description: 'Não autenticado.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '403': {
          description: 'Sem permissão para visualizar as métricas deste servidor.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  }
};
