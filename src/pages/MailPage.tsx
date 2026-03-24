import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Email {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  time: string;
  read: boolean;
  folder: 'inbox' | 'sent' | 'archive' | 'spam';
  tag?: string;
}

const EMAILS: Email[] = [
  { id: '1', from: 'Иван Петров', fromEmail: 'ivan@example.com', subject: 'Проблема с доступом к личному кабинету', preview: 'Здравствуйте, не могу войти в личный кабинет уже 2 часа...', time: '14:32', read: false, folder: 'inbox', tag: 'Техподдержка' },
  { id: '2', from: 'ООО Техпром', fromEmail: 'info@techprom.ru', subject: 'Запрос коммерческого предложения', preview: 'Добрый день, нас интересует тарифный план для команды из 50 человек...', time: '13:15', read: false, folder: 'inbox', tag: 'Продажи' },
  { id: '3', from: 'Мария Соколова', fromEmail: 'maria@gmail.com', subject: 'Возврат средств за подписку', preview: 'Хотела бы оформить возврат за прошлый месяц...', time: 'Вчера', read: true, folder: 'inbox', tag: 'Финансы' },
  { id: '4', from: 'noreply@stripe.com', fromEmail: 'noreply@stripe.com', subject: 'Payment failed - action required', preview: 'Your payment of $49.99 was declined...', time: 'Вчера', read: true, folder: 'inbox' },
  { id: '5', from: 'Алексей Новиков', fromEmail: 'a.novikov@corp.com', subject: 'Re: Настройка интеграции', preview: 'Спасибо, всё заработало!', time: 'Пн', read: true, folder: 'inbox' },
];

const FOLDERS = [
  { key: 'inbox', label: 'Входящие', icon: 'Inbox', count: 2 },
  { key: 'sent', label: 'Отправленные', icon: 'Send' },
  { key: 'archive', label: 'Архив', icon: 'Archive' },
  { key: 'spam', label: 'Спам', icon: 'AlertOctagon' },
];

const TAG_COLORS: Record<string, string> = {
  'Техподдержка': 'bg-blue-100 text-blue-700',
  'Продажи': 'bg-green-100 text-green-700',
  'Финансы': 'bg-purple-100 text-purple-700',
};

export default function MailPage() {
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [selected, setSelected] = useState<Email | null>(EMAILS[0]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'corporate' | 'personal'>('corporate');

  const filtered = EMAILS.filter(e =>
    e.folder === activeFolder &&
    (e.from.toLowerCase().includes(search.toLowerCase()) || e.subject.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Почта" subtitle="Корпоративная и личная почта">
        <Button size="sm">
          <Icon name="Pencil" size={15} className="mr-1.5" /> Написать
        </Button>
      </PageHeader>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-52 flex-shrink-0 border-r bg-white flex flex-col">
          <div className="p-3 border-b">
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'corporate' | 'personal')}>
              <TabsList className="w-full h-8">
                <TabsTrigger value="corporate" className="flex-1 text-xs">Корп.</TabsTrigger>
                <TabsTrigger value="personal" className="flex-1 text-xs">Личная</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {activeTab === 'corporate' ? (
            <nav className="p-2 space-y-0.5">
              {FOLDERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFolder(f.key)}
                  className={`sidebar-item w-full ${activeFolder === f.key ? 'active' : ''}`}
                  style={{ color: activeFolder === f.key ? 'hsl(var(--primary))' : 'hsl(220,15%,35%)' }}
                >
                  <Icon name={f.icon} size={16} />
                  <span className="flex-1 text-left">{f.label}</span>
                  {f.count ? <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">{f.count}</span> : null}
                </button>
              ))}
            </nav>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              <Icon name="Mail" size={32} className="text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">Подключите личную почту в настройках профиля</p>
              <Button size="sm" variant="outline" className="mt-3 text-xs h-7">
                <Icon name="Plus" size={12} className="mr-1" /> Подключить
              </Button>
            </div>
          )}
        </div>

        {/* Email list */}
        <div className="w-72 flex-shrink-0 border-r flex flex-col bg-white">
          <div className="p-3 border-b">
            <div className="relative">
              <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Поиск писем..." className="pl-8 h-8 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y">
            {filtered.map(email => (
              <div
                key={email.id}
                onClick={() => setSelected(email)}
                className={`p-3 cursor-pointer hover:bg-muted/40 transition-colors ${selected?.id === email.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-sm truncate ${email.read ? 'font-normal text-muted-foreground' : 'font-semibold text-foreground'}`}>{email.from}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{email.time}</span>
                </div>
                <p className={`text-xs truncate mb-1 ${email.read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>{email.subject}</p>
                <div className="flex items-center gap-1.5">
                  {!email.read && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                  <p className="text-xs text-muted-foreground truncate">{email.preview}</p>
                </div>
                {email.tag && (
                  <span className={`mt-1.5 inline-block text-xs px-1.5 py-0.5 rounded-full font-medium ${TAG_COLORS[email.tag] || 'bg-gray-100 text-gray-600'}`}>{email.tag}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Email view */}
        {selected ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b bg-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold">{selected.subject}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{selected.from} &lt;{selected.fromEmail}&gt;</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Icon name="Reply" size={13} className="mr-1" /> Ответить
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Icon name="Forward" size={13} className="mr-1" /> Переслать
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Icon name="Archive" size={13} className="mr-1" /> Архив
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl">
                <div className="prose prose-sm text-foreground">
                  <p>{selected.preview}</p>
                  <p className="mt-4">Ждём вашего ответа.</p>
                  <p className="mt-4">С уважением,<br />{selected.from}</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-white">
              <div className="border rounded-lg p-3">
                <Input placeholder="Написать ответ..." className="border-0 shadow-none p-0 text-sm focus-visible:ring-0" />
                <div className="flex items-center justify-between mt-2 pt-2 border-t">
                  <div className="flex gap-2">
                    <button className="text-muted-foreground hover:text-foreground"><Icon name="Paperclip" size={16} /></button>
                    <button className="text-muted-foreground hover:text-foreground"><Icon name="LayoutList" size={16} /></button>
                  </div>
                  <Button size="sm" className="h-7 text-xs">
                    <Icon name="Send" size={13} className="mr-1" /> Отправить
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Icon name="Mail" size={40} className="mx-auto mb-2 opacity-30" />
              <p>Выберите письмо</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
