export interface ModpackTemplate {
  slug: string;
  modrinthId: string;
  title: string;
  description: string;
  iconUrl: string;
  loader: 'FABRIC' | 'FORGE' | 'NEOFORGE' | 'QUILT';
  mcVersion: string;
  memoryGb: number;
  category:
    | 'rpg'
    | 'tech'
    | 'magic'
    | 'kitchen-sink'
    | 'optimization'
    | 'survival'
    | 'creative';
  featured?: boolean;
}

export const CURATED_TEMPLATES: ModpackTemplate[] = [
  {
    slug: 'atm9',
    modrinthId: 'TBBJ7e64',
    title: 'All The Mods 9',
    description:
      'Kitchen sink modpack famoso. Mods de tech, magic, exploration, tudo num pack só.',
    iconUrl:
      'https://cdn.modrinth.com/data/TBBJ7e64/8f988145cca6fa72e5e2e57a85a4fe7ba07e6e1f.png',
    loader: 'FORGE',
    mcVersion: '1.20.1',
    memoryGb: 12,
    category: 'kitchen-sink',
    featured: true
  },
  {
    slug: 'bmc4',
    modrinthId: 'IXnflKaH',
    title: 'Better MC RPG (BMC4)',
    description:
      'Modpack RPG/exploration moderno. Mundo expandido, dungeons, magia, mais de 400 mods.',
    iconUrl:
      'https://cdn.modrinth.com/data/IXnflKaH/a76dcc88d28a44cd2a23a99c01a6dcc1eb29a1ae.png',
    loader: 'FABRIC',
    mcVersion: '1.20.1',
    memoryGb: 6,
    category: 'rpg',
    featured: true
  },
  {
    slug: 'cobblemon',
    modrinthId: 'fabric-api',
    title: 'Cobblemon (Fabric)',
    description:
      'Pokémon dentro do MC. Mecânicas de captura, evolução, batalha. Fabric loader puro.',
    iconUrl: 'https://cdn.modrinth.com/data/MdwFAVRL/icon.png',
    loader: 'FABRIC',
    mcVersion: '1.21.1',
    memoryGb: 4,
    category: 'survival',
    featured: true
  },
  {
    slug: 'prominence-2-rpg',
    modrinthId: 'OWUlA7nz',
    title: 'Prominence II RPG: Hasturian Era',
    description:
      'RPG focado em quests, classes, espadas mágicas. Lore profundo + dungeons gigantes.',
    iconUrl:
      'https://cdn.modrinth.com/data/OWUlA7nz/d2ea6a9dad9b30c8d83eaff32a13d8f9dba0d6ee.png',
    loader: 'FABRIC',
    mcVersion: '1.20.1',
    memoryGb: 8,
    category: 'rpg'
  },
  {
    slug: 'rad2',
    modrinthId: 'NB1jcdy7',
    title: 'Roguelike Adventures and Dungeons 2',
    description:
      'RAD2 — explore dungeons procedurais, evolua personagem, sistema de XP/level próprio.',
    iconUrl: 'https://cdn.modrinth.com/data/NB1jcdy7/icon.png',
    loader: 'FORGE',
    mcVersion: '1.20.1',
    memoryGb: 8,
    category: 'rpg'
  },
  {
    slug: 'create-astral',
    modrinthId: '1KVo5zza',
    title: 'Create Astral',
    description:
      'Create mod focado em engenharia. Construa máquinas, automatize tudo, vibe steampunk.',
    iconUrl: 'https://cdn.modrinth.com/data/1KVo5zza/icon.png',
    loader: 'FABRIC',
    mcVersion: '1.19.2',
    memoryGb: 6,
    category: 'tech'
  },
  {
    slug: 'fabulously-optimized',
    modrinthId: '1KVo5zza',
    title: 'Fabulously Optimized',
    description:
      'Pacote de performance puro. Vanilla feel mas 5-10x mais FPS. Sodium + 100 mods de otimização.',
    iconUrl: 'https://cdn.modrinth.com/data/1KVo5zza/icon.png',
    loader: 'FABRIC',
    mcVersion: '1.21.1',
    memoryGb: 2,
    category: 'optimization',
    featured: true
  },
  {
    slug: 'vault-hunters-3',
    modrinthId: 'IcLnaCcb',
    title: 'Vault Hunters 3rd Edition',
    description:
      'Sistema de vault dungeons + skill tree único. Multiplayer competitivo e cooperativo.',
    iconUrl: 'https://cdn.modrinth.com/data/IcLnaCcb/icon.png',
    loader: 'FORGE',
    mcVersion: '1.18.2',
    memoryGb: 8,
    category: 'rpg'
  }
];

export const CATEGORIES: Record<
  ModpackTemplate['category'],
  { label: string; color: string }
> = {
  rpg: { label: 'RPG', color: '#ff8c00' },
  tech: { label: 'Tech', color: '#4aedd9' },
  magic: { label: 'Magic', color: '#aa50ff' },
  'kitchen-sink': { label: 'Kitchen Sink', color: '#fcdf52' },
  optimization: { label: 'Performance', color: '#5ba34d' },
  survival: { label: 'Survival', color: '#866043' },
  creative: { label: 'Creative', color: '#5dcfff' }
};
