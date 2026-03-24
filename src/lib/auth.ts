export type UserRole = 'admin' | 'okk' | 'operator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'online' | 'busy' | 'away' | 'offline';
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

const STORAGE_KEY = 'sp2_auth';

export function getAuth(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null, token: null };
    return JSON.parse(raw);
  } catch {
    return { user: null, token: null };
  }
}

export function setAuth(state: AuthState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: 'Администратор',
    okk: 'ОКК',
    operator: 'Оператор',
  };
  return labels[role];
}

export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    admin: 'bg-red-100 text-red-700',
    okk: 'bg-purple-100 text-purple-700',
    operator: 'bg-blue-100 text-blue-700',
  };
  return colors[role];
}
