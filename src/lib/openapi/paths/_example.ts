import type { PathsModule } from '../types';

export const examplePaths: PathsModule = {
  '/api/eggs': {
    get: {
      tags: ['Servers'],
      summary: 'Lista todos os eggs disponíveis',
      description:
        'Retorna o resumo de cada egg carregado. Use `?refresh=1` para recarregar do disco.',
      operationId: 'listEggs',
      parameters: [
        {
          name: 'refresh',
          in: 'query',
          required: false,
          description: 'Força recarregar os eggs do disco quando igual a "1".',
          schema: { type: 'string', enum: ['1'] }
        }
      ],
      responses: {
        '200': {
          description: 'Lista de eggs.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['eggs'],
                properties: {
                  eggs: { type: 'array', items: { type: 'object' } }
                }
              }
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
        }
      }
    }
  },
  '/api/eggs/{slug}': {
    get: {
      tags: ['Servers'],
      summary: 'Detalha um egg pelo slug',
      operationId: 'getEgg',
      parameters: [
        {
          name: 'slug',
          in: 'path',
          required: true,
          description: 'Slug do egg.',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Egg encontrado.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['egg'],
                properties: { egg: { type: 'object' } }
              }
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
        '404': {
          description: 'Egg não encontrado.',
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
