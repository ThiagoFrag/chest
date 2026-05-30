export type Theme =
  | 'grass'
  | 'nether'
  | 'end'
  | 'diamond'
  | 'gold'
  | 'deep-dark'
  | 'redstone'
  | 'ocean';

export const THEMES: Theme[] = [
  'grass',
  'nether',
  'end',
  'diamond',
  'gold',
  'deep-dark',
  'redstone',
  'ocean'
];

export const DEFAULT_THEME: Theme = 'grass';

export const THEME_LABELS: Record<Theme, string> = {
  grass: 'Grama',
  nether: 'Nether',
  end: 'The End',
  diamond: 'Diamante',
  gold: 'Ouro',
  'deep-dark': 'Deep Dark',
  redstone: 'Redstone',
  ocean: 'Oceano'
};
