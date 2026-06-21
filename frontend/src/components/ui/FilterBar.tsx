import { useTranslation } from 'react-i18next';
import type { EntityCategory } from '../../types/save.types';
import { CAT_COLORS } from '../../constants/colors';
import styles from './FilterBar.module.css';

const CATEGORIES: EntityCategory[] = [
  'basecore', 'machine', 'energy', 'infra', 'antenna', 'danger', 'loot',
];

interface Props {
  activeFilters: Record<EntityCategory, boolean>;
  onToggle: (cat: EntityCategory) => void;
}

export function FilterBar({ activeFilters, onToggle }: Props): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className={styles.filterBar}>
      <div className={styles.title}>{t('filterBar.title')}</div>
      <div className={styles.buttons}>
        {CATEGORIES.map(cat => {
          const active = activeFilters[cat];
          const color = CAT_COLORS[cat];
          return (
            <button
              key={cat}
              type="button"
              className={`${styles.filterBtn} ${active ? styles.active : ''}`}
              style={{
                borderColor: active ? color : 'var(--border)',
                color: active ? color : 'var(--text-muted)',
                backgroundColor: active ? `${color}15` : 'transparent',
              }}
              onClick={() => onToggle(cat)}
            >
              <span className={styles.dot} style={{ backgroundColor: active ? color : 'var(--text-muted)' }} />
              {t('category.' + cat)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
