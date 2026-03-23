import { CAT_COLORS, CAT_LABELS } from '../../constants/colors';
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
  return (
    <div className={styles.legend}>
      <div className={styles.title}>CATEGORIES</div>
      {CATEGORIES.map(cat => (
        <div key={cat} className={styles.item}>
          <span
            className={styles.dot}
            style={{ backgroundColor: CAT_COLORS[cat] }}
          />
          <span className={styles.label}>{CAT_LABELS[cat]}</span>
        </div>
      ))}
    </div>
  );
}
