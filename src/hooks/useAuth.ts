import { useState, useCallback } from 'react';
import { getAuth, setAuth, clearAuth, type User, type AuthState } from '@/lib/auth';
import { api } from '@/lib/api';

export function useAuth() {
  const [auth, setAuthState] = useState<AuthState>(getAuth);

  const login = useCallback(async (loginVal: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const res = await api.auth.login(loginVal, password);
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || 'Ошибка входа' };
    const state = { user: data.user as User, token: data.token };
    setAuth(state);
    setAuthState(state);
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout().catch(() => {});
    clearAuth();
    setAuthState({ user: null, token: null });
  }, []);

  const updateStatus = useCallback(async (status: User['status']) => {
    await api.users.updateStatus(status).catch(() => {});
    setAuthState(prev => {
      if (!prev.user) return prev;
      const next = { ...prev, user: { ...prev.user, status } };
      setAuth(next);
      return next;
    });
  }, []);

  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated: !!auth.user,
    login,
    logout,
    updateStatus,
  };
}
