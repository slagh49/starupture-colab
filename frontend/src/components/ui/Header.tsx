import { useTranslation } from 'react-i18next';
import type { SaveSession, GameEntity, DroneLink } from '../../types/save.types';
import type { ThemeId } from '../../constants/themes';
import { UploadButton } from './UploadButton';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LanguageSwitcher } from './LanguageSwitcher';
import { formatPlaytime, formatSaveDate } from '../../utils/format';
import styles from './Header.module.css';

interface Props {
  activeSession: SaveSession | null;
  entities: GameEntity[];
  links: DroneLink[];
  loading: boolean;
  error: string | null;
  onUpload: (file: File) => void;
  username: string;
  onLogout: () => void;
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
}

export function Header({
  activeSession,
  entities,
  links,
  loading,
  error,
  onUpload,
  username,
  onLogout,
  theme,
  onThemeChange,
}: Props): JSX.Element {
  const { t } = useTranslation();
  const machineCount = entities.filter(e => e.category === 'machine').length;
  const droneCount = links.reduce((sum, l) => sum + l.droneCount, 0);
  const playtime = activeSession ? formatPlaytime(activeSession.playtime) : '—';
  const saveDate = activeSession ? formatSaveDate(activeSession.timestamp) : '—';
  const duplicate = activeSession?.sameAsPrevious ?? false;

  return (
    <header className={styles.header}>
      {duplicate && (
        <div className={styles.dupBanner} role="alert">
          {t('header.duplicateSave', { date: saveDate })}
        </div>
      )}
      <div className={styles.left}>
        <span className={styles.logo}>STARRUPTURE</span>
        <span className={styles.separator}>—</span>
        <span className={styles.subtitle}>{t('header.subtitle')}</span>
        <span className={styles.version} title={t('header.buildTitle')}>
          {import.meta.env.VITE_APP_VERSION ?? 'dev'}
        </span>
      </div>

      <div className={styles.center}>
        <UploadButton onUpload={onUpload} loading={loading} />
        {error && <span className={styles.error}>{error}</span>}
      </div>

      <div className={styles.stats}>
        <span className={styles.stat}>
          <span className={styles.statLabel}>{t('header.entities')}</span>
          <span className={styles.statValue}>{entities.length}</span>
        </span>
        <span className={styles.stat}>
          <span className={styles.statLabel}>{t('header.machines')}</span>
          <span className={styles.statValue}>{machineCount}</span>
        </span>
        <span className={styles.stat}>
          <span className={styles.statLabel}>{t('header.drones')}</span>
          <span className={styles.statValue}>{droneCount}</span>
        </span>
      </div>

      <div className={styles.right}>
        <span className={styles.stat}>
          <span className={styles.statLabel}>{t('header.playtime')}</span>
          <span className={styles.statValue}>{playtime}</span>
        </span>
        <span className={styles.stat}>
          <span className={styles.statLabel}>{t('header.save')}</span>
          <span className={styles.statValue}>{saveDate}</span>
        </span>
        <LanguageSwitcher authenticated />
        <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />
        <span className={styles.user}>
          <span className={styles.statLabel}>{username}</span>
          <button type="button" className={styles.logout} onClick={onLogout} title={t('header.logout')}>⏻</button>
        </span>
      </div>
    </header>
  );
}
