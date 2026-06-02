import { useState } from 'react';
import type { KanbanTask, KanbanUser, Priority, TaskFields } from '../../types/kanban.types';
import { PRIORITY_LABELS } from '../../constants/colors';
import styles from './TaskModal.module.css';

interface Props {
  /** Tâche à éditer, ou null pour une création. */
  task: KanbanTask | null;
  columnTitle: string;
  users: KanbanUser[];
  onSave: (fields: TaskFields) => void;
  onClose: () => void;
}

const PRIORITIES: Priority[] = ['LOW', 'NORMAL', 'HIGH'];

export function TaskModal({ task, columnTitle, users, onSave, onClose }: Props): JSX.Element {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'NORMAL');
  const [assignee, setAssignee] = useState(task?.assignee ?? '');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');

  const submit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      assignee: assignee || null,
      dueDate: dueDate || null,
    });
  };

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <form
        className={styles.modal}
        onMouseDown={e => e.stopPropagation()}
        onSubmit={submit}
      >
        <h2 className={styles.title}>
          {task ? 'MODIFIER LA TÂCHE' : 'NOUVELLE TÂCHE'}
          <span className={styles.column}> — {columnTitle}</span>
        </h2>

        <label className={styles.label}>
          TITRE
          <input
            className={styles.input}
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
            maxLength={200}
            placeholder="Ex : Construire une raffinerie d'hélium"
          />
        </label>

        <label className={styles.label}>
          DESCRIPTION
          <textarea
            className={styles.textarea}
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder="Détails, étapes, ressources nécessaires…"
          />
        </label>

        <div className={styles.row}>
          <label className={styles.label}>
            PRIORITÉ
            <select
              className={styles.input}
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
            >
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </label>

          <label className={styles.label}>
            ASSIGNÉ À
            <select
              className={styles.input}
              value={assignee}
              onChange={e => setAssignee(e.target.value)}
            >
              <option value="">— Personne —</option>
              {users.map(u => (
                <option key={u.username} value={u.username}>{u.username}</option>
              ))}
            </select>
          </label>

          <label className={styles.label}>
            ÉCHÉANCE
            <input
              className={styles.input}
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </label>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>ANNULER</button>
          <button type="submit" className={styles.save} disabled={!title.trim()}>
            {task ? 'ENREGISTRER' : 'CRÉER'}
          </button>
        </div>
      </form>
    </div>
  );
}
