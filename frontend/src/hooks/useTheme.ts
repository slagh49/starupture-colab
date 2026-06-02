import { useState, useEffect, useCallback } from 'react';
import { THEMES, DEFAULT_THEME, type ThemeId } from '../constants/themes';

const STORAGE_KEY = 'theme';
const VALID = new Set<ThemeId>(THEMES.map(t => t.id));

function readStored(): ThemeId {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved && VALID.has(saved as ThemeId) ? (saved as ThemeId) : DEFAULT_THEME;
}

/**
 * Thème courant : appliqué via l'attribut [data-theme] sur <html>, persisté
 * dans localStorage. Les variables CSS du thème (voir styles/themes.css)
 * cascadent alors sur toute l'application.
 */
export function useTheme(): { theme: ThemeId; setTheme: (t: ThemeId) => void } {
  const [theme, setThemeState] = useState<ThemeId>(readStored);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = useCallback((t: ThemeId) => {
    localStorage.setItem(STORAGE_KEY, t);
    setThemeState(t);
  }, []);

  return { theme, setTheme };
}
