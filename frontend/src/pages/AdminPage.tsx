import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { SaveSession } from '../types/save.types';
import { adminApi } from '../services/api';
import { UserManagement } from '../components/admin/UserManagement';
import styles from './AdminPage.module.css';

interface Props {
  onImported: (session: SaveSession) => void;
}

interface Status {
  kind: 'ok' | 'err' | 'info';
  text: string;
}

export function AdminPage({ onImported }: Props): JSX.Element {
  const { t } = useTranslation();
  const [host, setHost] = useState('');
  const [port, setPort] = useState(21);
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [path, setPath] = useState('');
  const [bridgeUrl, setBridgeUrl] = useState('');
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [interval, setIntervalMin] = useState(30);
  const [lastImport, setLastImport] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminApi.getConfig().then(res => {
      const c = res.data;
      setHost(c.ftpHost ?? '');
      setPort(c.ftpPort ?? 21);
      setUser(c.ftpUser ?? '');
      setHasPassword(c.hasPassword);
      setPath(c.ftpPath ?? '');
      setBridgeUrl(c.bridgeUrl ?? '');
      setAutoEnabled(c.autoImportEnabled);
      setIntervalMin(c.autoImportIntervalMinutes ?? 30);
      setLastImport(c.lastImportAt);
    }).catch(() => undefined);
  }, []);

  const save = async (): Promise<void> => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await adminApi.saveConfig({
        ftpHost: host, ftpPort: port, ftpUser: user,
        ftpPassword: password || undefined,
        ftpPath: path, bridgeUrl, autoImportEnabled: autoEnabled, autoImportIntervalMinutes: interval,
      });
      setHasPassword(res.data.hasPassword);
      setPassword('');
      setStatus({ kind: 'ok', text: t('admin.configSaved') });
    } catch {
      setStatus({ kind: 'err', text: t('admin.saveFailed') });
    } finally {
      setBusy(false);
    }
  };

  const test = async (): Promise<void> => {
    setBusy(true);
    setStatus({ kind: 'info', text: t('admin.testing') });
    try {
      const res = await adminApi.test();
      setStatus(res.data.ok
        ? { kind: 'ok', text: t('admin.ftpOk') }
        : { kind: 'err', text: t('admin.ftpFailedReason', { reason: res.data.message ?? t('admin.unknownCause') }) });
    } catch {
      setStatus({ kind: 'err', text: t('admin.ftpFailed') });
    } finally {
      setBusy(false);
    }
  };

  const importNow = async (): Promise<void> => {
    setBusy(true);
    setStatus({ kind: 'info', text: t('admin.importing') });
    try {
      const res = await adminApi.importNow();
      setStatus({ kind: 'ok', text: t('admin.importOk') });
      onImported(res.data);
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setStatus({ kind: 'err', text: t('admin.importFailedReason', { reason: msg ?? t('admin.unknownError') }) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>{t('admin.title')}</h2>

      <div className={styles.form}>
        <label className={styles.field}>
          <span>{t('admin.ftpHost')}</span>
          <input value={host} onChange={e => setHost(e.target.value)} placeholder="192.168.1.x" />
        </label>
        <label className={`${styles.field} ${styles.small}`}>
          <span>{t('admin.port')}</span>
          <input type="number" value={port} onChange={e => setPort(Number(e.target.value))} />
        </label>
        <label className={styles.field}>
          <span>{t('admin.user')}</span>
          <input value={user} onChange={e => setUser(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>{t('admin.password')} {hasPassword && <em>{t('admin.passwordSaved')}</em>}</span>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                 placeholder={hasPassword ? t('admin.passwordUnchanged') : ''} />
        </label>
        <label className={`${styles.field} ${styles.full}`}>
          <span>{t('admin.savPath')}</span>
          <input value={path} onChange={e => setPath(e.target.value)} placeholder="/saves/AutoSave0.sav" />
        </label>
        <label className={`${styles.field} ${styles.full}`}>
          <span>{t('admin.bridgeUrl')} <em>{t('admin.bridgeUrlHint')}</em></span>
          <input value={bridgeUrl} onChange={e => setBridgeUrl(e.target.value)}
                 placeholder="https://ftp.4np.4players.de/bridges/php/handler.php" />
        </label>

        <label className={styles.checkbox}>
          <input type="checkbox" checked={autoEnabled} onChange={e => setAutoEnabled(e.target.checked)} />
          <span>{t('admin.autoImport')}</span>
        </label>
        <label className={`${styles.field} ${styles.small}`}>
          <span>{t('admin.everyMinutes')}</span>
          <input type="number" value={interval} min={1}
                 onChange={e => setIntervalMin(Number(e.target.value))} disabled={!autoEnabled} />
        </label>
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={save} disabled={busy} className={styles.btnPrimary}>{t('admin.save')}</button>
        <button type="button" onClick={test} disabled={busy} className={styles.btn}>{t('admin.testConnection')}</button>
        <button type="button" onClick={importNow} disabled={busy} className={styles.btn}>{t('admin.importNow')}</button>
      </div>

      {status && <div className={`${styles.status} ${styles[status.kind]}`}>{status.text}</div>}
      {lastImport && <div className={styles.meta}>{t('admin.lastAutoImport', { date: new Date(lastImport).toLocaleString('fr-FR') })}</div>}
      <div className={styles.note}>
        {t('admin.note')}
      </div>

      <UserManagement />
    </div>
  );
}
