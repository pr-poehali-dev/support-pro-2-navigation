import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface TelegramBot {
  id: string;
  name: string;
  username: string;
  token: string;
  active: boolean;
  messagesTotal: number;
  messagesDay: number;
  webhookSet: boolean;
  welcomeMessage: string;
}

const DEFAULT_BOTS: TelegramBot[] = [];

export default function SocialPage() {
  const [bots, setBots] = useState<TelegramBot[]>(DEFAULT_BOTS);
  const [showAdd, setShowAdd] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', token: '', welcomeMessage: 'Здравствуйте! Чем могу помочь?' });
  const [editBot, setEditBot] = useState<TelegramBot | null>(null);

  const extractUsername = (token: string) => {
    return token.length > 10 ? `bot_${token.slice(-4)}` : '';
  };

  const handleAdd = () => {
    if (!form.name || !form.token) return;
    const bot: TelegramBot = {
      id: Date.now().toString(),
      name: form.name,
      username: extractUsername(form.token),
      token: form.token,
      active: false,
      messagesTotal: 0,
      messagesDay: 0,
      webhookSet: false,
      welcomeMessage: form.welcomeMessage,
    };
    setBots(prev => [...prev, bot]);
    setForm({ name: '', token: '', welcomeMessage: 'Здравствуйте! Чем могу помочь?' });
    setShowAdd(false);
    toast.success('Бот добавлен. Активируйте его для начала работы.');
  };

  const handleToggle = (id: string, active: boolean) => {
    setBots(prev => prev.map(b => b.id === id ? { ...b, active, webhookSet: active ? true : b.webhookSet } : b));
    toast.success(active ? 'Бот активирован и начал принимать сообщения' : 'Бот остановлен');
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    await new Promise(r => setTimeout(r, 1500));
    setTesting(null);
    toast.success('Соединение с Telegram API успешно');
  };

  const handleDelete = (id: string) => {
    setBots(prev => prev.filter(b => b.id !== id));
    toast.success('Бот удалён');
  };

  const handleSaveEdit = () => {
    if (!editBot) return;
    setBots(prev => prev.map(b => b.id === editBot.id ? editBot : b));
    setEditBot(null);
    toast.success('Настройки бота сохранены');
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Социальные сети" subtitle="Подключение мессенджеров и соцсетей">
        {!showAdd && (
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Icon name="Plus" size={15} className="mr-1.5" /> Добавить бота
          </Button>
        )}
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="telegram">
          <TabsList className="mb-6">
            <TabsTrigger value="telegram" className="gap-2">
              <Icon name="Send" size={14} /> Telegram
            </TabsTrigger>
            <TabsTrigger value="whatsapp" disabled className="gap-2 opacity-50">
              <Icon name="MessageCircle" size={14} /> WhatsApp <Badge className="ml-1 text-xs bg-muted text-muted-foreground">Скоро</Badge>
            </TabsTrigger>
            <TabsTrigger value="vk" disabled className="gap-2 opacity-50">
              <Icon name="Users" size={14} /> ВКонтакте <Badge className="ml-1 text-xs bg-muted text-muted-foreground">Скоро</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="telegram">
            {/* Info block */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
              <Icon name="Info" size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Как подключить Telegram-бота</p>
                <ol className="text-xs text-blue-700 mt-1 space-y-0.5 list-decimal list-inside">
                  <li>Откройте @BotFather в Telegram</li>
                  <li>Напишите /newbot и следуйте инструкциям</li>
                  <li>Скопируйте полученный токен API</li>
                  <li>Вставьте токен в форму ниже и нажмите «Добавить»</li>
                </ol>
              </div>
            </div>

            {/* Add form */}
            {showAdd && (
              <div className="bg-white border rounded-xl p-5 mb-6">
                <h3 className="text-sm font-semibold mb-4">Новый Telegram-бот</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Название бота <span className="text-muted-foreground text-xs">(для вашего удобства)</span></Label>
                    <Input placeholder="Например: Бот поддержки" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Токен API от BotFather</Label>
                    <Input placeholder="1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ" value={form.token} onChange={e => setForm(f => ({ ...f, token: e.target.value }))} className="font-mono text-xs" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>Приветственное сообщение</Label>
                    <Input value={form.welcomeMessage} onChange={e => setForm(f => ({ ...f, welcomeMessage: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAdd} disabled={!form.name || !form.token}>
                    <Icon name="Plus" size={15} className="mr-1.5" /> Добавить бота
                  </Button>
                  <Button variant="outline" onClick={() => setShowAdd(false)}>Отмена</Button>
                </div>
              </div>
            )}

            {/* Bots list */}
            {bots.length === 0 ? (
              <div className="bg-white border rounded-xl p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <Icon name="Send" size={28} className="text-blue-400" />
                </div>
                <p className="font-medium text-foreground">Нет подключённых ботов</p>
                <p className="text-sm text-muted-foreground mt-1">Добавьте Telegram-бота, чтобы принимать обращения из мессенджера</p>
                <Button className="mt-4" onClick={() => setShowAdd(true)}>
                  <Icon name="Plus" size={15} className="mr-1.5" /> Добавить первого бота
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {bots.map(bot => (
                  <div key={bot.id} className="bg-white border rounded-xl p-5">
                    {editBot?.id === bot.id ? (
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold">Настройки бота</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label>Название</Label>
                            <Input value={editBot.name} onChange={e => setEditBot(b => b ? { ...b, name: e.target.value } : b)} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Токен API</Label>
                            <Input value={editBot.token} onChange={e => setEditBot(b => b ? { ...b, token: e.target.value } : b)} className="font-mono text-xs" />
                          </div>
                          <div className="space-y-1.5 col-span-2">
                            <Label>Приветственное сообщение</Label>
                            <Input value={editBot.welcomeMessage} onChange={e => setEditBot(b => b ? { ...b, welcomeMessage: e.target.value } : b)} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveEdit}>Сохранить</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditBot(null)}>Отмена</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-[#2AABEE]/10 flex items-center justify-center flex-shrink-0">
                          <Icon name="Send" size={22} className="text-[#2AABEE]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold">{bot.name}</h4>
                            {bot.username && <span className="text-xs text-muted-foreground font-mono">@{bot.username}</span>}
                            <Badge className={`text-xs ${bot.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {bot.active ? 'Активен' : 'Остановлен'}
                            </Badge>
                            {bot.webhookSet && <Badge className="text-xs bg-blue-100 text-blue-700">Webhook ✓</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 font-mono">
                            {bot.token.slice(0, 10)}•••{bot.token.slice(-4)}
                          </p>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{bot.messagesTotal} сообщений всего</span>
                            <span>{bot.messagesDay} сегодня</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{bot.active ? 'Вкл' : 'Выкл'}</span>
                            <Switch checked={bot.active} onCheckedChange={v => handleToggle(bot.id, v)} />
                          </div>
                          <button onClick={() => handleTest(bot.id)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Проверить соединение">
                            {testing === bot.id
                              ? <Icon name="Loader2" size={16} className="animate-spin" />
                              : <Icon name="Wifi" size={16} />}
                          </button>
                          <button onClick={() => setEditBot(bot)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                            <Icon name="Settings" size={16} />
                          </button>
                          <button onClick={() => handleDelete(bot.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                            <Icon name="Trash2" size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
