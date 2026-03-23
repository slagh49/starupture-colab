import type { SaveSession } from '../../types/save.types';
import styles from './SessionSelector.module.css';

interface Props {
  sessions: SaveSession[];
  activeSession: SaveSession | null;
  onSelect: (session: SaveSession) => void;
}

export function SessionSelector({
  sessions,
  activeSession,
  onSelect,
}: Props): JSX.Element {
  if (sessions.length === 0) {
    return <span className={styles.empty}>No sessions loaded</span>;
  }

  return (
    <select
      className={styles.select}
      value={activeSession?.id ?? ''}
      onChange={e => {
        const session = sessions.find(s => s.id === e.target.value);
        if (session) onSelect(session);
      }}
    >
      <option value="" disabled>
        Select a session...
      </option>
      {sessions.map(s => (
        <option key={s.id} value={s.id}>
          {s.sessionName ?? s.filename}
        </option>
      ))}
    </select>
  );
}
