import { useState } from 'react';
import { THEMES, type ThemeId } from '../../constants/themes';
import styles from './ThemeSwitcher.module.css';

interface Props {
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
}

export function ThemeSwitcher({ theme, onThemeChange }: Props): JSX.Element {
  const [open, setOpen] = useState(false);
  const current = THEMES.find(t => t.id === theme) ?? THEMES[0]!;

  const pick = (id: ThemeId): void => {
    onThemeChange(id);
    setOpen(false);
  };

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        title="Thème graphique"
        onClick={() => setOpen(o => !o)}
      >
        <span className={styles.swatch} style={{ backgroundColor: current.swatch }} />
        <span className={styles.label}>{current.label}</span>
        <span className={styles.caret}>▾</span>
      </button>

      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <ul className={styles.menu}>
            {THEMES.map(t => (
              <li key={t.id}>
                <button
                  type="button"
                  className={`${styles.item} ${t.id === theme ? styles.active : ''}`}
                  onClick={() => pick(t.id)}
                >
                  <span className={styles.swatch} style={{ backgroundColor: t.swatch }} />
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
