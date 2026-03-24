import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/hooks/useAuth';

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  deadline?: string;
  createdAt: string;
  tag?: string;
}

const TASKS: Task[] = [
  { id: '1', title: 'Настроить автоответы', description: 'Создать базовые шаблоны для частых вопросов', assignee: 'Сергей Козлов', priority: 'high', status: 'in_progress', deadline: '25.03.2026', createdAt: '20.03.2026', tag: 'Настройки' },
  { id: '2', title: 'Обучить операторов по SLA', description: 'Провести инструктаж по соглашениям об уровне сервиса', assignee: 'Мария Петрова', priority: 'high', status: 'todo', deadline: '28.03.2026', createdAt: '21.03.2026', tag: 'Обучение' },
  { id: '3', title: 'Проверить статистику за март', description: 'Сформировать отчёт и выявить узкие места', assignee: 'Мария Петрова', priority: 'medium', status: 'todo', createdAt: '22.03.2026', tag: 'Отчёт' },
  { id: '4', title: 'Интеграция с CRM', description: 'Настроить передачу данных из чатов в CRM-систему', assignee: 'Александр Иванов', priority: 'medium', status: 'review', deadline: '30.03.2026', createdAt: '18.03.2026', tag: 'Интеграция' },
  { id: '5', title: 'Добавить FAQ на сайт', description: 'Обновить раздел частых вопросов на портале', assignee: 'Анна Белова', priority: 'low', status: 'done', createdAt: '15.03.2026', tag: 'Контент' },
  { id: '6', title: 'Тестирование Telegram-бота', description: 'Проверить все сценарии общения через бота', assignee: 'Дмитрий Орлов', priority: 'medium', status: 'in_progress', deadline: '26.03.2026', createdAt: '22.03.2026', tag: 'Тест' },
];

const COLUMNS = [
  { key: 'todo', label: 'К выполнению', color: 'bg-gray-100 text-gray-600' },
  { key: 'in_progress', label: 'В работе', color: 'bg-blue-100 text-blue-700' },
  { key: 'review', label: 'На проверке', color: 'bg-amber-100 text-amber-700' },
  { key: 'done', label: 'Готово', color: 'bg-green-100 text-green-700' },
];

const priorityColors: Record<string, string> = {
  high: 'text-red-500',
  medium: 'text-amber-500',
  low: 'text-gray-400',
};
const priorityLabels: Record<string, string> = { high: 'Высокий', medium: 'Средний', low: 'Низкий' };

const tagColors: Record<string, string> = {
  'Настройки': 'bg-blue-100 text-blue-700',
  'Обучение': 'bg-purple-100 text-purple-700',
  'Отчёт': 'bg-amber-100 text-amber-700',
  'Интеграция': 'bg-cyan-100 text-cyan-700',
  'Контент': 'bg-green-100 text-green-700',
  'Тест': 'bg-rose-100 text-rose-700',
};

export default function StackPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'board' | 'list'>('board');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as Task['priority'], deadline: '' });

  const assignees = ['all', ...Array.from(new Set(tasks.map(t => t.assignee)))];

  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchAssignee = filterAssignee === 'all' || t.assignee === filterAssignee;
    return matchSearch && matchAssignee;
  });

  const handleAddTask = () => {
    if (!newTask.title) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      assignee: user?.name || 'Я',
      priority: newTask.priority,
      status: 'todo',
      deadline: newTask.deadline || undefined,
      createdAt: new Date().toLocaleDateString('ru-RU'),
    };
    setTasks(prev => [...prev, task]);
    setNewTask({ title: '', description: '', priority: 'medium', deadline: '' });
    setShowAdd(false);
  };

  const moveTask = (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="STACK" subtitle="Портал заданий и задач">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          <button onClick={() => setView('board')} className={`p-1.5 rounded-md transition-colors ${view === 'board' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}>
            <Icon name="Columns" size={15} />
          </button>
          <button onClick={() => setView('list')} className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}>
            <Icon name="List" size={15} />
          </button>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Icon name="Plus" size={15} className="mr-1.5" /> Задача
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="px-6 py-3 border-b bg-white flex items-center gap-3">
          <div className="relative">
            <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Поиск задач..." className="pl-8 h-8 text-sm w-52" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="h-8 text-sm w-44">
              <SelectValue placeholder="Исполнитель" />
            </SelectTrigger>
            <SelectContent>
              {assignees.map(a => <SelectItem key={a} value={a}>{a === 'all' ? 'Все исполнители' : a}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} задач</span>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="mx-6 mt-4 bg-white border rounded-xl p-4 flex-shrink-0">
            <div className="flex gap-3 items-start">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input placeholder="Название задачи" value={newTask.title} onChange={e => setNewTask(f => ({ ...f, title: e.target.value }))} className="md:col-span-2" />
                <Input placeholder="Описание" value={newTask.description} onChange={e => setNewTask(f => ({ ...f, description: e.target.value }))} />
                <Select value={newTask.priority} onValueChange={v => setNewTask(f => ({ ...f, priority: v as Task['priority'] }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Высокий приоритет</SelectItem>
                    <SelectItem value="medium">Средний приоритет</SelectItem>
                    <SelectItem value="low">Низкий приоритет</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="date" value={newTask.deadline} onChange={e => setNewTask(f => ({ ...f, deadline: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddTask} disabled={!newTask.title}>Создать</Button>
                <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>✕</Button>
              </div>
            </div>
          </div>
        )}

        {/* Board view */}
        {view === 'board' ? (
          <div className="flex-1 overflow-x-auto p-6">
            <div className="flex gap-4 h-full min-w-max">
              {COLUMNS.map(col => {
                const colTasks = filtered.filter(t => t.status === col.key);
                return (
                  <div key={col.key} className="w-72 flex flex-col flex-shrink-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${col.color}`}>{col.label}</span>
                        <span className="text-xs text-muted-foreground">{colTasks.length}</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto">
                      {colTasks.map(task => (
                        <div key={task.id} className="bg-white rounded-xl border p-3.5 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-sm font-medium text-foreground">{task.title}</p>
                            <Icon name="Flag" size={13} className={`${priorityColors[task.priority]} flex-shrink-0 mt-0.5`} />
                          </div>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                          )}
                          {task.tag && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${tagColors[task.tag] || 'bg-gray-100 text-gray-600'}`}>{task.tag}</span>
                          )}
                          <div className="flex items-center justify-between mt-2.5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                {task.assignee.split(' ').map(w => w[0]).slice(0, 2).join('')}
                              </div>
                              <span className="text-xs text-muted-foreground">{task.assignee.split(' ')[0]}</span>
                            </div>
                            {task.deadline && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Icon name="Calendar" size={11} /> {task.deadline}
                              </span>
                            )}
                          </div>
                          {/* Move buttons */}
                          <div className="flex gap-1 mt-2 pt-2 border-t">
                            {COLUMNS.filter(c => c.key !== col.key).map(c => (
                              <button
                                key={c.key}
                                onClick={() => moveTask(task.id, c.key as Task['status'])}
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted"
                              >
                                → {c.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      {colTasks.length === 0 && (
                        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                          <p className="text-xs text-muted-foreground">Нет задач</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-6">
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Задача</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Исполнитель</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Приоритет</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Статус</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Дедлайн</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(task => {
                    const col = COLUMNS.find(c => c.key === task.status)!;
                    return (
                      <tr key={task.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium">{task.title}</p>
                          {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{task.assignee}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${priorityColors[task.priority]}`}>{priorityLabels[task.priority]}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${col.color}`}>{col.label}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{task.deadline || '—'}</td>
                        <td className="px-4 py-3">
                          <Select value={task.status} onValueChange={v => moveTask(task.id, v as Task['status'])}>
                            <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {COLUMNS.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
