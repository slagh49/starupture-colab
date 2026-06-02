export type Priority = 'LOW' | 'NORMAL' | 'HIGH';

export interface KanbanTask {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  priority: Priority;
  assignee: string | null;
  dueDate: string | null; // ISO yyyy-MM-dd
  position: number;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface KanbanColumn {
  id: string;
  title: string;
  position: number;
  tasks: KanbanTask[];
}

export interface KanbanBoard {
  columns: KanbanColumn[];
}

export interface KanbanUser {
  username: string;
}

/** Champs éditables d'une tâche (création et modification). */
export interface TaskFields {
  title: string;
  description: string | null;
  priority: Priority;
  assignee: string | null;
  dueDate: string | null;
}
