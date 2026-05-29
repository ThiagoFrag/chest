export type SecurityRequirement = Record<string, string[]>;

export interface Tag {
  name: string;
  description?: string;
}

export interface Parameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: Record<string, unknown>;
}

export interface MediaType {
  schema?: Record<string, unknown>;
  example?: unknown;
  examples?: Record<string, unknown>;
}

export interface RequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, MediaType>;
}

export interface Response {
  description: string;
  content?: Record<string, MediaType>;
  headers?: Record<string, unknown>;
}

export interface Operation {
  tags?: string[];
  summary: string;
  description?: string;
  operationId: string;
  security?: SecurityRequirement[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
}

export interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  patch?: Operation;
  delete?: Operation;
  parameters?: Parameter[];
}

export type PathsModule = Record<string, PathItem>;

export interface Components {
  securitySchemes?: Record<string, Record<string, unknown>>;
  schemas?: Record<string, Record<string, unknown>>;
  parameters?: Record<string, Parameter>;
}

export interface Info {
  title: string;
  version: string;
  description?: string;
}

export interface Server {
  url: string;
  description?: string;
}

export interface OpenAPIDocument {
  openapi: string;
  info: Info;
  servers?: Server[];
  security?: SecurityRequirement[];
  tags?: Tag[];
  components?: Components;
  paths: Record<string, PathItem>;
}
