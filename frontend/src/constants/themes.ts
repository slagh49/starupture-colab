/** Thèmes graphiques basés sur l'identité des corporations StarRupture. */
export type ThemeId = 'default' | 'selenian' | 'moon' | 'clever' | 'future' | 'griffith';

export interface ThemeMeta {
  id: ThemeId;
  /** Libellé affiché dans le sélecteur. */
  label: string;
  /** Pastille de couleur (= accent principal du thème). */
  swatch: string;
}

export const THEMES: ThemeMeta[] = [
  { id: 'default',  label: 'Terminal',             swatch: '#00d4ff' },
  { id: 'selenian', label: 'Selenian Corporation', swatch: '#f5872a' },
  { id: 'moon',     label: 'Moon Energy',          swatch: '#aebfcc' },
  { id: 'clever',   label: 'Clever Robotics',      swatch: '#ff4438' },
  { id: 'future',   label: 'Future Health',        swatch: '#2dd4bf' },
  { id: 'griffith', label: 'Griffith Blue',        swatch: '#4a90ff' },
];

export const DEFAULT_THEME: ThemeId = 'default';
