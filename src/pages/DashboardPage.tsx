import PageHeader from '@/components/layout/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import Icon from '@/components/ui/icon';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { time: '09:00', chats: 4, resolved: 3 },
  { time: '10:00', chats: 8, resolved: 6 },
  { time: '11:00', chats: 12, resolved: 9 },
  { time: '12:00', chats: 7, resolved: 7 },
  { time: '13:00', chats: 5, resolved: 4 },
  { time: '14:00', chats: 11, resolved: 8 },
  { time: '15:00', chats: 14, resolved: 11 },
  { time: '16:00', chats: 9, resolved: 9 },
];

const stats = [
  { label: 'Активных чатов', value: '14', icon: 'MessageSquare', color: 'text-blue-600', bg: 'bg-blue-50', change: '+3', up: true },
  { label: 'Решено сегодня', value: '57', icon: 'CheckCircle2', color: 'text-green-600', bg: 'bg-green-50', change: '+12', up: true },
  { label: 'Среднее время ответа', value: '2м 14с', icon: 'Clock', color: 'text-amber-600', bg: 'bg-amber-50', change: '-30с', up: true },
  { label: 'SLA нарушено', value: '2', icon: 'AlertTriangle', color: 'text-red-600', bg: 'bg-red-50', change: '+2', up: false },
];

const operators = [
  { name: 'Сергей Козлов', status: 'online', chats: 4, resolved: 18, rate: 94 },
  { name: 'Анна Белова', status: 'busy', chats: 3, resolved: 21, rate: 97 },
  { name: 'Дмитрий Орлов', status: 'online', chats: 2, resolved: 15, rate: 89 },
  { name: 'Ольга Смирнова', status: 'away', chats: 0, resolved: 3, rate: 100 },
];

const recentChats = [
  { id: '001', client: 'Иван Петров', subject: 'Ошибка при оплате', status: 'open', time: '2 мин назад', priority: 'high' },
  { id: '002', client: 'ООО Техпром', subject: 'Вопрос по договору', status: 'pending', time: '15 мин назад', priority: 'medium' },
  { id: '003', client: 'Мария Соколова', subject: 'Возврат средств', status: 'open', time: '27 мин назад', priority: 'high' },
  { id: '004', client: 'Алексей Новиков', subject: 'Технические вопросы', status: 'resolved', time: '1 ч назад', priority: 'low' },
];

const statusDot: Record<string, string> = {
  online: 'dot-online',
  busy: 'dot-busy',
  away: 'dot-away',
  offline: 'dot-offline',
};

const chatStatusBadge: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
};

const chatStatusLabel: Record<string, string> = {
  open: 'Открыт',
  pending: 'Ожидает',
  resolved: 'Решён',
};

const priorityBadge: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-600',
};

export default function DashboardPage() {
  const { user } = useAuth();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Доброе утро' : hour < 17 ? 'Добрый день' : 'Добрый вечер';

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Дашборд"
        subtitle={`${greeting}, ${user?.name.split(' ')[0]}!`}
      >
        <span className="text-xs text-muted-foreground">{new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border p-4 flex items-start gap-3">
              <div className={`${stat.bg} ${stat.color} rounded-lg p-2.5 flex-shrink-0`}>
                <Icon name={stat.icon} size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                <p className={`text-xs mt-1 font-medium ${stat.up ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change} за сегодня
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="xl:col-span-2 bg-white rounded-xl border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Обращения за сегодня</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorChats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(213,90%,52%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(213,90%,52%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,16%,94%)" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="chats" name="Входящие" stroke="hsl(213,90%,52%)" fill="url(#colorChats)" strokeWidth={2} />
                <Area type="monotone" dataKey="resolved" name="Решено" stroke="#22c55e" fill="url(#colorResolved)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Operators */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Операторы</h3>
            <div className="space-y-3">
              {operators.map(op => (
                <div key={op.name} className="flex items-center gap-2.5">
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                      {op.name.split(' ').map(w => w[0]).join('')}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${statusDot[op.status]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{op.name}</p>
                    <p className="text-xs text-muted-foreground">{op.chats} чатов · {op.resolved} решено</p>
                  </div>
                  <span className="text-xs font-semibold text-green-600">{op.rate}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent chats */}
        <div className="bg-white rounded-xl border">
          <div className="px-5 py-3.5 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Последние обращения</h3>
            <a href="/chats" className="text-xs text-primary hover:underline">Все чаты →</a>
          </div>
          <div className="divide-y">
            {recentChats.map(chat => (
              <div key={chat.id} className="px-5 py-3 flex items-center gap-4 hover:bg-muted/30 cursor-pointer transition-colors">
                <span className="text-xs text-muted-foreground font-mono w-8">#{chat.id}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{chat.client}</p>
                  <p className="text-xs text-muted-foreground truncate">{chat.subject}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge[chat.priority]}`}>
                  {chat.priority === 'high' ? 'Высокий' : chat.priority === 'medium' ? 'Средний' : 'Низкий'}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${chatStatusBadge[chat.status]}`}>
                  {chatStatusLabel[chat.status]}
                </span>
                <span className="text-xs text-muted-foreground w-24 text-right">{chat.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
