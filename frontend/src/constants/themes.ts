/** Thèmes graphiques basés sur l'identité des corporations StarRupture. */
export type ThemeId = 'default' | 'selenian' | 'moon' | 'clever' | 'future' | 'griffith' | 'light';

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
  { id: 'light',    label: 'Clair',                swatch: '#e8edf2' },
];

export const DEFAULT_THEME: ThemeId = 'default';

/**
 * Accent principal de chaque thème, en hex — pour le rendu canvas de la carte
 * (zone de base, walkway) qui ne peut pas lire les variables CSS. Doit rester
 * synchronisé avec --accent dans styles/themes.css.
 */
export const THEME_ACCENTS: Record<ThemeId, string> = {
  default:  '#00d4ff',
  selenian: '#f5872a',
  moon:     '#aebfcc',
  clever:   '#ff4438',
  future:   '#2dd4bf',
  griffith: '#4a90ff',
  light:    '#0b84a8',
};
