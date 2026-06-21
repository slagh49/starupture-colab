import { useTranslation } from 'react-i18next';
import { itemColor } from '../map/DroneLayer';
import styles from './FlowFilter.module.css';

interface Props {
  items: Array<{ item: string; vol: number }>;
  selected: string | null;
  onSelect: (item: string | null) => void;
}

export function FlowFilter({ items, selected, onSelect }: Props): JSX.Element | null {
  const { t } = useTranslation();
  if (items.length === 0) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.title}>{t('flowFilter.title')}</div>
      <button
        type="button"
        className={`${styles.row} ${selected === null ? styles.active : ''}`}
        onClick={() => onSelect(null)}
      >
        <span className={styles.label}>{t('flowFilter.all')}</span>
        <span className={styles.vol}>{items.length}</span>
      </button>
      <div className={styles.list}>
        {items.map(({ item, vol }) => (
          <button
            key={item}
            type="button"
            className={`${styles.row} ${selected === item ? styles.active : ''}`}
            onClick={() => onSelect(selected === item ? null : item)}
          >
            <span className={styles.dot} style={{ backgroundColor: itemColor(item) }} />
            <span className={styles.label}>{item}</span>
            <span className={styles.vol}>{vol}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
