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
  infra:    'INFRASTRUCTURE',
  antenna:  'ANTENNES',
  danger:   'DANGER',
  loot:     'LOOTABLES',
};
