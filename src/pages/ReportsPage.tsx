import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';

const dailyData = [
  { day: 'Пн', chats: 42, resolved: 38, sla: 90 },
  { day: 'Вт', chats: 55, resolved: 48, sla: 87 },
  { day: 'Ср', chats: 61, resolved: 58, sla: 95 },
  { day: 'Чт', chats: 48, resolved: 45, sla: 93 },
  { day: 'Пт', chats: 70, resolved: 62, sla: 88 },
  { day: 'Сб', chats: 23, resolved: 23, sla: 100 },
  { day: 'Вс', chats: 18, resolved: 17, sla: 94 },
];

const responseTimeData = [
  { time: '9:00', avg: 1.8 }, { time: '10:00', avg: 2.3 }, { time: '11:00', avg: 3.1 },
  { time: '12:00', avg: 4.2 }, { time: '13:00', avg: 3.8 }, { time: '14:00', avg: 2.9 },
  { time: '15:00', avg: 2.4 }, { time: '16:00', avg: 1.9 }, { time: '17:00', avg: 2.1 },
];

const channelData = [
  { name: 'Веб-чат', value: 52, color: 'hsl(213,90%,52%)' },
  { name: 'Telegram', value: 30, color: '#2AABEE' },
  { name: 'Почта', value: 18, color: '#f59e0b' },
];

const operatorStats = [
  { name: 'Сергей Козлов', total: 148, resolved: 139, sla: 94, avgTime: '2м 08с' },
  { name: 'Анна Белова', total: 162, resolved: 157, sla: 97, avgTime: '1м 52с' },
  { name: 'Дмитрий Орлов', total: 121, resolved: 108, sla: 89, avgTime: '2м 45с' },
  { name: 'Ольга Смирнова', total: 87, resolved: 87, sla: 100, avgTime: '3м 10с' },
];

export default function ReportsPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Отчёты и аналитика" subtitle="Статистика за последние 7 дней">
        <Button variant="outline" size="sm">
          <Icon name="Download" size={14} className="mr-1.5" /> Экспорт
        </Button>
        <Button size="sm">
          <Icon name="Calendar" size={14} className="mr-1.5" /> Период
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="operators">По операторам</TabsTrigger>
            <TabsTrigger value="sla">SLA</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: 'Обращений за неделю', value: '317', icon: 'MessageSquare', color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Решено', value: '291', icon: 'CheckCircle2', color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Среднее время ответа', value: '2м 38с', icon: 'Clock', color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'SLA соблюдён', value: '93%', icon: 'ShieldCheck', color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border p-4 flex items-center gap-3">
                  <div className={`${s.bg} ${s.color} rounded-lg p-2.5`}>
                    <Icon name={s.icon} size={20} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Bar chart */}
              <div className="xl:col-span-2 bg-white rounded-xl border p-5">
                <h3 className="text-sm font-semibold mb-4">Обращения по дням</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dailyData} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,16%,94%)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="chats" name="Входящие" fill="hsl(213,90%,52%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resolved" name="Решено" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie chart */}
              <div className="bg-white rounded-xl border p-5">
                <h3 className="text-sm font-semibold mb-4">По каналам</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={channelData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                      {channelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                    <Tooltip formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Response time */}
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold mb-4">Среднее время ответа (мин) по часам</h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={responseTimeData} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,16%,94%)" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => `${v} мин`} />
                  <Line type="monotone" dataKey="avg" name="Среднее время" stroke="hsl(213,90%,52%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="operators">
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Оператор</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">Обращений</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">Решено</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">Ср. время</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {operatorStats.map(op => (
                    <tr key={op.name} className="hover:bg-muted/20">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {op.name.split(' ').map(w => w[0]).join('')}
                          </div>
                          <span className="text-sm font-medium">{op.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">{op.total}</td>
                      <td className="px-4 py-3 text-center text-sm">{op.resolved}</td>
                      <td className="px-4 py-3 text-center text-sm">{op.avgTime}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-semibold ${op.sla >= 95 ? 'text-green-600' : op.sla >= 85 ? 'text-amber-600' : 'text-red-600'}`}>
                          {op.sla}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="sla">
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold mb-4">Соблюдение SLA по дням</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dailyData} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,16%,94%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Line type="monotone" dataKey="sla" name="SLA" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
