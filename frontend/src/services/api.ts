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

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
});

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

export const adminApi = {
  getConfig: ()                    => api.get<AppConfig>('/admin/config'),
  saveConfig: (cfg: AppConfigInput) => api.put<AppConfig>('/admin/config', cfg),
  test:      ()                    => api.post<{ ok: boolean; message: string }>('/admin/test'),
  importNow: ()                    => api.post<SaveSession>('/admin/import'),
};
