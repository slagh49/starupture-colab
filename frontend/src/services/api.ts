import axios from 'axios';
import type {
  SaveSession,
  GameEntity,
  GameEntityItem,
  DroneLink,
  RailSpline,
  BaseZone,
  SessionSummary,
  Progression,
  AppConfig,
} from '../types/save.types';
import type {
  KanbanBoard,
  KanbanColumn,
  KanbanTask,
  KanbanUser,
  TaskFields,
} from '../types/kanban.types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
});

export const TOKEN_KEY = 'authToken';

// Attach the bearer token to every request.
api.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 (expired/invalid token), drop it and let the app fall back to login.
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(err);
  }
);

export interface AuthUser {
  username: string;
  role: string;
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ token: string; username: string; role: string }>('/auth/login', { username, password }),
  me: () => api.get<AuthUser>('/auth/me'),
};

export interface CreateUserInput {
  username: string;
  password: string;
  role: string;
}

export interface ManagedUser {
  id: string;
  username: string;
  role: string;
  createdAt: string | null;
}

export const usersApi = {
  list:        ()                          => api.get<ManagedUser[]>('/admin/users'),
  create:      (input: CreateUserInput)    => api.post<ManagedUser>('/admin/users', input),
  setPassword: (id: string, password: string) => api.put(`/admin/users/${id}/password`, { password }),
  remove:      (id: string)                => api.delete(`/admin/users/${id}`),
};

const formData = (file: File): FormData => {
  const fd = new FormData();
  fd.append('file', file);
  return fd;
};

export const savesApi = {
  upload:   (file: File)   => api.post<SaveSession>('/saves', formData(file)),
  list:     ()             => api.get<SaveSession[]>('/saves'),
  delete:   (id: string)   => api.delete(`/saves/${id}`),
  entities: (id: string)   => api.get<GameEntity[]>(`/saves/${id}/entities`),
  items:    (id: string, entityId: string) => api.get<GameEntityItem[]>(`/saves/${id}/entities/${entityId}/items`),
  links:    (id: string)   => api.get<DroneLink[]>(`/saves/${id}/links`),
  splines:  (id: string)   => api.get<RailSpline[]>(`/saves/${id}/splines`),
  zones:    (id: string)   => api.get<BaseZone[]>(`/saves/${id}/zones`),
  summary:  (id: string)   => api.get<SessionSummary>(`/saves/${id}/summary`),
  progression: (id: string) => api.get<Progression>(`/saves/${id}/progression`),
};

export interface AppConfigInput {
  ftpHost: string;
  ftpPort: number;
  ftpUser: string;
  ftpPassword?: string;
  ftpPath: string;
  bridgeUrl: string;
  autoImportEnabled: boolean;
  autoImportIntervalMinutes: number;
}

export const kanbanApi = {
  board:        ()                              => api.get<KanbanBoard>('/kanban/board'),
  users:        ()                              => api.get<KanbanUser[]>('/kanban/users'),
  createColumn: (title: string)                 => api.post<KanbanColumn>('/kanban/columns', { title }),
  renameColumn: (id: string, title: string)     => api.put<KanbanColumn>(`/kanban/columns/${id}`, { title }),
  moveColumn:   (id: string, position: number)  => api.put<KanbanColumn>(`/kanban/columns/${id}/move`, { position }),
  deleteColumn: (id: string)                    => api.delete(`/kanban/columns/${id}`),
  createTask:   (columnId: string, fields: TaskFields) =>
    api.post<KanbanTask>('/kanban/tasks', { columnId, ...fields }),
  updateTask:   (id: string, fields: TaskFields) => api.put<KanbanTask>(`/kanban/tasks/${id}`, fields),
  moveTask:     (id: string, columnId: string, position: number) =>
    api.put<KanbanTask>(`/kanban/tasks/${id}/move`, { columnId, position }),
  deleteTask:   (id: string)                    => api.delete(`/kanban/tasks/${id}`),
};

export const adminApi = {
  getConfig: ()                    => api.get<AppConfig>('/admin/config'),
  saveConfig: (cfg: AppConfigInput) => api.put<AppConfig>('/admin/config', cfg),
  test:      ()                    => api.post<{ ok: boolean; message: string }>('/admin/test'),
  importNow: ()                    => api.post<SaveSession>('/admin/import'),
};
