import { useState, useEffect, useCallback } from 'react';
import type { KanbanBoard, KanbanColumn, KanbanTask, KanbanUser, TaskFields } from '../types/kanban.types';
import { kanbanApi } from '../services/api';
import { TaskCard } from '../components/kanban/TaskCard';
import { TaskModal } from '../components/kanban/TaskModal';
import styles from './KanbanPage.module.css';

interface ModalState {
  columnId: string;
  columnTitle: string;
  task: KanbanTask | null;
}

export function KanbanPage(): JSX.Element {
  const [board, setBoard] = useState<KanbanBoard | null>(null);
  const [users, setUsers] = useState<KanbanUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragColId, setDragColId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [boardRes, usersRes] = await Promise.all([kanbanApi.board(), kanbanApi.users()]);
      setBoard(boardRes.data);
      setUsers(usersRes.data);
      setError(null);
    } catch {
      setError('Impossible de charger le tableau.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ---- Colonnes ----

  const addColumn = async (): Promise<void> => {
    const title = window.prompt('Nom de la nouvelle colonne ?');
    if (!title?.trim()) return;
    await kanbanApi.createColumn(title.trim());
    await load();
  };

  const renameColumn = async (col: KanbanColumn): Promise<void> => {
    const title = window.prompt('Renommer la colonne', col.title);
    if (!title?.trim() || title.trim() === col.title) return;
    await kanbanApi.renameColumn(col.id, title.trim());
    await load();
  };

  const deleteColumn = async (col: KanbanColumn): Promise<void> => {
    const msg = col.tasks.length
      ? `Supprimer « ${col.title} » et ses ${col.tasks.length} tâche(s) ?`
      : `Supprimer la colonne « ${col.title} » ?`;
    if (!window.confirm(msg)) return;
    await kanbanApi.deleteColumn(col.id);
    await load();
  };

  // ---- Tâches ----

  const saveTask = async (fields: TaskFields): Promise<void> => {
    if (!modal) return;
    if (modal.task) {
      await kanbanApi.updateTask(modal.task.id, fields);
    } else {
      await kanbanApi.createTask(modal.columnId, fields);
    }
    setModal(null);
    await load();
  };

  const deleteTask = async (task: KanbanTask): Promise<void> => {
    if (!window.confirm(`Supprimer la tâche « ${task.title} » ?`)) return;
    await kanbanApi.deleteTask(task.id);
    await load();
  };

  // ---- Glisser-déposer ----
  // L'index passé au backend est calculé sur la liste SANS la carte déplacée,
  // ce qui correspond exactement à sa sémantique (retire puis insère à l'index).

  const drop = async (col: KanbanColumn, beforeTaskId: string | null): Promise<void> => {
    const id = dragId;
    setDragId(null);
    setDragOverCol(null);
    if (!id) return;
    const rest = col.tasks.filter(t => t.id !== id);
    const index = beforeTaskId === null
      ? rest.length
      : rest.findIndex(t => t.id === beforeTaskId);
    await kanbanApi.moveTask(id, col.id, index < 0 ? rest.length : index);
    await load();
  };

  // Réordonnancement des colonnes : index calculé sur la liste sans la colonne
  // déplacée (= sémantique backend « retire puis insère »).
  const dropColumn = async (targetCol: KanbanColumn): Promise<void> => {
    const id = dragColId;
    setDragColId(null);
    setDragOverCol(null);
    if (!id || id === targetCol.id || !board) return;
    const rest = board.columns.filter(c => c.id !== id);
    const index = rest.findIndex(c => c.id === targetCol.id);
    await kanbanApi.moveColumn(id, index < 0 ? rest.length : index);
    await load();
  };

  if (error) {
    return <div className={styles.empty}>{error}</div>;
  }
  if (!board) {
    return <div className={styles.empty}>Chargement du tableau…</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.board}>
        {board.columns.map(col => (
          <section
            key={col.id}
            className={`${styles.column} ${dragOverCol === col.id ? styles.dragOver : ''} ${dragColId === col.id ? styles.colDragging : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOverCol(col.id); }}
            onDragLeave={() => setDragOverCol(prev => (prev === col.id ? null : prev))}
            onDrop={() => (dragColId ? void dropColumn(col) : void drop(col, null))}
          >
            <header
              className={styles.colHead}
              draggable
              onDragStart={e => { e.stopPropagation(); setDragColId(col.id); }}
              onDragEnd={() => { setDragColId(null); setDragOverCol(null); }}
              title="Glisser pour réordonner la colonne"
            >
              <span className={styles.grip}>⠿</span>
              <span className={styles.colTitle}>{col.title}</span>
              <span className={styles.count}>{col.tasks.length}</span>
              <div className={styles.colActions}>
                <button type="button" title="Renommer" onClick={() => void renameColumn(col)}>✎</button>
                <button type="button" title="Supprimer la colonne" onClick={() => void deleteColumn(col)}>🗑</button>
              </div>
            </header>

            <div className={styles.cards}>
              {col.tasks.map(task => (
                <div
                  key={task.id}
                  onDrop={e => { e.stopPropagation(); if (dragColId) { void dropColumn(col); } else { void drop(col, task.id); } }}
                  onDragOver={e => { e.preventDefault(); setDragOverCol(col.id); }}
                >
                  <TaskCard
                    task={task}
                    onEdit={t => setModal({ columnId: col.id, columnTitle: col.title, task: t })}
                    onDelete={t => void deleteTask(t)}
                    onDragStart={t => setDragId(t.id)}
                    onDragEnd={() => { setDragId(null); setDragOverCol(null); }}
                    dragging={dragId === task.id}
                  />
                </div>
              ))}
              {col.tasks.length === 0 && (
                <p className={styles.colEmpty}>Aucune tâche</p>
              )}
            </div>

            <button
              type="button"
              className={styles.addTask}
              onClick={() => setModal({ columnId: col.id, columnTitle: col.title, task: null })}
            >
              + Ajouter une tâche
            </button>
          </section>
        ))}

        <button type="button" className={styles.addColumn} onClick={() => void addColumn()}>
          + Colonne
        </button>
      </div>

      {modal && (
        <TaskModal
          task={modal.task}
          columnTitle={modal.columnTitle}
          users={users}
          onSave={fields => void saveTask(fields)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
