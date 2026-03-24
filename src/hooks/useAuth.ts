import { useState, useCallback } from 'react';
import { getAuth, setAuth, clearAuth, type User, type AuthState } from '@/lib/auth';

export function useAuth() {
  const [auth, setAuthState] = useState<AuthState>(getAuth);

  const login = useCallback((user: User, token: string) => {
    const state = { user, token };
    setAuth(state);
    setAuthState(state);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setAuthState({ user: null, token: null });
  }, []);

  const updateStatus = useCallback((status: User['status']) => {
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
