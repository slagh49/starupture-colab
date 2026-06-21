import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { usersApi } from '../../services/api';
import type { ManagedUser } from '../../services/api';
import styles from './UserManagement.module.css';

interface Status {
  kind: 'ok' | 'err';
  text: string;
}

function errMsg(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback;
}

export function UserManagement(): JSX.Element {
  const { t } = useTranslation();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [newName, setNewName] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newRole, setNewRole] = useState('USER');
  const [pwEdits, setPwEdits] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    usersApi.list().then(res => setUsers(res.data)).catch(() => undefined);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (): Promise<void> => {
    setBusy(true);
    setStatus(null);
    try {
      await usersApi.create({ username: newName, password: newPass, role: newRole });
      setNewName('');
      setNewPass('');
      setNewRole('USER');
      setStatus({ kind: 'ok', text: t('admin.users.created', { name: newName }) });
      load();
    } catch (e) {
      setStatus({ kind: 'err', text: errMsg(e, t('admin.users.createFailed')) });
    } finally {
      setBusy(false);
    }
  };

  const setPassword = async (u: ManagedUser): Promise<void> => {
    const pw = pwEdits[u.id]?.trim();
    if (!pw) return;
    setBusy(true);
    setStatus(null);
    try {
      await usersApi.setPassword(u.id, pw);
      setPwEdits(prev => ({ ...prev, [u.id]: '' }));
      setStatus({ kind: 'ok', text: t('admin.users.passwordUpdated', { name: u.username }) });
    } catch (e) {
      setStatus({ kind: 'err', text: errMsg(e, t('admin.users.updateFailed')) });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (u: ManagedUser): Promise<void> => {
    if (!window.confirm(t('admin.users.deleteConfirm', { name: u.username }))) return;
    setBusy(true);
    setStatus(null);
    try {
      await usersApi.remove(u.id);
      setStatus({ kind: 'ok', text: t('admin.users.deleted', { name: u.username }) });
      load();
    } catch (e) {
      setStatus({ kind: 'err', text: errMsg(e, t('admin.users.deleteFailed')) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.title}>{t('admin.users.title')}</h2>

      <div className={styles.createRow}>
        <input className={styles.input} value={newName} placeholder={t('admin.users.usernamePlaceholder')}
               onChange={e => setNewName(e.target.value)} />
        <input className={styles.input} type="password" value={newPass} placeholder={t('admin.users.passwordPlaceholder')}
               onChange={e => setNewPass(e.target.value)} />
        <select className={styles.select} value={newRole} onChange={e => setNewRole(e.target.value)}>
          <option value="USER">{t('admin.users.roleUser')}</option>
          <option value="ADMIN">{t('admin.users.roleAdmin')}</option>
        </select>
        <button type="button" className={styles.btnPrimary} disabled={busy || !newName || !newPass}
                onClick={create}>{t('admin.users.create')}</button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr><th>{t('admin.users.colUser')}</th><th>{t('admin.users.colRole')}</th><th>{t('admin.users.colNewPassword')}</th><th></th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td className={styles.name}>{u.username}</td>
              <td>
                <span className={`${styles.role} ${u.role === 'ADMIN' ? styles.admin : ''}`}>
                  {u.role === 'ADMIN' ? 'ADMIN' : 'USER'}
                </span>
              </td>
              <td>
                <div className={styles.pwCell}>
                  <input className={styles.input} type="password" placeholder="••••••"
                         value={pwEdits[u.id] ?? ''}
                         onChange={e => setPwEdits(prev => ({ ...prev, [u.id]: e.target.value }))} />
                  <button type="button" className={styles.btn} disabled={busy || !pwEdits[u.id]?.trim()}
                          onClick={() => setPassword(u)}>{t('admin.users.setPassword')}</button>
                </div>
              </td>
              <td>
                <button type="button" className={styles.btnDanger} disabled={busy}
                        onClick={() => remove(u)}>{t('admin.users.delete')}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {status && <div className={`${styles.status} ${styles[status.kind]}`}>{status.text}</div>}
    </div>
  );
}
