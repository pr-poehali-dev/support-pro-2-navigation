import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Chat {
  id: string;
  client: string;
  subject: string;
  lastMessage: string;
  time: string;
  status: 'open' | 'pending' | 'resolved';
  priority: 'high' | 'medium' | 'low';
  operator?: string;
  unread?: number;
  channel: 'web' | 'telegram' | 'whatsapp';
}

interface Message {
  id: string;
  text: string;
  from: 'client' | 'operator';
  time: string;
}

const CHATS: Chat[] = [
  { id: '001', client: 'Иван Петров', subject: 'Ошибка при оплате', lastMessage: 'Не могу оплатить заказ, выдаёт ошибку 403', time: '2 мин', status: 'open', priority: 'high', operator: 'Я', unread: 2, channel: 'web' },
  { id: '002', client: 'ООО Техпром', subject: 'Вопрос по договору', lastMessage: 'Когда будет готов счёт на оплату?', time: '15 мин', status: 'pending', priority: 'medium', channel: 'telegram' },
  { id: '003', client: 'Мария Соколова', subject: 'Возврат средств', lastMessage: 'Хочу вернуть деньги за подписку', time: '27 мин', status: 'open', priority: 'high', channel: 'web', unread: 1 },
  { id: '004', client: 'Алексей Новиков', subject: 'Технические вопросы', lastMessage: 'Спасибо, проблема решена!', time: '1 ч', status: 'resolved', priority: 'low', channel: 'whatsapp' },
  { id: '005', client: 'Елена Кузнецова', subject: 'Смена тарифа', lastMessage: 'Как перейти на бизнес-план?', time: '2 ч', status: 'open', priority: 'medium', channel: 'telegram' },
];

const DEMO_MESSAGES: Message[] = [
  { id: '1', text: 'Здравствуйте! Не могу оплатить заказ, выдаёт ошибку 403', from: 'client', time: '14:02' },
  { id: '2', text: 'Добрый день, Иван! Понял вашу проблему. Сейчас разберёмся.', from: 'operator', time: '14:03' },
  { id: '3', text: 'Можете сказать, какой браузер используете и какой способ оплаты выбрали?', from: 'operator', time: '14:03' },
  { id: '4', text: 'Chrome, оплата картой Visa', from: 'client', time: '14:05' },
  { id: '5', text: 'Попробуйте очистить кеш браузера (Ctrl+Shift+Del) и повторить оплату', from: 'operator', time: '14:06' },
];

const statusBadge: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 border-blue-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
};
const statusLabel: Record<string, string> = { open: 'Открыт', pending: 'Ожидает', resolved: 'Решён' };

const priorityIcon: Record<string, string> = { high: 'text-red-500', medium: 'text-amber-500', low: 'text-gray-400' };

const channelIcon: Record<string, string> = { web: 'Globe', telegram: 'Send', whatsapp: 'MessageCircle' };

const TEMPLATES = [
  'Здравствуйте! Чем могу помочь?',
  'Понял вашу проблему, сейчас разберёмся.',
  'Для решения вопроса, пожалуйста, уточните...',
  'Проблема зафиксирована и передана специалисту.',
  'Спасибо за обращение! Всего доброго.',
];

export default function ChatsPage() {
  const [selected, setSelected] = useState<Chat | null>(CHATS[0]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [showTemplates, setShowTemplates] = useState(false);

  const filtered = CHATS.filter(c => {
    const matchSearch = c.client.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), text: message, from: 'operator', time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }]);
    setMessage('');
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Чаты" subtitle="Управление обращениями клиентов">
        <Button size="sm">
          <Icon name="Plus" size={15} className="mr-1.5" /> Новый чат
        </Button>
      </PageHeader>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat list */}
        <div className="w-80 flex-shrink-0 border-r flex flex-col bg-white">
          <div className="p-3 space-y-2 border-b">
            <div className="relative">
              <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Поиск..." className="pl-8 h-8 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1">
              {['all', 'open', 'pending', 'resolved'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${filterStatus === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                  {s === 'all' ? 'Все' : statusLabel[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y">
            {filtered.map(chat => (
              <div
                key={chat.id}
                onClick={() => setSelected(chat)}
                className={`p-3 cursor-pointer transition-colors hover:bg-muted/40 ${selected?.id === chat.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon name={channelIcon[chat.channel]} size={12} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">{chat.client}</span>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{chat.time}</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{chat.subject}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                  {chat.unread ? (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 ml-1">{chat.unread}</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${statusBadge[chat.status]}`}>{statusLabel[chat.status]}</span>
                  <Icon name="Flag" size={11} className={priorityIcon[chat.priority]} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat window */}
        {selected ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b bg-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">{selected.client}</h3>
                <p className="text-xs text-muted-foreground">{selected.subject}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs border ${statusBadge[selected.status]}`}>{statusLabel[selected.status]}</Badge>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <Icon name="UserPlus" size={13} className="mr-1" /> Назначить
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50">
                  <Icon name="CheckCircle2" size={13} className="mr-1" /> Решить
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-muted/20">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.from === 'operator' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${msg.from === 'operator' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-white border rounded-bl-sm'}`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.from === 'operator' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t bg-white">
              {showTemplates && (
                <div className="mb-2 p-2 bg-muted/50 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1.5 font-medium">Шаблоны ответов</p>
                  <div className="space-y-1">
                    {TEMPLATES.map(t => (
                      <button key={t} onClick={() => { setMessage(t); setShowTemplates(false); }} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-white transition-colors truncate">
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setShowTemplates(s => !s)} className="text-muted-foreground hover:text-foreground transition-colors p-2">
                  <Icon name="LayoutList" size={18} />
                </button>
                <Input
                  placeholder="Введите сообщение..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!message.trim()}>
                  <Icon name="Send" size={16} />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Icon name="MessageSquare" size={40} className="mx-auto mb-2 opacity-30" />
              <p>Выберите чат</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
