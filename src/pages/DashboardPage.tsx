import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashData {
  stats: { activeChats: number; resolvedToday: number; messagesToday: number };
  operators: { id: string; name: string; status: string; activeChats: number; resolvedToday: number }[];
  recentChats: { id: string; clientName: string; subject: string; status: string; priority: string; channel: string; updatedAt: string; lastMessage?: string }[];
  chartData: { hour: string; messages: number }[];
}

const statusDot: Record<string, string> = { online: 'dot-online', busy: 'dot-busy', away: 'dot-away', offline: 'dot-offline' };
const chatStatusBadge: Record<string, string> = { open: 'bg-blue-100 text-blue-700', pending: 'bg-amber-100 text-amber-700', resolved: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-600' };
const chatStatusLabel: Record<string, string> = { open: 'Открыт', pending: 'Ожидает', resolved: 'Решён', closed: 'Закрыт' };
const priorityBadge: Record<string, string> = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-gray-100 text-gray-600' };
const priorityLabel: Record<string, string> = { high: 'Высокий', medium: 'Средний', low: 'Низкий' };

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    const res = await api.dashboard.get();
    if (res.ok) setData(await res.json());
    else setError('Не удалось загрузить данные');
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Доброе утро' : hour < 17 ? 'Добрый день' : 'Добрый вечер';

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Дашборд" subtitle={`${greeting}, ${user?.name.split(' ')[0]}!`}>
        <button onClick={load} className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded" title="Обновить">
          <Icon name="RefreshCw" size={15} className={loading ? 'animate-spin' : ''} />
        </button>
        <span className="text-xs text-muted-foreground">{new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm flex items-center gap-2">
            <Icon name="AlertCircle" size={16} /> {error}
            <button onClick={load} className="ml-auto underline">Повторить</button>
          </div>
        )}

        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) : data ? (
            [
              { label: 'Активных чатов', value: data.stats.activeChats, icon: 'MessageSquare', color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Решено сегодня', value: data.stats.resolvedToday, icon: 'CheckCircle2', color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Сообщений сегодня', value: data.stats.messagesToday, icon: 'Activity', color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border p-4 flex items-start gap-3">
                <div className={`${s.bg} ${s.color} rounded-lg p-2.5 flex-shrink-0`}><Icon name={s.icon} size={20} /></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              </div>
            ))
          ) : null}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-xl border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Сообщения по часам (сегодня)</h3>
            {loading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data?.chartData || []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMsg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(213,90%,52%)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(213,90%,52%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,16%,94%)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="messages" name="Сообщения" stroke="hsl(213,90%,52%)" fill="url(#colorMsg)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-xl border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Операторы</h3>
            {loading ? <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div> : (
              <div className="space-y-3">
                {!data?.operators.length && <p className="text-xs text-muted-foreground">Нет операторов</p>}
                {data?.operators.map(op => (
                  <div key={op.id} className="flex items-center gap-2.5">
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {op.name.split(' ').map((w: string) => w[0]).join('')}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${statusDot[op.status] || 'dot-offline'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{op.name}</p>
                      <p className="text-xs text-muted-foreground">{op.activeChats} чатов · {op.resolvedToday} решено</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border">
          <div className="px-5 py-3.5 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold">Последние обращения</h3>
            <button onClick={() => navigate('/chats')} className="text-xs text-primary hover:underline">Все чаты →</button>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : !data?.recentChats.length ? (
            <div className="p-8 text-center">
              <Icon name="MessageSquare" size={32} className="mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Нет обращений. Клиенты пока не писали.</p>
            </div>
          ) : (
            <div className="divide-y">
              {data.recentChats.map(chat => (
                <div key={chat.id} onClick={() => navigate('/chats')} className="px-5 py-3 flex items-center gap-4 hover:bg-muted/30 cursor-pointer transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{chat.clientName}</p>
                    <p className="text-xs text-muted-foreground truncate">{chat.subject}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge[chat.priority] || 'bg-gray-100 text-gray-600'}`}>{priorityLabel[chat.priority] || chat.priority}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${chatStatusBadge[chat.status] || ''}`}>{chatStatusLabel[chat.status] || chat.status}</span>
                  <span className="text-xs text-muted-foreground w-16 text-right">{new Date(chat.updatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
