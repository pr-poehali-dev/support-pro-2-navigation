import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { getRoleLabel, getRoleBadgeColor, type UserRole } from '@/lib/auth';
import Icon from '@/components/ui/icon';

interface Employee {
  id: string;
  name: string;
  login: string;
  email: string;
  role: UserRole;
  status: 'online' | 'busy' | 'away' | 'offline';
  chatsToday: number;
  resolvedToday: number;
  createdAt: string;
}

const EMPLOYEES: Employee[] = [
  { id: '1', name: 'Александр Иванов', login: 'admin', email: 'admin@company.ru', role: 'admin', status: 'online', chatsToday: 0, resolvedToday: 0, createdAt: '01.01.2024' },
  { id: '2', name: 'Мария Петрова', login: 'okk', email: 'okk@company.ru', role: 'okk', status: 'online', chatsToday: 0, resolvedToday: 12, createdAt: '15.02.2024' },
  { id: '3', name: 'Сергей Козлов', login: 'operator', email: 'operator@company.ru', role: 'operator', status: 'online', chatsToday: 4, resolvedToday: 18, createdAt: '01.03.2024' },
  { id: '4', name: 'Анна Белова', login: 'a.belova', email: 'a.belova@company.ru', role: 'operator', status: 'busy', chatsToday: 3, resolvedToday: 21, createdAt: '01.03.2024' },
  { id: '5', name: 'Дмитрий Орлов', login: 'd.orlov', email: 'd.orlov@company.ru', role: 'operator', status: 'online', chatsToday: 2, resolvedToday: 15, createdAt: '10.04.2024' },
  { id: '6', name: 'Ольга Смирнова', login: 'o.smirnova', email: 'o.smirnova@company.ru', role: 'operator', status: 'away', chatsToday: 0, resolvedToday: 3, createdAt: '20.05.2024' },
];

const statusLabel: Record<string, string> = { online: 'Онлайн', busy: 'Занят', away: 'Отошёл', offline: 'Не в сети' };
const statusDot: Record<string, string> = { online: 'dot-online', busy: 'dot-busy', away: 'dot-away', offline: 'dot-offline' };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', login: '', email: '', role: 'operator' as UserRole, password: '' });

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.login.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    const emp: Employee = {
      id: Date.now().toString(),
      ...form,
      status: 'offline',
      chatsToday: 0,
      resolvedToday: 0,
      createdAt: new Date().toLocaleDateString('ru-RU'),
    };
    setEmployees(prev => [...prev, emp]);
    setForm({ name: '', login: '', email: '', role: 'operator', password: '' });
    setShowAdd(false);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Сотрудники" subtitle="Управление учётными записями и ролями">
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Icon name="UserPlus" size={15} className="mr-1.5" /> Добавить сотрудника
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Всего', value: employees.length, color: 'text-foreground' },
            { label: 'Онлайн', value: employees.filter(e => e.status === 'online').length, color: 'text-green-600' },
            { label: 'Заняты', value: employees.filter(e => e.status === 'busy').length, color: 'text-amber-600' },
            { label: 'Не в сети', value: employees.filter(e => e.status === 'offline' || e.status === 'away').length, color: 'text-gray-500' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4 max-w-xs">
          <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Поиск сотрудников..." className="pl-8 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Сотрудник</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Логин</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Роль</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Статус</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Сегодня</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">С системы</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {emp.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{emp.login}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor(emp.role)}`}>
                      {getRoleLabel(emp.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${statusDot[emp.status]}`} />
                      <span className="text-xs text-muted-foreground">{statusLabel[emp.status]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {emp.chatsToday} чатов · {emp.resolvedToday} решено
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{emp.createdAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded">
                        <Icon name="Pencil" size={14} />
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded">
                        <Icon name="Trash2" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить сотрудника</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>ФИО</Label>
              <Input placeholder="Иванов Иван Иванович" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Логин</Label>
                <Input placeholder="i.ivanov" value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Пароль</Label>
                <Input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="email@company.ru" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Роль</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as UserRole }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">Оператор</SelectItem>
                  <SelectItem value="okk">ОКК</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Отмена</Button>
            <Button onClick={handleAdd} disabled={!form.name || !form.login || !form.password}>
              <Icon name="UserPlus" size={15} className="mr-1.5" /> Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
