import { useState, useEffect, useCallback } from 'react';
import { savesApi } from '../services/api';
import type {
  SaveSession,
  GameEntity,
  DroneLink,
  RailSpline,
  BaseZone,
} from '../types/save.types';

interface SaveDataState {
  sessions: SaveSession[];
  activeSession: SaveSession | null;
  entities: GameEntity[];
  links: DroneLink[];
  splines: RailSpline[];
  zones: BaseZone[];
  loading: boolean;
  error: string | null;
}

interface SaveDataActions {
  loadSessions: () => Promise<void>;
  selectSession: (session: SaveSession) => Promise<void>;
  uploadFile: (file: File) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
}

export type UseSaveDataReturn = SaveDataState & SaveDataActions;

/**
 * The backend stores spline points as a JSON string (JSONB column) holding an
 * array of [x, y] pairs, and exposes it as-is. Normalize to an array of
 * { x, y } objects so consumers (RailLayer, MiniMap) can use it directly.
 */
function normalizeSpline(spline: RailSpline): RailSpline {
  let raw: unknown = spline.points;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = [];
    }
  }
  const points = Array.isArray(raw)
    ? raw.map(p =>
        Array.isArray(p)
          ? { x: Number(p[0]), y: Number(p[1]) }
          : (p as { x: number; y: number })
      )
    : [];
  return { ...spline, points };
}

export function useSaveData(): UseSaveDataReturn {
  const [sessions, setSessions] = useState<SaveSession[]>([]);
  const [activeSession, setActiveSession] = useState<SaveSession | null>(null);
  const [entities, setEntities] = useState<GameEntity[]>([]);
  const [links, setLinks] = useState<DroneLink[]>([]);
  const [splines, setSplines] = useState<RailSpline[]>([]);
  const [zones, setZones] = useState<BaseZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await savesApi.list();
      setSessions(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectSession = useCallback(async (session: SaveSession) => {
    setLoading(true);
    setError(null);
    setActiveSession(session);
    localStorage.setItem('activeSessionId', session.id);
    try {
      const [entitiesRes, linksRes, splinesRes, zonesRes] = await Promise.all([
        savesApi.entities(session.id),
        savesApi.links(session.id),
        savesApi.splines(session.id),
        savesApi.zones(session.id),
      ]);
      setEntities(entitiesRes.data);
      setLinks(linksRes.data);
      setSplines(splinesRes.data.map(normalizeSpline));
      setZones(zonesRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session data');
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const res = await savesApi.upload(file);
      const newSession = res.data;
      setSessions(prev => [newSession, ...prev]);
      await selectSession(newSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      setLoading(false);
    }
  }, [selectSession]);

  const deleteSession = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await savesApi.delete(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (activeSession?.id === id) {
        setActiveSession(null);
        setEntities([]);
        setLinks([]);
        setSplines([]);
        setZones([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
    } finally {
      setLoading(false);
    }
  }, [activeSession]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  // No session picker anymore: open the most recent save on startup so the
  // map is never empty and auto-imported updates show up on reload. The list
  // is returned most-recent-first by the API.
  useEffect(() => {
    if (activeSession || sessions.length === 0) return;
    const latest = sessions[0];
    if (latest) void selectSession(latest);
  }, [sessions, activeSession, selectSession]);

  return {
    sessions,
    activeSession,
    entities,
    links,
    splines,
    zones,
    loading,
    error,
    loadSessions,
    selectSession,
    uploadFile,
    deleteSession,
  };
}
