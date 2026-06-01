import { useState, useEffect } from 'react';
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
      setStatus({ kind: 'ok', text: 'Configuration enregistrée.' });
    } catch {
      setStatus({ kind: 'err', text: 'Échec de l\'enregistrement.' });
    } finally {
      setBusy(false);
    }
  };

  const test = async (): Promise<void> => {
    setBusy(true);
    setStatus({ kind: 'info', text: 'Test de connexion…' });
    try {
      const res = await adminApi.test();
      setStatus(res.data.ok
        ? { kind: 'ok', text: 'Connexion FTP réussie.' }
        : { kind: 'err', text: 'Connexion FTP échouée : ' + (res.data.message ?? 'cause inconnue') });
    } catch {
      setStatus({ kind: 'err', text: 'Connexion FTP échouée.' });
    } finally {
      setBusy(false);
    }
  };

  const importNow = async (): Promise<void> => {
    setBusy(true);
    setStatus({ kind: 'info', text: 'Import en cours…' });
    try {
      const res = await adminApi.importNow();
      setStatus({ kind: 'ok', text: 'Import réussi — données rechargées (wipe + rechargement).' });
      onImported(res.data);
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setStatus({ kind: 'err', text: 'Import échoué : ' + (msg ?? 'erreur inconnue') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>IMPORT FTP AUTOMATIQUE</h2>

      <div className={styles.form}>
        <label className={styles.field}>
          <span>Hôte FTP</span>
          <input value={host} onChange={e => setHost(e.target.value)} placeholder="192.168.1.x" />
        </label>
        <label className={`${styles.field} ${styles.small}`}>
          <span>Port</span>
          <input type="number" value={port} onChange={e => setPort(Number(e.target.value))} />
        </label>
        <label className={styles.field}>
          <span>Utilisateur</span>
          <input value={user} onChange={e => setUser(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Mot de passe {hasPassword && <em>(enregistré)</em>}</span>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                 placeholder={hasPassword ? '•••••• (inchangé)' : ''} />
        </label>
        <label className={`${styles.field} ${styles.full}`}>
          <span>Chemin du fichier .sav</span>
          <input value={path} onChange={e => setPath(e.target.value)} placeholder="/saves/AutoSave0.sav" />
        </label>
        <label className={`${styles.field} ${styles.full}`}>
          <span>URL passerelle HTTP (Web-FTP) <em>— recommandé, contourne le FTP passif</em></span>
          <input value={bridgeUrl} onChange={e => setBridgeUrl(e.target.value)}
                 placeholder="https://ftp.4np.4players.de/bridges/php/handler.php" />
        </label>

        <label className={styles.checkbox}>
          <input type="checkbox" checked={autoEnabled} onChange={e => setAutoEnabled(e.target.checked)} />
          <span>Import automatique</span>
        </label>
        <label className={`${styles.field} ${styles.small}`}>
          <span>Toutes les (min)</span>
          <input type="number" value={interval} min={1}
                 onChange={e => setIntervalMin(Number(e.target.value))} disabled={!autoEnabled} />
        </label>
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={save} disabled={busy} className={styles.btnPrimary}>Enregistrer</button>
        <button type="button" onClick={test} disabled={busy} className={styles.btn}>Tester la connexion</button>
        <button type="button" onClick={importNow} disabled={busy} className={styles.btn}>Importer maintenant</button>
      </div>

      {status && <div className={`${styles.status} ${styles[status.kind]}`}>{status.text}</div>}
      {lastImport && <div className={styles.meta}>Dernier import auto : {new Date(lastImport).toLocaleString('fr-FR')}</div>}
      <div className={styles.note}>
        Les identifiants sont stockés sur le serveur (homelab). Le mot de passe n'est jamais renvoyé à l'interface.
        Si une URL passerelle est renseignée, le téléchargement passe par le Web-FTP HTTP de l'hébergeur
        (fonctionne serveur de jeu allumé) ; sinon il utilise le FTP direct. Laisse le champ vide pour forcer le FTP.
      </div>

      <UserManagement />
    </div>
  );
}
