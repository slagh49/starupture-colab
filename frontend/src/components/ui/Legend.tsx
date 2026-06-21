import { useTranslation } from 'react-i18next';
import { CAT_COLORS } from '../../constants/colors';
import type { EntityCategory } from '../../types/save.types';
import styles from './Legend.module.css';

const CATEGORIES: EntityCategory[] = [
  'basecore',
  'machine',
  'energy',
  'infra',
  'antenna',
  'danger',
  'loot',
];

export function Legend(): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className={styles.legend}>
      <div className={styles.title}>{t('legend.title')}</div>
      {CATEGORIES.map(cat => (
        <div key={cat} className={styles.item}>
          <span
            className={styles.dot}
            style={{ backgroundColor: CAT_COLORS[cat] }}
          />
          <span className={styles.label}>{t('category.' + cat)}</span>
        </div>
      ))}
    </div>
  );
}
