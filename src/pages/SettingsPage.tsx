import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [sla, setSla] = useState({ firstResponse: '5', resolution: '240', escalation: '30' });
  const [notify, setNotify] = useState({ newChat: true, newMessage: true, slaWarning: true, email: false });
  const [dist, setDist] = useState({ mode: 'auto', maxPerOperator: '5' });
  const [corp, setCorp] = useState({ host: '', port: '465', user: '', password: '', from: '' });

  const save = (section: string) => toast.success(`${section} сохранены`);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Настройки системы" subtitle="Конфигурация Support Pro 2" />

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="sla" className="max-w-3xl">
          <TabsList className="mb-6">
            <TabsTrigger value="sla">SLA</TabsTrigger>
            <TabsTrigger value="distribution">Распределение</TabsTrigger>
            <TabsTrigger value="notifications">Уведомления</TabsTrigger>
            <TabsTrigger value="mail">Корп. почта</TabsTrigger>
          </TabsList>

          {/* SLA */}
          <TabsContent value="sla" className="space-y-6">
            <div className="bg-white rounded-xl border p-6 space-y-5">
              <h3 className="text-sm font-semibold">Соглашения об уровне обслуживания</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label>Время первого ответа (мин)</Label>
                  <Input type="number" value={sla.firstResponse} onChange={e => setSla(s => ({ ...s, firstResponse: e.target.value }))} />
                  <p className="text-xs text-muted-foreground">Максимальное время до первого ответа оператора</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Время решения (мин)</Label>
                  <Input type="number" value={sla.resolution} onChange={e => setSla(s => ({ ...s, resolution: e.target.value }))} />
                  <p className="text-xs text-muted-foreground">Максимальное время закрытия обращения</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Эскалация при просрочке (мин)</Label>
                  <Input type="number" value={sla.escalation} onChange={e => setSla(s => ({ ...s, escalation: e.target.value }))} />
                  <p className="text-xs text-muted-foreground">Через сколько минут уведомить ОКК при нарушении SLA</p>
                </div>
              </div>
              <Button size="sm" onClick={() => save('Настройки SLA')}>
                <Icon name="Save" size={14} className="mr-1.5" /> Сохранить
              </Button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <Icon name="AlertTriangle" size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">При нарушении SLA система автоматически уведомит сотрудников ОКК и создаст запись в отчёте</p>
            </div>
          </TabsContent>

          {/* Distribution */}
          <TabsContent value="distribution">
            <div className="bg-white rounded-xl border p-6 space-y-5">
              <h3 className="text-sm font-semibold">Автоматическое распределение обращений</h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Режим распределения</Label>
                  <Select value={dist.mode} onValueChange={v => setDist(d => ({ ...d, mode: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Автоматически (по нагрузке)</SelectItem>
                      <SelectItem value="round">По очереди (Round Robin)</SelectItem>
                      <SelectItem value="skill">По компетенции</SelectItem>
                      <SelectItem value="manual">Вручную</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Максимум чатов на оператора</Label>
                  <Input type="number" value={dist.maxPerOperator} onChange={e => setDist(d => ({ ...d, maxPerOperator: e.target.value }))} className="max-w-xs" />
                </div>
                <div className="flex items-center justify-between py-2 border rounded-lg px-4">
                  <div>
                    <p className="text-sm font-medium">Учитывать компетенции</p>
                    <p className="text-xs text-muted-foreground">Направлять обращения к операторам с нужными навыками</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-2 border rounded-lg px-4">
                  <div>
                    <p className="text-sm font-medium">Приоритет онлайн-операторов</p>
                    <p className="text-xs text-muted-foreground">Не назначать чаты операторам со статусом «Занят»</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <Button size="sm" onClick={() => save('Настройки распределения')}>
                <Icon name="Save" size={14} className="mr-1.5" /> Сохранить
              </Button>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <h3 className="text-sm font-semibold">Системные уведомления</h3>
              {[
                { key: 'newChat', label: 'Новое обращение', desc: 'При поступлении нового чата или письма' },
                { key: 'newMessage', label: 'Новое сообщение', desc: 'При новом сообщении в назначенном чате' },
                { key: 'slaWarning', label: 'Угроза нарушения SLA', desc: 'За 5 минут до истечения SLA' },
                { key: 'email', label: 'Email-уведомления', desc: 'Дублировать уведомления на почту' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notify[item.key as keyof typeof notify]}
                    onCheckedChange={v => setNotify(n => ({ ...n, [item.key]: v }))}
                  />
                </div>
              ))}
              <Button size="sm" onClick={() => save('Настройки уведомлений')}>
                <Icon name="Save" size={14} className="mr-1.5" /> Сохранить
              </Button>
            </div>
          </TabsContent>

          {/* Corporate mail */}
          <TabsContent value="mail">
            <div className="bg-white rounded-xl border p-6 space-y-5">
              <div>
                <h3 className="text-sm font-semibold">Корпоративная почта (SMTP)</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Настраивается администратором системы. Операторы получат доступ после подключения.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>SMTP-сервер</Label>
                  <Input placeholder="smtp.company.ru" value={corp.host} onChange={e => setCorp(c => ({ ...c, host: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Порт</Label>
                  <Input placeholder="465" value={corp.port} onChange={e => setCorp(c => ({ ...c, port: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Логин</Label>
                  <Input placeholder="support@company.ru" value={corp.user} onChange={e => setCorp(c => ({ ...c, user: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Пароль</Label>
                  <Input type="password" placeholder="••••••••" value={corp.password} onChange={e => setCorp(c => ({ ...c, password: e.target.value }))} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Имя отправителя</Label>
                  <Input placeholder="Служба поддержки" value={corp.from} onChange={e => setCorp(c => ({ ...c, from: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => save('Настройки почты')}>
                  <Icon name="Save" size={14} className="mr-1.5" /> Сохранить
                </Button>
                <Button size="sm" variant="outline" onClick={() => toast.info('Тестовое письмо отправлено')}>
                  <Icon name="Send" size={14} className="mr-1.5" /> Тест подключения
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
