import { useTranslation } from 'react-i18next';
import type { KanbanTask } from '../../types/kanban.types';
import { PRIORITY_COLORS } from '../../constants/colors';
import styles from './TaskCard.module.css';

interface Props {
  task: KanbanTask;
  onEdit: (task: KanbanTask) => void;
  onDelete: (task: KanbanTask) => void;
  onDragStart: (task: KanbanTask) => void;
  onDragEnd: () => void;
  dragging: boolean;
}

/** Échéance dépassée ? (comparaison sur la date du jour, sans l'heure). */
function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return dueDate < today;
}

export function TaskCard({ task, onEdit, onDelete, onDragStart, onDragEnd, dragging }: Props): JSX.Element {
  const { t } = useTranslation();
  const overdue = isOverdue(task.dueDate);
  return (
    <article
      className={`${styles.card} ${dragging ? styles.dragging : ''}`}
      style={{ borderLeftColor: PRIORITY_COLORS[task.priority] }}
      draggable
      onDragStart={() => onDragStart(task)}
      onDragEnd={onDragEnd}
      onClick={() => onEdit(task)}
    >
      <div className={styles.head}>
        <span className={styles.cardTitle}>{task.title}</span>
        <button
          type="button"
          className={styles.delete}
          title={t('kanban.delete')}
          onClick={e => { e.stopPropagation(); onDelete(task); }}
        >×</button>
      </div>

      {task.description && <p className={styles.desc}>{task.description}</p>}

      <div className={styles.meta}>
        <span
          className={styles.priority}
          style={{ color: PRIORITY_COLORS[task.priority], borderColor: PRIORITY_COLORS[task.priority] }}
        >
          {t('priority.' + task.priority.toLowerCase())}
        </span>
        {task.assignee && <span className={styles.assignee}>👤 {task.assignee}</span>}
        {task.dueDate && (
          <span className={`${styles.due} ${overdue ? styles.overdue : ''}`}>
            📅 {task.dueDate}
          </span>
        )}
      </div>
    </article>
  );
}
