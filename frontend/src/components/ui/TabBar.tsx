import styles from './TabBar.module.css';

export type TabId = 'map' | 'production' | 'progression';

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function TabBar({ activeTab, onTabChange }: Props): JSX.Element {
  return (
    <nav className={styles.tabBar}>
      <button
        className={`${styles.tab} ${activeTab === 'map' ? styles.active : ''}`}
        onClick={() => onTabChange('map')}
        type="button"
      >
        <svg className={styles.icon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="1" width="14" height="14" rx="1" />
          <line x1="5.5" y1="1" x2="5.5" y2="15" />
          <line x1="10.5" y1="1" x2="10.5" y2="15" />
          <line x1="1" y1="5.5" x2="15" y2="5.5" />
          <line x1="1" y1="10.5" x2="15" y2="10.5" />
        </svg>
        CARTE INTERACTIVE
      </button>
      <button
        className={`${styles.tab} ${activeTab === 'production' ? styles.active : ''}`}
        onClick={() => onTabChange('production')}
        type="button"
      >
        <svg className={styles.icon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="1" width="14" height="14" rx="1" />
          <line x1="1" y1="5" x2="15" y2="5" />
          <line x1="1" y1="9" x2="15" y2="9" />
          <line x1="6" y1="1" x2="6" y2="14" />
        </svg>
        PRODUCTION
      </button>
      <button
        className={`${styles.tab} ${activeTab === 'progression' ? styles.active : ''}`}
        onClick={() => onTabChange('progression')}
        type="button"
      >
        <svg className={styles.icon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="2" y1="14" x2="2" y2="9" />
          <line x1="6" y1="14" x2="6" y2="6" />
          <line x1="10" y1="14" x2="10" y2="3" />
          <line x1="14" y1="14" x2="14" y2="7" />
        </svg>
        PROGRESSION
      </button>
    </nav>
  );
}
