import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { THEMES, type ThemeId } from '../../constants/themes';
import styles from './ThemeSwitcher.module.css';

interface Props {
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
}

export function ThemeSwitcher({ theme, onThemeChange }: Props): JSX.Element {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = THEMES.find(th => th.id === theme) ?? THEMES[0]!;
  // Theme names are proper nouns (corporations); only generic ones (e.g. Light)
  // have a translation key, others fall back to their literal label.
  const label = (id: ThemeId, fallback: string): string =>
    t(`theme.${id}`, { defaultValue: fallback });

  const pick = (id: ThemeId): void => {
    onThemeChange(id);
    setOpen(false);
  };

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        title={t('theme.title')}
        onClick={() => setOpen(o => !o)}
      >
        <span className={styles.swatch} style={{ backgroundColor: current.swatch }} />
        <span className={styles.label}>{label(current.id, current.label)}</span>
        <span className={styles.caret}>▾</span>
      </button>

      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <ul className={styles.menu}>
            {THEMES.map(th => (
              <li key={th.id}>
                <button
                  type="button"
                  className={`${styles.item} ${th.id === theme ? styles.active : ''}`}
                  onClick={() => pick(th.id)}
                >
                  <span className={styles.swatch} style={{ backgroundColor: th.swatch }} />
                  {label(th.id, th.label)}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
