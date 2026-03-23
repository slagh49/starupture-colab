import styles from './TabBar.module.css';

interface Props {
  activeTab: 'map' | 'production';
  onTabChange: (tab: 'map' | 'production') => void;
}

export function TabBar({ activeTab, onTabChange }: Props): JSX.Element {
  return (
    <nav className={styles.tabBar}>
      <button
        className={`${styles.tab} ${activeTab === 'map' ? styles.active : ''}`}
        onClick={() => onTabChange('map')}
        type="button"
      >
        MAP
      </button>
      <button
        className={`${styles.tab} ${activeTab === 'production' ? styles.active : ''}`}
        onClick={() => onTabChange('production')}
        type="button"
      >
        PRODUCTION
      </button>
    </nav>
  );
}
