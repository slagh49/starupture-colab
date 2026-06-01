import styles from './TabBar.module.css';

export type TabId = 'map' | 'progression' | 'admin';

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isAdmin: boolean;
}

export function TabBar({ activeTab, onTabChange, isAdmin }: Props): JSX.Element {
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
      {isAdmin && (
        <button
          className={`${styles.tab} ${activeTab === 'admin' ? styles.active : ''}`}
          onClick={() => onTabChange('admin')}
          type="button"
        >
          <svg className={styles.icon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="2.5" />
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M13 3l-1.5 1.5M4.5 11.5L3 13" />
          </svg>
          ADMINISTRATION
        </button>
      )}
    </nav>
  );
}
