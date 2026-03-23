import axios from 'axios';
import type {
  SaveSession,
  GameEntity,
  DroneLink,
  RailSpline,
  BaseZone,
  SessionSummary,
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
  links:    (id: string)   => api.get<DroneLink[]>(`/saves/${id}/links`),
  splines:  (id: string)   => api.get<RailSpline[]>(`/saves/${id}/splines`),
  zones:    (id: string)   => api.get<BaseZone[]>(`/saves/${id}/zones`),
  summary:  (id: string)   => api.get<SessionSummary>(`/saves/${id}/summary`),
};
