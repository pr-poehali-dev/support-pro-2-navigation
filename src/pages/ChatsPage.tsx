import { useState, useEffect, useRef } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Chat {
  id: string;
  clientName: string;
  clientEmail?: string;
  subject: string;
  status: string;
  priority: string;
  operatorId?: string;
  operatorName?: string;
  channel: string;
  clientToken?: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  unreadCount: number;
}

interface Message {
  id: string;
  chatId: string;
  senderType: string;
  senderId?: string;
  senderName: string;
  text: string;
  createdAt: string;
}

const statusBadge: Record<string, string> = { open: 'bg-blue-100 text-blue-700 border-blue-200', pending: 'bg-amber-100 text-amber-700 border-amber-200', resolved: 'bg-green-100 text-green-700 border-green-200', closed: 'bg-gray-100 text-gray-600 border-gray-200' };
const statusLabel: Record<string, string> = { open: 'Открыт', pending: 'Ожидает', resolved: 'Решён', closed: 'Закрыт' };
const priorityIcon: Record<string, string> = { high: 'text-red-500', medium: 'text-amber-500', low: 'text-gray-400' };
const channelIcon: Record<string, string> = { web: 'Globe', telegram: 'Send', whatsapp: 'MessageCircle', email: 'Mail' };

const TEMPLATES = [
  'Здравствуйте! Чем могу помочь?',
  'Понял вашу проблему, сейчас разберёмся.',
  'Для решения вопроса, пожалуйста, уточните...',
  'Проблема зафиксирована и передана специалисту.',
  'Спасибо за обращение! Всего доброго.',
];

export default function ChatsPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selected, setSelected] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [message, setMessage] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [operators, setOperators] = useState<{ id: string; name: string }[]>([]);
  const [assignTo, setAssignTo] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMsgTimeRef = useRef<string>('');

  const loadChats = async () => {
    const params = filterStatus !== 'all' ? { status: filterStatus } : undefined;
    const res = await api.chats.list(params);
    if (res.ok) {
      const data = await res.json();
      setChats(data.chats || []);
    }
    setLoadingChats(false);
  };

  const loadMessages = async (chatId: string) => {
    setLoadingMsgs(true); lastMsgTimeRef.current = '';
    const res = await api.messages.list(chatId);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages || []);
      if (data.messages?.length) lastMsgTimeRef.current = data.messages[data.messages.length - 1].createdAt;
    }
    setLoadingMsgs(false);
  };

  const pollMessages = async (chatId: string) => {
    if (!lastMsgTimeRef.current) return;
    const res = await api.messages.list(chatId, lastMsgTimeRef.current);
    if (res.ok) {
      const data = await res.json();
      if (data.messages?.length) {
        setMessages(prev => [...prev, ...data.messages]);
        lastMsgTimeRef.current = data.messages[data.messages.length - 1].createdAt;
      }
    }
  };

  useEffect(() => { loadChats(); }, [filterStatus]);

  useEffect(() => {
    if (!selected) return;
    loadMessages(selected.id);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => pollMessages(selected.id), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selected?.id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadOperators = async () => {
    const res = await api.users.list();
    if (res.ok) {
      const data = await res.json();
      setOperators((data.users || []).filter((u: { role: string }) => u.role === 'operator'));
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !selected) return;
    setSending(true);
    const res = await api.messages.send(selected.id, message.trim());
    if (res.ok) {
      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
      lastMsgTimeRef.current = data.message.createdAt;
      setMessage('');
      loadChats();
    } else toast.error('Не удалось отправить');
    setSending(false);
  };

  const handleStatusChange = async (status: string) => {
    if (!selected) return;
    const res = await api.chats.update(selected.id, { status });
    if (res.ok) {
      setSelected(prev => prev ? { ...prev, status } : prev);
      setChats(prev => prev.map(c => c.id === selected.id ? { ...c, status } : c));
      toast.success(`Статус: ${statusLabel[status]}`);
    } else toast.error('Ошибка');
  };

  const handleAssign = async () => {
    if (!selected || !assignTo) return;
    const op = operators.find(o => o.id === assignTo);
    const res = await api.chats.update(selected.id, { operator_id: assignTo });
    if (res.ok) {
      setSelected(prev => prev ? { ...prev, operatorId: assignTo, operatorName: op?.name } : prev);
      setChats(prev => prev.map(c => c.id === selected.id ? { ...c, operatorId: assignTo, operatorName: op?.name } : c));
      toast.success(`Назначен: ${op?.name}`); setShowAssign(false);
    } else toast.error('Ошибка назначения');
  };

  const handlePriorityChange = async (priority: string) => {
    if (!selected) return;
    const res = await api.chats.update(selected.id, { priority });
    if (res.ok) {
      setSelected(prev => prev ? { ...prev, priority } : prev);
      setChats(prev => prev.map(c => c.id === selected.id ? { ...c, priority } : c));
    }
  };

  const filtered = chats.filter(c =>
    c.clientName.toLowerCase().includes(search.toLowerCase()) ||
    c.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Чаты" subtitle="Обращения клиентов">
        <button onClick={loadChats} className="text-muted-foreground hover:text-foreground p-1.5 rounded" title="Обновить">
          <Icon name="RefreshCw" size={15} />
        </button>
      </PageHeader>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 flex-shrink-0 border-r flex flex-col bg-white">
          <div className="p-3 space-y-2 border-b">
            <div className="relative">
              <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Поиск..." className="pl-8 h-8 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1 flex-wrap">
              {['all', 'open', 'pending', 'resolved'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${filterStatus === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                  {s === 'all' ? 'Все' : statusLabel[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y">
            {loadingChats ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-3"><Skeleton className="h-16" /></div>) :
              filtered.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  <Icon name="MessageSquare" size={28} className="mx-auto mb-2 opacity-30" />
                  {chats.length === 0 ? 'Нет обращений. Дайте ссылку клиентам на /client' : 'Ничего не найдено'}
                </div>
              ) : filtered.map(chat => (
                <div key={chat.id} onClick={() => setSelected(chat)}
                  className={`p-3 cursor-pointer hover:bg-muted/40 transition-colors ${selected?.id === chat.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon name={channelIcon[chat.channel] || 'Globe'} size={12} className="text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium truncate">{chat.clientName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{new Date(chat.updatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{chat.subject}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate">{chat.lastMessage || 'Нет сообщений'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${statusBadge[chat.status] || ''}`}>{statusLabel[chat.status] || chat.status}</span>
                    <Icon name="Flag" size={11} className={priorityIcon[chat.priority] || 'text-gray-400'} />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {selected ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b bg-white flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-sm font-semibold">{selected.clientName}</h3>
                <p className="text-xs text-muted-foreground">{selected.subject}{selected.clientEmail ? ` · ${selected.clientEmail}` : ''}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`text-xs border ${statusBadge[selected.status] || ''}`}>{statusLabel[selected.status] || selected.status}</Badge>
                {selected.operatorName && <span className="text-xs text-muted-foreground">→ {selected.operatorName}</span>}
                <Select value={selected.priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 Высокий</SelectItem>
                    <SelectItem value="medium">🟡 Средний</SelectItem>
                    <SelectItem value="low">🟢 Низкий</SelectItem>
                  </SelectContent>
                </Select>
                {(user?.role === 'admin' || user?.role === 'okk') && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { loadOperators(); setShowAssign(true); }}>
                    <Icon name="UserPlus" size={13} className="mr-1" /> Назначить
                  </Button>
                )}
                {selected.status !== 'resolved' ? (
                  <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusChange('resolved')}>
                    <Icon name="CheckCircle2" size={13} className="mr-1" /> Решить
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleStatusChange('open')}>
                    <Icon name="RotateCcw" size={13} className="mr-1" /> Переоткрыть
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-muted/20">
              {loadingMsgs ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <Skeleton className="h-14 w-64 rounded-2xl" />
                </div>
              )) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Нет сообщений</div>
              ) : messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderType === 'operator' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${msg.senderType === 'operator' ? 'bg-primary text-primary-foreground rounded-br-sm' : msg.senderType === 'system' ? 'bg-muted text-muted-foreground text-xs italic px-3 py-1.5' : 'bg-white border rounded-bl-sm'}`}>
                    {msg.senderType === 'client' && <p className="text-xs font-semibold mb-0.5 opacity-70">{msg.senderName}</p>}
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.senderType === 'operator' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t bg-white">
              {showTemplates && (
                <div className="mb-2 p-2 bg-muted/50 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1.5 font-medium">Шаблоны ответов</p>
                  <div className="space-y-1">
                    {TEMPLATES.map(t => (
                      <button key={t} onClick={() => { setMessage(t); setShowTemplates(false); }} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-white transition-colors">{t}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setShowTemplates(s => !s)} className="text-muted-foreground hover:text-foreground p-2">
                  <Icon name="LayoutList" size={18} />
                </button>
                <Input placeholder="Введите сообщение..." value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  className="flex-1" disabled={sending} />
                <Button onClick={handleSend} disabled={!message.trim() || sending}>
                  {sending ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Icon name="MessageSquare" size={40} className="mx-auto mb-2 opacity-30" />
              <p className="mb-2">Выберите чат из списка</p>
              <p className="text-xs">Клиенты пишут через страницу <span className="font-mono bg-muted px-1 rounded">/client</span></p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Назначить оператора</DialogTitle></DialogHeader>
          <Select value={assignTo} onValueChange={setAssignTo}>
            <SelectTrigger><SelectValue placeholder="Выберите оператора" /></SelectTrigger>
            <SelectContent>
              {operators.map(op => <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssign(false)}>Отмена</Button>
            <Button onClick={handleAssign} disabled={!assignTo}>Назначить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
