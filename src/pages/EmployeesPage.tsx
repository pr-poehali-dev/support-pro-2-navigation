import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { getRoleLabel, getRoleBadgeColor, type UserRole } from '@/lib/auth';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Employee {
  id: string;
  name: string;
  login: string;
  email: string;
  role: UserRole;
  status: string;
  createdAt: string;
}

const statusLabel: Record<string, string> = { online: 'Онлайн', busy: 'Занят', away: 'Отошёл', offline: 'Не в сети' };
const statusDot: Record<string, string> = { online: 'dot-online', busy: 'dot-busy', away: 'dot-away', offline: 'dot-offline' };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [form, setForm] = useState({ name: '', login: '', email: '', role: 'operator' as UserRole, password: '' });
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'operator' as UserRole, password: '' });

  const load = async () => {
    setLoading(true);
    const res = await api.users.list();
    if (res.ok) { const data = await res.json(); setEmployees(data.users || []); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.login || !form.password) return;
    setSaving(true);
    const res = await api.users.create(form);
    const data = await res.json();
    if (res.ok) { toast.success('Сотрудник создан'); setForm({ name: '', login: '', email: '', role: 'operator', password: '' }); setShowAdd(false); load(); }
    else toast.error(data.error || 'Ошибка создания');
    setSaving(false);
  };

  const handleEdit = async () => {
    if (!editEmp) return;
    setSaving(true);
    const payload: Record<string, string> = { name: editForm.name, email: editForm.email, role: editForm.role };
    if (editForm.password) payload.password = editForm.password;
    const res = await api.users.update(editEmp.id, payload);
    if (res.ok) { toast.success('Данные обновлены'); setEditEmp(null); load(); }
    else toast.error('Ошибка обновления');
    setSaving(false);
  };

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.login.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Сотрудники" subtitle="Управление учётными записями и ролями">
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Icon name="UserPlus" size={15} className="mr-1.5" /> Добавить
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />) : (
            [
              { label: 'Всего', value: employees.length, color: 'text-foreground' },
              { label: 'Онлайн', value: employees.filter(e => e.status === 'online').length, color: 'text-green-600' },
              { label: 'Заняты', value: employees.filter(e => e.status === 'busy').length, color: 'text-amber-600' },
              { label: 'Не в сети', value: employees.filter(e => e.status === 'offline' || e.status === 'away').length, color: 'text-gray-500' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))
          )}
        </div>

        <div className="relative mb-4 max-w-xs">
          <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Поиск..." className="pl-8 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Сотрудник</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Логин</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Роль</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Статус</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Добавлен</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3"><Skeleton className="h-8" /></td></tr>
              )) : filtered.map(emp => (
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
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor(emp.role)}`}>{getRoleLabel(emp.role)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${statusDot[emp.status] || 'dot-offline'}`} />
                      <span className="text-xs text-muted-foreground">{statusLabel[emp.status] || emp.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(emp.createdAt).toLocaleDateString('ru-RU')}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setEditEmp(emp); setEditForm({ name: emp.name, email: emp.email, role: emp.role, password: '' }); }}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded">
                      <Icon name="Pencil" size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Добавить сотрудника</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>ФИО</Label><Input placeholder="Иванов Иван" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Логин</Label><Input placeholder="i.ivanov" value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Пароль</Label><Input type="password" placeholder="••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" placeholder="email@company.ru" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Роль</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as UserRole }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Button onClick={handleAdd} disabled={!form.name || !form.login || !form.password || saving}>
              {saving && <Icon name="Loader2" size={15} className="animate-spin mr-1.5" />} Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editEmp} onOpenChange={v => !v && setEditEmp(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Редактировать: {editEmp?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>ФИО</Label><Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Роль</Label>
              <Select value={editForm.role} onValueChange={v => setEditForm(f => ({ ...f, role: v as UserRole }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">Оператор</SelectItem>
                  <SelectItem value="okk">ОКК</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Новый пароль <span className="text-muted-foreground text-xs">(не обязательно)</span></Label>
              <Input type="password" placeholder="••••••" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEmp(null)}>Отмена</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving && <Icon name="Loader2" size={15} className="animate-spin mr-1.5" />} Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
