import { useState, useEffect, useCallback } from 'react';
import { savesApi } from '../services/api';
import type {
  SaveSession,
  GameEntity,
  DroneLink,
  BaseZone,
} from '../types/save.types';

interface SaveDataState {
  sessions: SaveSession[];
  activeSession: SaveSession | null;
  entities: GameEntity[];
  links: DroneLink[];
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

export function useSaveData(): UseSaveDataReturn {
  const [sessions, setSessions] = useState<SaveSession[]>([]);
  const [activeSession, setActiveSession] = useState<SaveSession | null>(null);
  const [entities, setEntities] = useState<GameEntity[]>([]);
  const [links, setLinks] = useState<DroneLink[]>([]);
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
    try {
      const [entitiesRes, linksRes, zonesRes] = await Promise.all([
        savesApi.entities(session.id),
        savesApi.links(session.id),
        savesApi.zones(session.id),
      ]);
      setEntities(entitiesRes.data);
      setLinks(linksRes.data);
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

  return {
    sessions,
    activeSession,
    entities,
    links,
    zones,
    loading,
    error,
    loadSessions,
    selectSession,
    uploadFile,
    deleteSession,
  };
}
