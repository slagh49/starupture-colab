import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { KanbanTask, KanbanUser, Priority, TaskFields } from '../../types/kanban.types';
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
  const { t } = useTranslation();
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
          {task ? t('kanban.editTask') : t('kanban.newTask')}
          <span className={styles.column}> — {columnTitle}</span>
        </h2>

        <label className={styles.label}>
          {t('kanban.taskTitle')}
          <input
            className={styles.input}
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
            maxLength={200}
            placeholder={t('kanban.taskTitlePlaceholder')}
          />
        </label>

        <label className={styles.label}>
          {t('kanban.description')}
          <textarea
            className={styles.textarea}
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder={t('kanban.descriptionPlaceholder')}
          />
        </label>

        <div className={styles.row}>
          <label className={styles.label}>
            {t('kanban.priority')}
            <select
              className={styles.input}
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
            >
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{t('priority.' + p.toLowerCase())}</option>
              ))}
            </select>
          </label>

          <label className={styles.label}>
            {t('kanban.assignee')}
            <select
              className={styles.input}
              value={assignee}
              onChange={e => setAssignee(e.target.value)}
            >
              <option value="">{t('kanban.noAssignee')}</option>
              {users.map(u => (
                <option key={u.username} value={u.username}>{u.username}</option>
              ))}
            </select>
          </label>

          <label className={styles.label}>
            {t('kanban.dueDate')}
            <input
              className={styles.input}
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </label>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>{t('kanban.cancel')}</button>
          <button type="submit" className={styles.save} disabled={!title.trim()}>
            {task ? t('kanban.save') : t('kanban.create')}
          </button>
        </div>
      </form>
    </div>
  );
}
