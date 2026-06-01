import type { SaveSession, GameEntity, DroneLink } from '../../types/save.types';
import { UploadButton } from './UploadButton';
import { formatPlaytime } from '../../utils/format';
import styles from './Header.module.css';

interface Props {
  activeSession: SaveSession | null;
  entities: GameEntity[];
  links: DroneLink[];
  loading: boolean;
  error: string | null;
  onUpload: (file: File) => void;
}

export function Header({
  activeSession,
  entities,
  links,
  loading,
  error,
  onUpload,
}: Props): JSX.Element {
  const machineCount = entities.filter(e => e.category === 'machine').length;
  const droneCount = links.reduce((sum, l) => sum + l.droneCount, 0);
  const playtime = activeSession ? formatPlaytime(activeSession.playtime) : '—';
  const saveDate = activeSession
    ? activeSession.timestamp.slice(0, 10).replace(/-/g, '')
    : '—';

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <span className={styles.logo}>STARRUPTURE</span>
        <span className={styles.separator}>—</span>
        <span className={styles.subtitle}>BASE SCANNER</span>
        <span className={styles.version}>v3.0</span>
      </div>

      <div className={styles.center}>
        <UploadButton onUpload={onUpload} loading={loading} />
        {error && <span className={styles.error}>{error}</span>}
      </div>

      <div className={styles.stats}>
        <span className={styles.stat}>
          <span className={styles.statLabel}>ENTITES</span>
          <span className={styles.statValue}>{entities.length}</span>
        </span>
        <span className={styles.stat}>
          <span className={styles.statLabel}>MACHINES</span>
          <span className={styles.statValue}>{machineCount}</span>
        </span>
        <span className={styles.stat}>
          <span className={styles.statLabel}>DRONES</span>
          <span className={styles.statValue}>{droneCount}</span>
        </span>
      </div>

      <div className={styles.right}>
        <span className={styles.stat}>
          <span className={styles.statLabel}>TEMPS JEU</span>
          <span className={styles.statValue}>{playtime}</span>
        </span>
        <span className={styles.stat}>
          <span className={styles.statLabel}>SAVE</span>
          <span className={styles.statValue}>{saveDate}</span>
        </span>
      </div>
    </header>
  );
}
