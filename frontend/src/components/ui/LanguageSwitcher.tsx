import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, applyLanguage, normalizeLanguage } from '../../i18n';
import { authApi } from '../../services/api';
import styles from './LanguageSwitcher.module.css';

interface Props {
  /** When true, the chosen language is also saved to the user's profile. */
  authenticated: boolean;
}

export function LanguageSwitcher({ authenticated }: Props): JSX.Element {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = normalizeLanguage(i18n.language);

  const pick = (code: string): void => {
    applyLanguage(code);
    setOpen(false);
    if (authenticated) {
      // Best-effort persistence; the UI already switched locally.
      authApi.setLanguage(normalizeLanguage(code)).catch(() => undefined);
    }
  };

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        title={t('header.language')}
        onClick={() => setOpen(o => !o)}
      >
        <span className={styles.globe}>🌐</span>
        <span className={styles.label}>{current.toUpperCase()}</span>
        <span className={styles.caret}>▾</span>
      </button>

      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <ul className={styles.menu}>
            {LANGUAGES.map(l => (
              <li key={l.code}>
                <button
                  type="button"
                  className={`${styles.item} ${l.code === current ? styles.active : ''}`}
                  onClick={() => pick(l.code)}
                >
                  <span className={styles.code}>{l.code.toUpperCase()}</span>
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
