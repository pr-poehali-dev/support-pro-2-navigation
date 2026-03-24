import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';

interface Message {
  id: string;
  senderType: string;
  senderName: string;
  text: string;
  createdAt: string;
}

interface ChatInfo {
  id: string;
  clientName: string;
  subject: string;
  status: string;
  operatorName?: string;
}

const STORAGE_KEY = 'sp2_client_session';

function loadSession(): { chatId: string; clientToken: string; clientName: string } | null {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
}
function saveSession(data: { chatId: string; clientToken: string; clientName: string }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const statusLabel: Record<string, string> = { open: 'Открыт', pending: 'Ожидает ответа', resolved: 'Решён', closed: 'Закрыт' };
const statusColor: Record<string, string> = { open: 'text-blue-600', pending: 'text-amber-600', resolved: 'text-green-600', closed: 'text-gray-500' };

export default function ClientPortalPage() {
  const [session, setSession] = useState(loadSession);
  const [chat, setChat] = useState<ChatInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [form, setForm] = useState({ name: '', email: '', subject: '', firstMessage: '' });
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState<'form' | 'chat'>('form');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimeRef = useRef('');

  const loadMessages = async (chatId: string, clientToken: string) => {
    const res = await api.messages.listAsClient(chatId, clientToken);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages || []);
      if (data.messages?.length) lastTimeRef.current = data.messages[data.messages.length - 1].createdAt;
    }
  };

  const pollMessages = async (chatId: string, clientToken: string) => {
    if (!lastTimeRef.current) return;
    const res = await api.messages.listAsClient(chatId, clientToken, lastTimeRef.current);
    if (res.ok) {
      const data = await res.json();
      if (data.messages?.length) {
        setMessages(prev => [...prev, ...data.messages]);
        lastTimeRef.current = data.messages[data.messages.length - 1].createdAt;
      }
    }
  };

  const loadChat = async (chatId: string, clientToken: string) => {
    const res = await api.chats.getByClientToken(clientToken);
    if (res.ok) {
      const data = await res.json();
      setChat(data.chat);
    }
  };

  useEffect(() => {
    if (session) {
      setStep('chat');
      setLoading(true);
      Promise.all([loadMessages(session.chatId, session.clientToken), loadChat(session.chatId, session.clientToken)])
        .finally(() => setLoading(false));
      pollRef.current = setInterval(() => pollMessages(session.chatId, session.clientToken), 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [session?.chatId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleStart = async () => {
    if (!form.name.trim() || !form.firstMessage.trim()) return;
    setLoading(true);
    const res = await api.chats.createFromClient({
      clientName: form.name.trim(),
      clientEmail: form.email.trim() || undefined,
      subject: form.subject.trim() || 'Обращение в поддержку',
      firstMessage: form.firstMessage.trim(),
    });
    if (res.ok) {
      const data = await res.json();
      const sess = { chatId: data.chatId, clientToken: data.clientToken, clientName: form.name.trim() };
      saveSession(sess);
      setSession(sess);
      setStep('chat');
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!text.trim() || !session) return;
    setSending(true);
    const res = await api.messages.sendAsClient(session.chatId, text.trim(), session.clientToken);
    if (res.ok) {
      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
      lastTimeRef.current = data.message.createdAt;
      setText('');
    }
    setSending(false);
  };

  const handleNew = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null); setChat(null); setMessages([]);
    setForm({ name: '', email: '', subject: '', firstMessage: '' });
    setStep('form');
    if (pollRef.current) clearInterval(pollRef.current);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(222,45%,10%)] to-[hsl(222,45%,18%)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[hsl(213,90%,52%)] mb-3 shadow-lg">
            <Icon name="Headphones" size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Служба поддержки</h1>
          <p className="text-[hsl(210,30%,60%)] text-sm mt-0.5">Мы всегда готовы помочь</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ height: step === 'chat' ? '580px' : 'auto' }}>
          {step === 'form' ? (
            <div className="p-6 space-y-4">
              <h2 className="text-base font-semibold">Новое обращение</h2>
              <div className="space-y-1.5">
                <Label>Ваше имя *</Label>
                <Input placeholder="Как вас зовут?" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Email <span className="text-muted-foreground text-xs">(необязательно)</span></Label>
                <Input type="email" placeholder="для получения ответа" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Тема обращения <span className="text-muted-foreground text-xs">(необязательно)</span></Label>
                <Input placeholder="Вкратце опишите вопрос" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Ваш вопрос *</Label>
                <textarea
                  placeholder="Опишите вашу проблему подробнее..."
                  value={form.firstMessage}
                  onChange={e => setForm(f => ({ ...f, firstMessage: e.target.value }))}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
              <Button className="w-full" onClick={handleStart} disabled={!form.name.trim() || !form.firstMessage.trim() || loading}>
                {loading ? <Icon name="Loader2" size={16} className="animate-spin mr-2" /> : <Icon name="Send" size={16} className="mr-2" />}
                {loading ? 'Создаём обращение...' : 'Начать чат'}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{chat?.subject || 'Ваше обращение'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {chat?.status && (
                      <span className={`text-xs font-medium ${statusColor[chat.status] || ''}`}>
                        ● {statusLabel[chat.status] || chat.status}
                      </span>
                    )}
                    {chat?.operatorName && <span className="text-xs text-muted-foreground">· {chat.operatorName}</span>}
                  </div>
                </div>
                <button onClick={handleNew} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <Icon name="Plus" size={13} /> Новое
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
                {loading ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                    <Skeleton className="h-14 w-52 rounded-2xl" />
                  </div>
                )) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    <div className="text-center">
                      <Icon name="Clock" size={28} className="mx-auto mb-2 opacity-30" />
                      <p>Ожидайте, оператор скоро подключится</p>
                    </div>
                  </div>
                ) : messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.senderType === 'client' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${msg.senderType === 'client' ? 'bg-primary text-primary-foreground rounded-br-sm' : msg.senderType === 'system' ? 'bg-muted text-muted-foreground text-xs italic' : 'bg-white border shadow-sm rounded-bl-sm'}`}>
                      {msg.senderType === 'operator' && <p className="text-xs font-semibold mb-0.5 text-primary">{msg.senderName}</p>}
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.senderType === 'client' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t bg-white">
                {chat?.status === 'resolved' || chat?.status === 'closed' ? (
                  <div className="text-center py-2">
                    <p className="text-sm text-green-600 font-medium mb-2">Обращение закрыто</p>
                    <Button size="sm" variant="outline" onClick={handleNew}>Создать новое обращение</Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input placeholder="Напишите сообщение..." value={text}
                      onChange={e => setText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      disabled={sending} />
                    <Button onClick={handleSend} disabled={!text.trim() || sending}>
                      {sending ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[hsl(210,30%,40%)] mt-4">
          Powered by Support Pro 2 · Ответ в течение нескольких минут
        </p>
      </div>
    </div>
  );
}
