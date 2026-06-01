import { useState } from 'react';
import styles from './LoginPage.module.css';

interface Props {
  onLogin: (username: string, password: string) => Promise<void>;
}

export function LoginPage({ onLogin }: Props): JSX.Element {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onLogin(username, password);
    } catch {
      setError('Identifiants invalides.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={submit}>
        <div className={styles.brand}>
          <span className={styles.logo}>STARRUPTURE</span>
          <span className={styles.subtitle}>BASE SCANNER</span>
        </div>
        <h2 className={styles.title}>Connexion</h2>

        <label className={styles.field}>
          <span>Utilisateur</span>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
          />
        </label>
        <label className={styles.field}>
          <span>Mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        {error && <div className={styles.error}>{error}</div>}

        <button type="submit" className={styles.button} disabled={busy || !username || !password}>
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
