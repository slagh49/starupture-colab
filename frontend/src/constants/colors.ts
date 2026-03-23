import type { EntityCategory } from '../types/save.types';

export const CAT_COLORS: Record<EntityCategory, string> = {
  basecore: '#00d4ff',
  machine:  '#39ff14',
  energy:   '#ffcc00',
  infra:    '#ff6b35',
  antenna:  '#b07aff',
  danger:   '#ff3030',
  loot:     '#777777',
};

export const CAT_LABELS: Record<EntityCategory, string> = {
  basecore: 'BASE CORE',
  machine:  'MACHINES',
  energy:   'ÉNERGIE',
  infra:    'INFRA',
  antenna:  'ANTENNES',
  danger:   'DANGER',
  loot:     'LOOTABLES',
};

/** UI theme palette */
export const UI = {
  bgDark:       '#0a0e14',
  bgPanel:      '#0d1117',
  bgSurface:    '#131920',
  border:       '#1e2733',
  borderCyan:   '#00d4ff33',
  textPrimary:  '#c8d0dc',
  textMuted:    '#6b7a8d',
  cyan:         '#00d4ff',
  green:        '#39ff14',
  fontMono:     "'Share Tech Mono', 'Fira Mono', monospace",
} as const;
