import { useState, useEffect, useCallback } from 'react';
import { authApi, TOKEN_KEY } from '../services/api';
import type { AuthUser } from '../services/api';
import { applyLanguage } from '../i18n';

export interface UseAuthReturn {
  user: AuthUser | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  // On mount, validate any stored token via /me.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setReady(true);
      return;
    }
    authApi.me()
      .then(res => {
        setUser(res.data);
        applyLanguage(res.data.language);
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setReady(true));
  }, []);

  // The axios interceptor emits this when a 401 invalidates the token.
  useEffect(() => {
    const onLogout = (): void => setUser(null);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await authApi.login(username, password);
    localStorage.setItem(TOKEN_KEY, res.data.token);
    setUser({ username: res.data.username, role: res.data.role, language: res.data.language });
    applyLanguage(res.data.language);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return { user, ready, login, logout };
}
