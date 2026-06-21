import { useTranslation } from 'react-i18next';
import styles from './ZoomControls.module.css';

interface Props {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
  onFitAll: () => void;
}

export function ZoomControls({ onZoomIn, onZoomOut, onRecenter, onFitAll }: Props): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className={styles.container}>
      <button type="button" className={styles.btn} onClick={onZoomIn} title={t('map.zoomIn')}>
        +
      </button>
      <button type="button" className={styles.btn} onClick={onZoomOut} title={t('map.zoomOut')}>
        −
      </button>
      <button type="button" className={styles.btn} onClick={onRecenter} title={t('map.recenter')}>
        <svg viewBox="0 0 16 16" className={styles.icon} fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="3" />
          <line x1="8" y1="1" x2="8" y2="4" />
          <line x1="8" y1="12" x2="8" y2="15" />
          <line x1="1" y1="8" x2="4" y2="8" />
          <line x1="12" y1="8" x2="15" y2="8" />
        </svg>
      </button>
      <button type="button" className={styles.btn} onClick={onFitAll} title={t('map.fitAll')}>
        <svg viewBox="0 0 16 16" className={styles.icon} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" />
        </svg>
      </button>
    </div>
  );
}
