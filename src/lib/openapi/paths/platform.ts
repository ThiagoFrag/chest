import type { PathsModule } from '../types';

const errorJson = {
  'application/json': {
    schema: { $ref: '#/components/schemas/Error' }
  }
};

export const platformPaths: PathsModule = {
  '/api/settings': {
    get: {
      tags: ['Settings'],
      summary: 'Lista todas as configurações globais',
      description: 'Retorna o mapa de configurações persistidas do painel. Requer role `admin`.',
      operationId: 'getSettings',
      responses: {
        '200': {
          description: 'Mapa de configurações.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['settings'],
                properties: {
                  settings: {
                    type: 'object',
                    additionalProperties: { type: 'string' },
                    description: 'Pares key/value das configurações salvas.'
                  }
                }
              }
            }
          }
        },
        '401': { description: 'Não autenticado.', content: errorJson },
        '403': { description: 'Sem permissão (requer role admin).', content: errorJson }
      }
    },
    put: {
      tags: ['Settings'],
      summary: 'Grava ou remove uma configuração',
      description:
        'Define o valor de uma chave de configuração conhecida. Enviar `value` vazio remove a chave. Requer role `admin`.',
      operationId: 'setSetting',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['key', 'value'],
              properties: {
                key: {
                  type: 'string',
                  description: 'Chave de configuração. Somente chaves conhecidas são aceitas.',
                  enum: [
                    'drasl.url',
                    'drasl.admin_token',
                    'cloudflare.api_token',
                    'cloudflare.zone_id',
                    'cloudflare.cname_target',
                    'playit.secret_key',
                    'discord.webhook_url',
                    'discord.bot_token',
                    'discord.admin_user_id',
                    'forja.public_base_url',
                    'forja.mc_host_address',
                    'mods.modrinth_user_agent'
                  ]
                },
                value: {
                  type: 'string',
                  description: 'Valor a gravar. String vazia remove a configuração.'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Configuração gravada ou removida.',
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
        '400': { description: 'key/value inválidos.', content: errorJson },
        '401': { description: 'Não autenticado.', content: errorJson },
        '403': { description: 'Sem permissão (requer role admin).', content: errorJson }
      }
    }
  },

  '/api/settings/storage-ping': {
    post: {
      tags: ['Settings'],
      summary: 'Testa a conexão com o storage de backups',
      description:
        'Invalida o cache de storage e executa um ping no driver configurado. Sempre responde 200; o campo `ok` indica sucesso da conexão. Requer role `admin`.',
      operationId: 'pingStorage',
      responses: {
        '200': {
          description: 'Resultado do ping. Em falha, `ok` é false e `message` descreve o erro.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ok'],
                properties: {
                  ok: { type: 'boolean' },
                  driver: { type: 'string', description: 'Driver de storage ativo.' },
                  message: { type: 'string', description: 'Mensagem de erro quando ok=false.' }
                },
                additionalProperties: true
              }
            }
          }
        },
        '401': { description: 'Não autenticado.', content: errorJson },
        '403': { description: 'Sem permissão (requer role admin).', content: errorJson }
      }
    }
  },

  '/api/webhooks': {
    get: {
      tags: ['Webhooks'],
      summary: 'Lista os webhooks cadastrados',
      description:
        'Retorna todos os endpoints de webhook (URLs mascaradas) e a lista de eventos disponíveis. Requer role `admin`.',
      operationId: 'listWebhooks',
      responses: {
        '200': {
          description: 'Lista de webhooks e eventos disponíveis.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['webhooks', 'availableEvents'],
                properties: {
                  webhooks: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        url: { type: 'string', description: 'URL mascarada (apenas protocolo + host).' },
                        enabled: { type: 'boolean' },
                        events: { type: 'array', items: { type: 'string' } },
                        serverId: { type: 'string', nullable: true },
                        last_delivery_status: { type: 'string', nullable: true },
                        consecutive_failures: { type: 'integer' },
                        createdAt: { type: 'string', format: 'date-time' }
                      }
                    }
                  },
                  availableEvents: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        '401': { description: 'Não autenticado.', content: errorJson },
        '403': { description: 'Sem permissão (requer role admin).', content: errorJson }
      }
    },
    post: {
      tags: ['Webhooks'],
      summary: 'Cria um webhook',
      description:
        'Cadastra um novo endpoint de webhook e retorna o segredo HMAC gerado (exibido apenas na criação). Requer role `admin`.',
      operationId: 'createWebhook',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'url'],
              properties: {
                name: { type: 'string', minLength: 1, maxLength: 80 },
                url: { type: 'string', format: 'uri' },
                events: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 1,
                  default: ['*'],
                  description: 'Eventos assinados. Padrão `["*"]` (todos).'
                },
                serverId: {
                  type: 'string',
                  nullable: true,
                  description: 'Restringe o webhook a um servidor específico.'
                }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Webhook criado. O segredo só é retornado neste momento.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id', 'secret'],
                properties: {
                  id: { type: 'string' },
                  secret: { type: 'string', description: 'Segredo HMAC do webhook.' }
                }
              }
            }
          }
        },
        '400': { description: 'Body inválido ou serverId inexistente.', content: errorJson },
        '401': { description: 'Não autenticado.', content: errorJson },
        '403': { description: 'Sem permissão (requer role admin).', content: errorJson }
      }
    }
  },

  '/api/webhooks/{id}': {
    patch: {
      tags: ['Webhooks'],
      summary: 'Atualiza um webhook',
      description:
        'Atualiza campos de um webhook existente. Pelo menos um campo deve ser enviado. Reativar zera o contador de falhas. Requer role `admin`.',
      operationId: 'updateWebhook',
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'ID do webhook.', schema: { type: 'string' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              minProperties: 1,
              properties: {
                name: { type: 'string', minLength: 1, maxLength: 80 },
                url: { type: 'string', format: 'uri' },
                events: { type: 'array', items: { type: 'string' }, minItems: 1 },
                enabled: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Webhook atualizado.',
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
        '400': { description: 'Body inválido ou nenhum campo enviado.', content: errorJson },
        '401': { description: 'Não autenticado.', content: errorJson },
        '403': { description: 'Sem permissão (requer role admin).', content: errorJson },
        '404': { description: 'Webhook não encontrado.', content: errorJson }
      }
    },
    delete: {
      tags: ['Webhooks'],
      summary: 'Remove um webhook',
      description: 'Exclui um endpoint de webhook. Requer role `admin`.',
      operationId: 'deleteWebhook',
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'ID do webhook.', schema: { type: 'string' } }
      ],
      responses: {
        '200': {
          description: 'Webhook removido.',
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
        '400': { description: 'ID ausente.', content: errorJson },
        '401': { description: 'Não autenticado.', content: errorJson },
        '403': { description: 'Sem permissão (requer role admin).', content: errorJson },
        '404': { description: 'Webhook não encontrado.', content: errorJson }
      }
    }
  },

  '/api/webhooks/{id}/test': {
    post: {
      tags: ['Webhooks'],
      summary: 'Dispara uma entrega de teste',
      description:
        'Envia um payload de teste assinado (HMAC) para o endpoint e registra o resultado da entrega. Requer role `admin`.',
      operationId: 'testWebhook',
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'ID do webhook.', schema: { type: 'string' } }
      ],
      responses: {
        '200': {
          description: 'Entrega de teste realizada.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ok', 'status'],
                properties: {
                  ok: { type: 'boolean', description: 'Se o endpoint respondeu 2xx.' },
                  status: { type: 'integer', description: 'HTTP status retornado pelo endpoint.' }
                }
              }
            }
          }
        },
        '400': { description: 'ID ausente.', content: errorJson },
        '401': { description: 'Não autenticado.', content: errorJson },
        '403': { description: 'Sem permissão (requer role admin).', content: errorJson },
        '404': { description: 'Webhook não encontrado.', content: errorJson },
        '502': { description: 'Falha ao entregar o teste (timeout ou erro de rede).', content: errorJson }
      }
    }
  },

  '/api/minecraft/versions': {
    get: {
      tags: ['Platform'],
      summary: 'Lista versões do Minecraft',
      description:
        'Retorna releases e snapshots a partir do manifesto da Mojang (cache de 6h). Requer role `viewer`.',
      operationId: 'listMinecraftVersions',
      responses: {
        '200': {
          description: 'Versões disponíveis.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['release', 'latest', 'snapshot'],
                properties: {
                  release: { type: 'array', items: { type: 'string' } },
                  latest: { type: 'string', description: 'Última release estável.' },
                  snapshot: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Até 20 snapshots mais recentes.'
                  }
                }
              }
            }
          }
        },
        '401': { description: 'Não autenticado.', content: errorJson },
        '403': { description: 'Sem permissão (requer role viewer).', content: errorJson },
        '502': { description: 'Falha ao consultar o manifesto da Mojang.', content: errorJson }
      }
    }
  },

  '/api/modrinth/search': {
    get: {
      tags: ['Platform'],
      summary: 'Busca projetos no Modrinth',
      description:
        'Pesquisa mods/plugins/datapacks no Modrinth. Query com menos de 2 caracteres retorna lista vazia. Requer role `viewer`.',
      operationId: 'searchModrinthProjects',
      parameters: [
        {
          name: 'q',
          in: 'query',
          required: false,
          description: 'Termo de busca (mínimo 2 caracteres para resultados).',
          schema: { type: 'string' }
        },
        {
          name: 'mc',
          in: 'query',
          required: false,
          description: 'Versão do Minecraft para filtrar.',
          schema: { type: 'string' }
        },
        {
          name: 'loader',
          in: 'query',
          required: false,
          description: 'Mod loader. "vanilla" é tratado como sem filtro.',
          schema: { type: 'string' }
        },
        {
          name: 'type',
          in: 'query',
          required: false,
          description: 'Tipo de projeto.',
          schema: { type: 'string', enum: ['mod', 'modpack', 'plugin', 'datapack'] }
        }
      ],
      responses: {
        '200': {
          description: 'Resultado da busca.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['hits', 'total_hits', 'offset', 'limit'],
                properties: {
                  hits: { type: 'array', items: { type: 'object' } },
                  total_hits: { type: 'integer' },
                  offset: { type: 'integer' },
                  limit: { type: 'integer' }
                }
              }
            }
          }
        },
        '401': { description: 'Não autenticado.', content: errorJson },
        '403': { description: 'Sem permissão (requer role viewer).', content: errorJson },
        '502': { description: 'Modrinth indisponível.', content: errorJson }
      }
    }
  },

  '/api/modrinth/modpacks': {
    get: {
      tags: ['Platform'],
      summary: 'Busca modpacks no Modrinth',
      description: 'Pesquisa modpacks no Modrinth com filtros e paginação. Requer role `viewer`.',
      operationId: 'searchModrinthModpacks',
      parameters: [
        { name: 'q', in: 'query', required: false, description: 'Termo de busca.', schema: { type: 'string' } },
        {
          name: 'loader',
          in: 'query',
          required: false,
          description: 'Mod loader do modpack.',
          schema: { type: 'string', enum: ['fabric', 'forge', 'neoforge', 'quilt'] }
        },
        {
          name: 'mc',
          in: 'query',
          required: false,
          description: 'Versão do Minecraft.',
          schema: { type: 'string' }
        },
        {
          name: 'category',
          in: 'query',
          required: false,
          description: 'Categoria do modpack.',
          schema: { type: 'string' }
        },
        {
          name: 'sort',
          in: 'query',
          required: false,
          description: 'Ordenação. Padrão "downloads".',
          schema: {
            type: 'string',
            enum: ['relevance', 'downloads', 'follows', 'newest', 'updated'],
            default: 'downloads'
          }
        },
        {
          name: 'offset',
          in: 'query',
          required: false,
          description: 'Offset de paginação. Padrão 0.',
          schema: { type: 'integer', minimum: 0, default: 0 }
        }
      ],
      responses: {
        '200': {
          description: 'Resultado da busca de modpacks.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['hits'],
                properties: {
                  hits: { type: 'array', items: { type: 'object' } },
                  total_hits: { type: 'integer' },
                  offset: { type: 'integer' },
                  limit: { type: 'integer' }
                },
                additionalProperties: true
              }
            }
          }
        },
        '401': { description: 'Não autenticado.', content: errorJson },
        '403': { description: 'Sem permissão (requer role viewer).', content: errorJson },
        '502': { description: 'Modrinth indisponível.', content: errorJson }
      }
    }
  },

  '/api/discord/status': {
    get: {
      tags: ['Platform'],
      summary: 'Status do bot do Discord',
      description: 'Retorna o estado atual da integração do bot do Discord. Requer role `admin`.',
      operationId: 'getDiscordStatus',
      responses: {
        '200': {
          description: 'Status do bot.',
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true }
            }
          }
        },
        '401': { description: 'Não autenticado.', content: errorJson },
        '403': { description: 'Sem permissão (requer role admin).', content: errorJson }
      }
    }
  },

  '/api/discord/test': {
    post: {
      tags: ['Platform'],
      summary: 'Envia um embed de teste ao Discord',
      description:
        'Dispara uma mensagem de teste para o webhook configurado em `discord.webhook_url`. Requer role `admin`.',
      operationId: 'testDiscordWebhook',
      responses: {
        '200': {
          description: 'Embed de teste enviado.',
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
        '400': { description: 'discord.webhook_url não configurado.', content: errorJson },
        '401': { description: 'Não autenticado.', content: errorJson },
        '403': { description: 'Sem permissão (requer role admin).', content: errorJson },
        '502': { description: 'O webhook respondeu com erro.', content: errorJson }
      }
    }
  },

  '/api/discord/channels/{guildId}': {
    get: {
      tags: ['Platform'],
      summary: 'Lista canais de texto de um servidor Discord',
      description: 'Retorna os canais de texto da guild informada via bot. Requer role `operator`.',
      operationId: 'listDiscordChannels',
      parameters: [
        {
          name: 'guildId',
          in: 'path',
          required: true,
          description: 'ID da guild (servidor) do Discord.',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Lista de canais de texto.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['channels'],
                properties: {
                  channels: { type: 'array', items: { type: 'object' } }
                }
              }
            }
          }
        },
        '400': { description: 'guildId ausente.', content: errorJson },
        '401': { description: 'Não autenticado.', content: errorJson },
        '403': { description: 'Sem permissão (requer role operator).', content: errorJson }
      }
    }
  }
};
