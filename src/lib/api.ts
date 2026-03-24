import func2url from '../../backend/func2url.json';

const URLS = func2url as Record<string, string>;

function getToken(): string {
  try {
    const raw = localStorage.getItem('sp2_auth');
    if (!raw) return '';
    return JSON.parse(raw).token || '';
  } catch { return ''; }
}

function getClientToken(): string {
  return localStorage.getItem('sp2_client_token') || '';
}

async function request(fn: string, path: string, options: RequestInit = {}, extra?: Record<string, string>): Promise<Response> {
  const base = URLS[fn];
  if (!base) throw new Error(`Unknown function: ${fn}`);
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(extra || {}),
    ...(options.headers as Record<string, string> || {}),
  };
  return fetch(`${base}${path}`, { ...options, headers });
}

// ─── Auth ──────────────────────────────────────────────────
export const api = {
  auth: {
    login: (login: string, password: string) =>
      request('auth', '/login', { method: 'POST', body: JSON.stringify({ login, password }) }),

    logout: () =>
      request('auth', '/logout', { method: 'POST' }),

    me: () =>
      request('auth', '/me'),
  },

  // ─── Users ───────────────────────────────────────────────
  users: {
    list: () => request('users', '/users'),
    create: (data: { name: string; login: string; email: string; password: string; role: string }) =>
      request('users', '/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, string>) =>
      request('users', `/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateStatus: (status: string) =>
      request('users', `/users/me/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },

  // ─── Chats (operator) ────────────────────────────────────
  chats: {
    list: (params?: { status?: string; operator_id?: string }) => {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return request('chats', `/chats${qs}`);
    },
    get: (id: string) => request('chats', `/chats/${id}`),
    update: (id: string, data: Record<string, string | null>) =>
      request('chats', `/chats/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    // Client portal
    createFromClient: (data: { clientName: string; clientEmail?: string; subject: string; firstMessage?: string }) =>
      request('chats', '/client', { method: 'POST', body: JSON.stringify(data) }),
    getByClientToken: (clientToken: string) =>
      request('chats', '/client', {}, { 'X-Client-Token': clientToken }),
  },

  // ─── Messages ────────────────────────────────────────────
  messages: {
    list: (chatId: string, since?: string) => {
      const qs = since ? `?since=${encodeURIComponent(since)}` : '';
      return request('messages', `/${chatId}${qs}`);
    },
    send: (chatId: string, text: string) =>
      request('messages', `/${chatId}`, { method: 'POST', body: JSON.stringify({ text }) }),

    // Client portal
    listAsClient: (chatId: string, clientToken: string, since?: string) => {
      const qs = since ? `?since=${encodeURIComponent(since)}` : '';
      return request('messages', `/${chatId}${qs}`, {}, { 'X-Client-Token': clientToken });
    },
    sendAsClient: (chatId: string, text: string, clientToken: string) =>
      request('messages', `/${chatId}`, { method: 'POST', body: JSON.stringify({ text }) }, { 'X-Client-Token': clientToken }),
  },

  // ─── Dashboard ───────────────────────────────────────────
  dashboard: {
    get: () => request('dashboard', '/'),
  },
};

export { getClientToken };
