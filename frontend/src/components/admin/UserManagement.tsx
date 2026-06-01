import { useState, useEffect, useCallback } from 'react';
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
      setStatus({ kind: 'ok', text: `Utilisateur « ${newName} » créé.` });
      load();
    } catch (e) {
      setStatus({ kind: 'err', text: errMsg(e, "Échec de la création.") });
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
      setStatus({ kind: 'ok', text: `Mot de passe de « ${u.username} » mis à jour.` });
    } catch (e) {
      setStatus({ kind: 'err', text: errMsg(e, 'Échec de la mise à jour.') });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (u: ManagedUser): Promise<void> => {
    if (!window.confirm(`Supprimer l'utilisateur « ${u.username} » ?`)) return;
    setBusy(true);
    setStatus(null);
    try {
      await usersApi.remove(u.id);
      setStatus({ kind: 'ok', text: `Utilisateur « ${u.username} » supprimé.` });
      load();
    } catch (e) {
      setStatus({ kind: 'err', text: errMsg(e, 'Échec de la suppression.') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.title}>UTILISATEURS</h2>

      <div className={styles.createRow}>
        <input className={styles.input} value={newName} placeholder="nom d'utilisateur"
               onChange={e => setNewName(e.target.value)} />
        <input className={styles.input} type="password" value={newPass} placeholder="mot de passe"
               onChange={e => setNewPass(e.target.value)} />
        <select className={styles.select} value={newRole} onChange={e => setNewRole(e.target.value)}>
          <option value="USER">Utilisateur</option>
          <option value="ADMIN">Administrateur</option>
        </select>
        <button type="button" className={styles.btnPrimary} disabled={busy || !newName || !newPass}
                onClick={create}>Créer</button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr><th>Utilisateur</th><th>Rôle</th><th>Nouveau mot de passe</th><th></th></tr>
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
                          onClick={() => setPassword(u)}>Définir</button>
                </div>
              </td>
              <td>
                <button type="button" className={styles.btnDanger} disabled={busy}
                        onClick={() => remove(u)}>Suppr.</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {status && <div className={`${styles.status} ${styles[status.kind]}`}>{status.text}</div>}
    </div>
  );
}
