import type { PathsModule } from '../types';

export const serversconfigPaths: PathsModule = {
	'/api/servers/{name}/properties': {
		get: {
			tags: ['Config'],
			summary: 'Lê o server.properties',
			description:
				'Retorna o `server.properties` parseado e o conteúdo bruto. Requer a permissão de servidor `edit_config`.',
			operationId: 'getServerProperties',
			parameters: [
				{
					name: 'name',
					in: 'path',
					required: true,
					description: 'Nome do container do servidor.',
					schema: { type: 'string' }
				}
			],
			responses: {
				'200': {
					description: 'Propriedades do servidor.',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['properties', 'raw'],
								properties: {
									properties: {
										type: 'object',
										additionalProperties: { type: 'string' }
									},
									raw: { type: 'string' }
								}
							}
						}
					}
				},
				'400': {
					description: 'Nome do servidor ausente.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'401': {
					description: 'Não autenticado.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'403': {
					description: 'Sem a permissão `edit_config`.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				}
			}
		},
		put: {
			tags: ['Config'],
			summary: 'Atualiza o server.properties',
			description:
				'Faz merge das propriedades informadas no `server.properties` existente. Requer a permissão de servidor `edit_config`.',
			operationId: 'updateServerProperties',
			parameters: [
				{
					name: 'name',
					in: 'path',
					required: true,
					description: 'Nome do container do servidor.',
					schema: { type: 'string' }
				}
			],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['properties'],
							properties: {
								properties: {
									type: 'object',
									additionalProperties: { type: 'string' }
								}
							}
						}
					}
				}
			},
			responses: {
				'200': {
					description: 'Propriedades atualizadas (reinício necessário).',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['ok', 'restartNeeded'],
								properties: {
									ok: { type: 'boolean' },
									restartNeeded: { type: 'boolean' }
								}
							}
						}
					}
				},
				'400': {
					description: 'Body inválido ou nome do servidor ausente.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'401': {
					description: 'Não autenticado.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'403': {
					description: 'Sem a permissão `edit_config`.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				}
			}
		}
	},
	'/api/servers/{name}/discord': {
		get: {
			tags: ['Config'],
			summary: 'Lê o canal do Discord vinculado',
			description:
				'Retorna o ID do canal do Discord vinculado ao chat do servidor. Requer a permissão de servidor `manage_discord`.',
			operationId: 'getServerDiscordChannel',
			parameters: [
				{
					name: 'name',
					in: 'path',
					required: true,
					description: 'Nome do container do servidor.',
					schema: { type: 'string' }
				}
			],
			responses: {
				'200': {
					description: 'Canal vinculado.',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['channelId'],
								properties: {
									channelId: { type: 'string', nullable: true }
								}
							}
						}
					}
				},
				'401': {
					description: 'Não autenticado.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'403': {
					description: 'Sem a permissão `manage_discord`.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				}
			}
		},
		put: {
			tags: ['Config'],
			summary: 'Vincula ou desvincula o canal do Discord',
			description:
				'Define o canal do Discord usado pelo bridge de chat (envie `null` para desvincular). Requer a permissão de servidor `manage_discord`.',
			operationId: 'setServerDiscordChannel',
			parameters: [
				{
					name: 'name',
					in: 'path',
					required: true,
					description: 'Nome do container do servidor.',
					schema: { type: 'string' }
				}
			],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['channelId'],
							properties: {
								channelId: { type: 'string', nullable: true }
							}
						}
					}
				}
			},
			responses: {
				'200': {
					description: 'Canal atualizado.',
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
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'401': {
					description: 'Não autenticado.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'403': {
					description: 'Sem a permissão `manage_discord`.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				}
			}
		}
	},
	'/api/servers/{name}/auth-mode': {
		get: {
			tags: ['Config'],
			summary: 'Detecta o modo de autenticação',
			description:
				'Retorna o modo de autenticação atual do servidor (Mojang/Drasl/offline). Requer a permissão de servidor `view_logs`.',
			operationId: 'getServerAuthMode',
			parameters: [
				{
					name: 'name',
					in: 'path',
					required: true,
					description: 'Nome do container do servidor.',
					schema: { type: 'string' }
				}
			],
			responses: {
				'200': {
					description: 'Modo de autenticação detectado.',
					content: {
						'application/json': {
							schema: { type: 'object' }
						}
					}
				},
				'400': {
					description: 'Nome do servidor ausente.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'401': {
					description: 'Não autenticado.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'403': {
					description: 'Sem a permissão `view_logs`.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				}
			}
		},
		post: {
			tags: ['Config'],
			summary: 'Define o modo de autenticação',
			description:
				'Altera o modo de autenticação do servidor. Para `drasl` é possível informar uma `draslUrl`. Requer a permissão de servidor `edit_config`.',
			operationId: 'setServerAuthMode',
			parameters: [
				{
					name: 'name',
					in: 'path',
					required: true,
					description: 'Nome do container do servidor.',
					schema: { type: 'string' }
				}
			],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['mode'],
							properties: {
								mode: { type: 'string', enum: ['mojang', 'drasl', 'offline'] },
								draslUrl: { type: 'string', format: 'uri' }
							}
						}
					}
				}
			},
			responses: {
				'200': {
					description: 'Modo de autenticação atualizado.',
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
					description: 'Body inválido ou nome do servidor ausente.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'401': {
					description: 'Não autenticado.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'403': {
					description: 'Sem a permissão `edit_config`.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				}
			}
		}
	},
	'/api/servers/{name}/players-config': {
		get: {
			tags: ['Config'],
			summary: 'Lê listas de jogadores',
			description:
				'Retorna whitelist, banidos, IPs banidos e operadores do servidor. Requer a permissão de servidor `manage_players`.',
			operationId: 'getServerPlayersConfig',
			parameters: [
				{
					name: 'name',
					in: 'path',
					required: true,
					description: 'Nome do container do servidor.',
					schema: { type: 'string' }
				}
			],
			responses: {
				'200': {
					description: 'Listas de jogadores.',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['whitelist', 'bans', 'banIps', 'ops'],
								properties: {
									whitelist: { type: 'array', items: { type: 'object' } },
									bans: { type: 'array', items: { type: 'object' } },
									banIps: { type: 'array', items: { type: 'object' } },
									ops: { type: 'array', items: { type: 'object' } }
								}
							}
						}
					}
				},
				'400': {
					description: 'Nome do servidor ausente.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'401': {
					description: 'Não autenticado.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'403': {
					description: 'Sem a permissão `manage_players`.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				}
			}
		},
		post: {
			tags: ['Config'],
			summary: 'Adiciona ou remove jogador de uma lista',
			description:
				'Aplica uma ação (add/remove) sobre `whitelist`, `ops`, `bans` ou `banIps`. Quando o servidor está rodando usa RCON, caso contrário edita os arquivos JSON. Requer a permissão de servidor `manage_players`.',
			operationId: 'updateServerPlayersConfig',
			parameters: [
				{
					name: 'name',
					in: 'path',
					required: true,
					description: 'Nome do container do servidor.',
					schema: { type: 'string' }
				}
			],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							oneOf: [
								{
									type: 'object',
									required: ['list', 'action', 'player'],
									properties: {
										list: { type: 'string', enum: ['whitelist'] },
										action: { type: 'string', enum: ['add', 'remove'] },
										player: { type: 'string', minLength: 1, maxLength: 32 }
									}
								},
								{
									type: 'object',
									required: ['list', 'action', 'player'],
									properties: {
										list: { type: 'string', enum: ['ops'] },
										action: { type: 'string', enum: ['add', 'remove'] },
										player: { type: 'string', minLength: 1, maxLength: 32 }
									}
								},
								{
									type: 'object',
									required: ['list', 'action', 'player'],
									properties: {
										list: { type: 'string', enum: ['bans'] },
										action: { type: 'string', enum: ['add', 'remove'] },
										player: { type: 'string', minLength: 1, maxLength: 32 },
										reason: { type: 'string', maxLength: 200 }
									}
								},
								{
									type: 'object',
									required: ['list', 'action', 'ip'],
									properties: {
										list: { type: 'string', enum: ['banIps'] },
										action: { type: 'string', enum: ['add', 'remove'] },
										ip: { type: 'string', minLength: 1, maxLength: 45 },
										reason: { type: 'string', maxLength: 200 }
									}
								}
							]
						}
					}
				}
			},
			responses: {
				'200': {
					description: 'Lista atualizada.',
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
					description: 'Body inválido ou nome do servidor ausente.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'401': {
					description: 'Não autenticado.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'403': {
					description: 'Sem a permissão `manage_players`.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				}
			}
		}
	},
	'/api/servers/{name}/expose': {
		post: {
			tags: ['Config'],
			summary: 'Expõe o servidor via subdomínio',
			description:
				'Cria/atualiza um registro CNAME no Cloudflare apontando para o servidor e marca o `publicMode` como `domain`. Requer papel global `admin`.',
			operationId: 'exposeServerSubdomain',
			parameters: [
				{
					name: 'name',
					in: 'path',
					required: true,
					description: 'Nome do container do servidor.',
					schema: { type: 'string' }
				}
			],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['subdomain'],
							properties: {
								subdomain: {
									type: 'string',
									minLength: 1,
									maxLength: 63,
									pattern: '^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$'
								}
							}
						}
					}
				}
			},
			responses: {
				'200': {
					description: 'Subdomínio configurado.',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['publicUrl', 'hostname', 'port', 'dnsRecord'],
								properties: {
									publicUrl: { type: 'string' },
									hostname: { type: 'string' },
									port: { type: 'integer' },
									dnsRecord: {
										type: 'object',
										properties: {
											id: { type: 'string' },
											name: { type: 'string' },
											content: { type: 'string' }
										}
									}
								}
							}
						}
					}
				},
				'400': {
					description: 'Subdomínio inválido ou settings do Cloudflare ausentes.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'401': {
					description: 'Não autenticado.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'403': {
					description: 'Sem papel `admin`.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'404': {
					description: 'Servidor ou zona Cloudflare não encontrada.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				}
			}
		}
	},
	'/api/servers/{name}/subusers': {
		get: {
			tags: ['Config'],
			summary: 'Lista subusuários do servidor',
			description:
				'Retorna os subusuários com permissões e a lista de permissões disponíveis. Requer papel global `admin`.',
			operationId: 'listServerSubusers',
			parameters: [
				{
					name: 'name',
					in: 'path',
					required: true,
					description: 'Nome do container do servidor.',
					schema: { type: 'string' }
				}
			],
			responses: {
				'200': {
					description: 'Lista de subusuários.',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['subusers', 'availablePermissions'],
								properties: {
									subusers: { type: 'array', items: { type: 'object' } },
									availablePermissions: { type: 'array', items: { type: 'string' } }
								}
							}
						}
					}
				},
				'400': {
					description: 'Nome do servidor ausente.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'401': {
					description: 'Não autenticado.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'403': {
					description: 'Sem papel `admin`.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'404': {
					description: 'Servidor não encontrado.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				}
			}
		},
		post: {
			tags: ['Config'],
			summary: 'Adiciona um subusuário',
			description:
				'Concede acesso a um usuário existente com um conjunto de permissões. Requer papel global `admin`.',
			operationId: 'addServerSubuser',
			parameters: [
				{
					name: 'name',
					in: 'path',
					required: true,
					description: 'Nome do container do servidor.',
					schema: { type: 'string' }
				}
			],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['username'],
							properties: {
								username: { type: 'string', minLength: 1, maxLength: 32 },
								permissions: {
									type: 'array',
									items: { type: 'string' },
									default: []
								}
							}
						}
					}
				}
			},
			responses: {
				'201': {
					description: 'Subusuário criado.',
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
					description: 'Body inválido, nome do servidor ausente ou alvo é admin.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'401': {
					description: 'Não autenticado.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'403': {
					description: 'Sem papel `admin`.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'404': {
					description: 'Servidor ou usuário não encontrado.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'409': {
					description: 'Usuário já tem acesso a este servidor.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				}
			}
		},
		put: {
			tags: ['Config'],
			summary: 'Atualiza permissões de um subusuário',
			description:
				'Substitui o conjunto de permissões de um subusuário existente. Requer papel global `admin`.',
			operationId: 'updateServerSubuser',
			parameters: [
				{
					name: 'name',
					in: 'path',
					required: true,
					description: 'Nome do container do servidor.',
					schema: { type: 'string' }
				}
			],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['subuserId', 'permissions'],
							properties: {
								subuserId: { type: 'string', minLength: 1 },
								permissions: { type: 'array', items: { type: 'string' } }
							}
						}
					}
				}
			},
			responses: {
				'200': {
					description: 'Permissões atualizadas.',
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
					description: 'Body inválido ou nome do servidor ausente.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'401': {
					description: 'Não autenticado.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'403': {
					description: 'Sem papel `admin`.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'404': {
					description: 'Servidor ou subusuário não encontrado.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				}
			}
		},
		delete: {
			tags: ['Config'],
			summary: 'Remove um subusuário',
			description: 'Revoga o acesso de um subusuário ao servidor. Requer papel global `admin`.',
			operationId: 'removeServerSubuser',
			parameters: [
				{
					name: 'name',
					in: 'path',
					required: true,
					description: 'Nome do container do servidor.',
					schema: { type: 'string' }
				}
			],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['subuserId'],
							properties: {
								subuserId: { type: 'string', minLength: 1 }
							}
						}
					}
				}
			},
			responses: {
				'200': {
					description: 'Subusuário removido.',
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
					description: 'Body inválido ou nome do servidor ausente.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'401': {
					description: 'Não autenticado.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'403': {
					description: 'Sem papel `admin`.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'404': {
					description: 'Servidor não encontrado.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				}
			}
		}
	},
	'/api/servers/{name}/map': {
		get: {
			tags: ['Config'],
			summary: 'Status do mapa (BlueMap)',
			description:
				'Retorna o status de instalação/renderização do mapa do servidor. Requer a permissão de servidor `view_logs`.',
			operationId: 'getServerMapStatus',
			parameters: [
				{
					name: 'name',
					in: 'path',
					required: true,
					description: 'Nome do container do servidor.',
					schema: { type: 'string' }
				}
			],
			responses: {
				'200': {
					description: 'Status do mapa.',
					content: {
						'application/json': {
							schema: { type: 'object' }
						}
					}
				},
				'400': {
					description: 'Nome do servidor ausente.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'401': {
					description: 'Não autenticado.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'403': {
					description: 'Sem a permissão `view_logs`.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				}
			}
		},
		post: {
			tags: ['Config'],
			summary: 'Instala/ativa o mapa (BlueMap)',
			description:
				'Instala o BlueMap em modo `embedded`, `sidecar` ou `auto`. Requer a permissão de servidor `manage_files`.',
			operationId: 'installServerMap',
			parameters: [
				{
					name: 'name',
					in: 'path',
					required: true,
					description: 'Nome do container do servidor.',
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
								mode: {
									type: 'string',
									enum: ['embedded', 'sidecar', 'auto'],
									default: 'auto'
								},
								sidecarHeapMb: { type: 'integer', minimum: 512, maximum: 8192 }
							}
						}
					}
				}
			},
			responses: {
				'200': {
					description: 'Mapa instalado/ativado.',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['ok', 'mode', 'hostPort'],
								properties: {
									ok: { type: 'boolean' },
									mode: { type: 'string', enum: ['embedded', 'sidecar'] },
									hostPort: { type: 'integer', nullable: true },
									restartRequired: { type: 'boolean' },
									message: { type: 'string' }
								}
							}
						}
					}
				},
				'400': {
					description: 'Body inválido, modo incompatível ou nome do servidor ausente.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'401': {
					description: 'Não autenticado.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'403': {
					description: 'Sem a permissão `manage_files`.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'404': {
					description: 'Container sem mount em /data (não é um servidor Minecraft).',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				}
			}
		},
		delete: {
			tags: ['Config'],
			summary: 'Desativa o mapa (BlueMap)',
			description:
				'Para e remove o sidecar do BlueMap. Use `?wipe=1` para apagar também os dados do mapa. Requer a permissão de servidor `manage_files`.',
			operationId: 'uninstallServerMap',
			parameters: [
				{
					name: 'name',
					in: 'path',
					required: true,
					description: 'Nome do container do servidor.',
					schema: { type: 'string' }
				},
				{
					name: 'wipe',
					in: 'query',
					required: false,
					description: 'Quando igual a "1", apaga também o volume com os dados do mapa.',
					schema: { type: 'string', enum: ['1'] }
				}
			],
			responses: {
				'200': {
					description: 'Mapa desativado.',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['ok'],
								properties: {
									ok: { type: 'boolean' },
									message: { type: 'string' }
								}
							}
						}
					}
				},
				'400': {
					description: 'Nome do servidor ausente.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'401': {
					description: 'Não autenticado.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'403': {
					description: 'Sem a permissão `manage_files`.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				}
			}
		}
	},
	'/api/servers/{name}/map/proxy/{...path}': {
		get: {
			tags: ['Config'],
			summary: 'Proxy de assets do mapa',
			description:
				'Faz proxy de qualquer asset do BlueMap (HTML, tiles, JSON) servido pelo container/sidecar. O `path` é o caminho completo dentro do mapa e pode conter barras. Requer a permissão de servidor `view_logs`.',
			operationId: 'proxyServerMapAsset',
			parameters: [
				{
					name: 'name',
					in: 'path',
					required: true,
					description: 'Nome do container do servidor.',
					schema: { type: 'string' }
				},
				{
					name: 'path',
					in: 'path',
					required: true,
					description: 'Caminho do asset do mapa (pode conter barras).',
					schema: { type: 'string' }
				}
			],
			responses: {
				'200': {
					description: 'Asset do mapa (tipo de conteúdo varia conforme o arquivo).',
					content: {
						'application/octet-stream': {
							schema: { type: 'string', format: 'binary' }
						}
					}
				},
				'400': {
					description: 'Nome do servidor ausente.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'401': {
					description: 'Não autenticado.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				},
				'403': {
					description: 'Sem a permissão `view_logs`.',
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/Error' } }
					}
				}
			}
		}
	}
};
