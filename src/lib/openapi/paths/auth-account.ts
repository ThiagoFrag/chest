import type { PathsModule } from '../types';

const errorResponse = {
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' }
    }
  }
} as const;

const userSchema = {
  type: 'object',
  required: ['id', 'username', 'role'],
  properties: {
    id: { type: 'string', description: 'Id do usuário.' },
    username: { type: 'string', description: 'Nome de usuário (login).' },
    role: {
      type: 'string',
      enum: ['admin', 'operator', 'viewer'],
      description: 'Papel do usuário.'
    },
    createdAt: { type: 'string', format: 'date-time', description: 'Data de criação.' },
    lastLoginAt: {
      type: 'string',
      format: 'date-time',
      nullable: true,
      description: 'Último login.'
    }
  }
} as const;

const inviteSchema = {
  type: 'object',
  required: ['id', 'token', 'role', 'expiresAt', 'createdAt'],
  properties: {
    id: { type: 'string', description: 'Id do convite.' },
    token: { type: 'string', description: 'Token do convite.' },
    role: {
      type: 'string',
      enum: ['admin', 'operator', 'viewer'],
      description: 'Papel atribuído ao aceitar.'
    },
    note: { type: 'string', nullable: true, description: 'Nota livre sobre o convite.' },
    createdBy: { type: 'string', description: 'Id do usuário que criou o convite.' },
    expiresAt: { type: 'string', format: 'date-time', description: 'Data de expiração.' },
    createdAt: { type: 'string', format: 'date-time', description: 'Data de criação.' }
  }
} as const;

export const authaccountPaths: PathsModule = {
  '/api/auth/totp': {
    get: {
      tags: ['Auth'],
      summary: 'Consulta o status do TOTP do usuário autenticado',
      description:
        'Retorna se o two-factor (TOTP) está ativo para o usuário da sessão atual.',
      operationId: 'getTotpStatus',
      responses: {
        '200': {
          description: 'Status do TOTP.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['enabled'],
                properties: {
                  enabled: {
                    type: 'boolean',
                    description: 'Indica se o TOTP está ativo.'
                  },
                  enabledAt: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true,
                    description: 'Quando o TOTP foi ativado, ou null.'
                  }
                }
              }
            }
          }
        },
        '401': {
          description: 'Não autenticado.',
          ...errorResponse
        }
      }
    },
    post: {
      tags: ['Auth'],
      summary: 'Inicia o setup do TOTP',
      description:
        'Gera um novo segredo TOTP, persiste no usuário da sessão e retorna o QR Code (data URL) e a URI otpauth para configuração no app autenticador. Falha com 409 se o 2FA já estiver ativo.',
      operationId: 'startTotpSetup',
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: { type: 'object', additionalProperties: false }
          }
        }
      },
      responses: {
        '200': {
          description: 'Segredo e dados de configuração gerados.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['secret', 'otpAuthUrl', 'qrDataUrl'],
                properties: {
                  secret: { type: 'string', description: 'Segredo TOTP em base32.' },
                  otpAuthUrl: {
                    type: 'string',
                    description: 'URI otpauth:// para importar no app.'
                  },
                  qrDataUrl: {
                    type: 'string',
                    description: 'QR Code em data URL (image/png).'
                  }
                }
              }
            }
          }
        },
        '400': {
          description: 'Body inválido.',
          ...errorResponse
        },
        '401': {
          description: 'Não autenticado.',
          ...errorResponse
        },
        '409': {
          description: '2FA já está ativo. Desative primeiro pra gerar novo secret.',
          ...errorResponse
        }
      }
    },
    put: {
      tags: ['Auth'],
      summary: 'Ativa o TOTP',
      description:
        'Valida o código contra o segredo iniciado no setup, ativa o TOTP do usuário da sessão e retorna os backup codes gerados. Falha com 409 se já estiver ativo.',
      operationId: 'activateTotp',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code'],
              properties: {
                code: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 8,
                  description: 'Código TOTP do app autenticador.'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'TOTP ativado.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ok', 'backupCodes'],
                properties: {
                  ok: { type: 'boolean' },
                  backupCodes: {
                    type: 'array',
                    items: { type: 'string' },
                    description:
                      'Códigos de recuperação gerados (mostrados uma única vez).'
                  }
                }
              }
            }
          }
        },
        '400': {
          description: 'Código inválido, body inválido ou setup não iniciado.',
          ...errorResponse
        },
        '401': {
          description: 'Não autenticado.',
          ...errorResponse
        },
        '409': {
          description: '2FA já ativo.',
          ...errorResponse
        }
      }
    },
    delete: {
      tags: ['Auth'],
      summary: 'Desativa o TOTP',
      description:
        'Valida o código atual pra confirmar identidade, remove o segredo e desativa o TOTP do usuário da sessão.',
      operationId: 'disableTotp',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code'],
              properties: {
                code: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 8,
                  description: 'Código TOTP atual, pra confirmar a desativação.'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'TOTP desativado.',
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
          description: 'Código inválido, body inválido ou 2FA não configurado.',
          ...errorResponse
        },
        '401': {
          description: 'Não autenticado.',
          ...errorResponse
        }
      }
    }
  },
  '/api/auth/totp/verify': {
    post: {
      tags: ['Auth'],
      summary: 'Valida um código TOTP da sessão',
      description:
        'Valida o código (TOTP ou backup code) contra o segredo do usuário e marca a sessão atual (cookie `forja_session`) como aprovada no 2FA.',
      operationId: 'verifyTotp',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code'],
              properties: {
                code: {
                  type: 'string',
                  minLength: 6,
                  maxLength: 15,
                  description: 'Código TOTP de 6 dígitos ou um backup code.'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Código válido, sessão marcada como verificada.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ok', 'usedBackup'],
                properties: {
                  ok: { type: 'boolean' },
                  usedBackup: {
                    type: 'boolean',
                    description: 'Indica se um backup code foi consumido em vez do TOTP.'
                  }
                }
              }
            }
          }
        },
        '400': {
          description: 'Body inválido ou 2FA não está ativo.',
          ...errorResponse
        },
        '401': {
          description: 'Não autenticado ou código inválido.',
          ...errorResponse
        }
      }
    }
  },
  '/api/users': {
    get: {
      tags: ['Users'],
      summary: 'Lista os usuários',
      description:
        'Retorna todos os usuários. Requer o papel `admin` (`requireRole(admin)`).',
      operationId: 'listUsers',
      responses: {
        '200': {
          description: 'Lista de usuários.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['users'],
                properties: {
                  users: {
                    type: 'array',
                    items: userSchema
                  }
                }
              }
            }
          }
        },
        '401': {
          description: 'Não autenticado.',
          ...errorResponse
        },
        '403': {
          description: 'Sem permissão (papel `admin` requerido).',
          ...errorResponse
        }
      }
    }
  },
  '/api/users/{id}': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Id do usuário.',
        schema: { type: 'string' }
      }
    ],
    patch: {
      tags: ['Users'],
      summary: 'Altera o papel de um usuário',
      description:
        'Atualiza o papel (role) de um usuário. Requer o papel `admin` (`requireRole(admin)`). Não permite alterar a própria role.',
      operationId: 'updateUserRole',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['role'],
              properties: {
                role: {
                  type: 'string',
                  enum: ['admin', 'operator', 'viewer'],
                  description: 'Novo papel do usuário.'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Papel atualizado.',
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
          description:
            'Body inválido, id ausente ou tentativa de alterar a própria role.',
          ...errorResponse
        },
        '401': {
          description: 'Não autenticado.',
          ...errorResponse
        },
        '403': {
          description: 'Sem permissão (papel `admin` requerido).',
          ...errorResponse
        }
      }
    },
    delete: {
      tags: ['Users'],
      summary: 'Remove um usuário',
      description:
        'Remove um usuário e encerra suas sessões. Requer o papel `admin` (`requireRole(admin)`). Não permite remover a si mesmo.',
      operationId: 'deleteUser',
      responses: {
        '204': {
          description: 'Usuário removido (sem conteúdo).'
        },
        '400': {
          description: 'Id ausente ou tentativa de remover a si mesmo.',
          ...errorResponse
        },
        '401': {
          description: 'Não autenticado.',
          ...errorResponse
        },
        '403': {
          description: 'Sem permissão (papel `admin` requerido).',
          ...errorResponse
        }
      }
    }
  },
  '/api/invites': {
    get: {
      tags: ['Invites'],
      summary: 'Lista os convites',
      description:
        'Retorna todos os convites ordenados por data de criação (desc). Requer o papel `admin` (`requireRole(admin)`).',
      operationId: 'listInvites',
      responses: {
        '200': {
          description: 'Lista de convites.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['invites'],
                properties: {
                  invites: {
                    type: 'array',
                    items: inviteSchema
                  }
                }
              }
            }
          }
        },
        '401': {
          description: 'Não autenticado.',
          ...errorResponse
        },
        '403': {
          description: 'Sem permissão (papel `admin` requerido).',
          ...errorResponse
        }
      }
    },
    post: {
      tags: ['Invites'],
      summary: 'Cria um convite',
      description:
        'Gera um convite com token único e expiração de 7 dias. Requer o papel `admin` (`requireRole(admin)`).',
      operationId: 'createInvite',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['role'],
              properties: {
                role: {
                  type: 'string',
                  enum: ['admin', 'operator', 'viewer'],
                  description: 'Papel atribuído ao aceitar o convite.'
                },
                note: {
                  type: 'string',
                  maxLength: 120,
                  description: 'Nota livre opcional sobre o convite.'
                }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Convite criado.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id', 'token', 'role'],
                properties: {
                  id: { type: 'string', description: 'Id do convite.' },
                  token: { type: 'string', description: 'Token de uso único.' },
                  role: {
                    type: 'string',
                    enum: ['admin', 'operator', 'viewer'],
                    description: 'Papel atribuído.'
                  }
                }
              }
            }
          }
        },
        '400': {
          description: 'Body inválido.',
          ...errorResponse
        },
        '401': {
          description: 'Não autenticado.',
          ...errorResponse
        },
        '403': {
          description: 'Sem permissão (papel `admin` requerido).',
          ...errorResponse
        }
      }
    }
  },
  '/api/invites/{id}': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Id do convite.',
        schema: { type: 'string' }
      }
    ],
    delete: {
      tags: ['Invites'],
      summary: 'Remove um convite',
      description:
        'Remove um convite pelo id (idempotente). Requer o papel `admin` (`requireRole(admin)`).',
      operationId: 'deleteInvite',
      responses: {
        '204': {
          description: 'Convite removido (sem conteúdo).'
        },
        '400': {
          description: 'Id ausente.',
          ...errorResponse
        },
        '401': {
          description: 'Não autenticado.',
          ...errorResponse
        },
        '403': {
          description: 'Sem permissão (papel `admin` requerido).',
          ...errorResponse
        }
      }
    }
  }
};
