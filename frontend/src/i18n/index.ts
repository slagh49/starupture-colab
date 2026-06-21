import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import es from './locales/es.json';
import pl from './locales/pl.json';

/** Langues disponibles (la première est la langue par défaut). */
export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'pl', label: 'Polski' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';
export const LANG_KEY = 'lang';

const SUPPORTED = LANGUAGES.map(l => l.code) as readonly string[];

/** Normalise un code de langue arbitraire vers une langue supportée, sinon le défaut. */
export function normalizeLanguage(value: string | null | undefined): LanguageCode {
  if (!value) return DEFAULT_LANGUAGE;
  const base = value.toLowerCase().split('-')[0] ?? DEFAULT_LANGUAGE;
  return (SUPPORTED.includes(base) ? base : DEFAULT_LANGUAGE) as LanguageCode;
}

const stored = normalizeLanguage(localStorage.getItem(LANG_KEY));

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    de: { translation: de },
    es: { translation: es },
    pl: { translation: pl },
  },
  lng: stored,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
});

/** Change la langue de l'UI et la persiste en local. */
export function applyLanguage(code: string): void {
  const lang = normalizeLanguage(code);
  void i18n.changeLanguage(lang);
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;
}

document.documentElement.lang = stored;

export default i18n;
