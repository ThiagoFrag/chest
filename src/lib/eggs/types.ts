import { z } from 'zod';

export const eggLoaderTypeSchema = z.enum([
  'VANILLA',
  'PAPER',
  'FABRIC',
  'FORGE',
  'NEOFORGE',
  'PURPUR',
  'SPIGOT',
  'QUILT'
]);

export const eggSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{1,40}$/, 'slug must be lowercase kebab-case'),
  name: z.string().min(1).max(80),
  description: z.string().max(400).default(''),
  category: z
    .enum([
      'vanilla',
      'performance',
      'modded',
      'modpack',
      'pvp',
      'creative',
      'minigames',
      'other'
    ])
    .default('other'),
  icon: z.string().url().or(z.string().startsWith('/')).optional(),
  author: z.string().max(80).default('Chest'),
  version: z.string().default('1.0.0'),
  loader: eggLoaderTypeSchema,
  mcVersion: z.string().min(1),
  loaderVersion: z.string().optional(),
  defaults: z
    .object({
      memoryGb: z.number().int().min(1).max(64).default(4),
      maxPlayers: z.number().int().min(1).max(500).default(10),
      difficulty: z.enum(['peaceful', 'easy', 'normal', 'hard']).default('normal'),
      motd: z.string().max(120).optional()
    })
    .default({}),
  envExtras: z.record(z.string(), z.string()).default({}),
  jvmOpts: z.string().optional(),
  modrinthProjectId: z.string().optional(),
  postCreate: z
    .object({
      documentationUrl: z.string().url().optional(),
      notes: z.string().max(800).optional()
    })
    .default({}),
  tags: z.array(z.string()).default([])
});

export type Egg = z.infer<typeof eggSchema>;

export const EGG_CATEGORIES: Egg['category'][] = [
  'vanilla',
  'performance',
  'modded',
  'modpack',
  'pvp',
  'creative',
  'minigames',
  'other'
];

export interface EggSummary {
  slug: string;
  name: string;
  description: string;
  category: Egg['category'];
  icon?: string;
  author: string;
  version: string;
  loader: Egg['loader'];
  mcVersion: string;
  tags: string[];
}

export function toSummary(e: Egg): EggSummary {
  return {
    slug: e.slug,
    name: e.name,
    description: e.description,
    category: e.category,
    icon: e.icon,
    author: e.author,
    version: e.version,
    loader: e.loader,
    mcVersion: e.mcVersion,
    tags: e.tags
  };
}
