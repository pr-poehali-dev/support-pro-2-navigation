import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import Icon from '@/components/ui/icon';

export default function LoginPage() {
  const [loginVal, setLoginVal] = useState('');
  const [passwordVal, setPasswordVal] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(loginVal.trim(), passwordVal);
    if (result.ok) {
      navigate('/');
    } else {
      setError(result.error || 'Ошибка входа');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(222,45%,10%)] to-[hsl(222,45%,18%)]">
      <div className="w-full max-w-[400px] px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[hsl(213,90%,52%)] mb-4 shadow-lg">
            <Icon name="Headphones" size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Support Pro 2</h1>
          <p className="text-[hsl(210,30%,60%)] text-sm mt-1">Система управления поддержкой</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-foreground mb-6">Вход в систему</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login">Логин</Label>
              <Input
                id="login"
                type="text"
                placeholder="Введите логин"
                value={loginVal}
                onChange={e => setLoginVal(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={passwordVal}
                onChange={e => setPasswordVal(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <Icon name="AlertCircle" size={14} />
                {error}
              </p>
            )}
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? <Icon name="Loader2" size={16} className="animate-spin mr-2" /> : null}
              {loading ? 'Выполняется вход...' : 'Войти'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[hsl(210,30%,45%)] mt-6">
          Учётные данные выдаются администратором системы
        </p>
      </div>
    </div>
  );
}