import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getRoleLabel } from '@/lib/auth';
import type { UserRole } from '@/lib/auth';
import Icon from '@/components/ui/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Дашборд', icon: 'LayoutDashboard', path: '/' },
  { label: 'Чаты', icon: 'MessageSquare', path: '/chats' },
  { label: 'Почта', icon: 'Mail', path: '/mail' },
  { label: 'Соц. сети', icon: 'Share2', path: '/social' },
  { label: 'STACK', icon: 'Layers', path: '/stack' },
  { label: 'Отчёты', icon: 'BarChart2', path: '/reports', roles: ['admin', 'okk'] },
  { label: 'Сотрудники', icon: 'Users', path: '/employees', roles: ['admin', 'okk'] },
  { label: 'Настройки', icon: 'Settings', path: '/settings', roles: ['admin'] },
];

const STATUS_OPTIONS = [
  { value: 'online' as const, label: 'Онлайн', dot: 'dot-online' },
  { value: 'busy' as const, label: 'Занят', dot: 'dot-busy' },
  { value: 'away' as const, label: 'Отошёл', dot: 'dot-away' },
  { value: 'offline' as const, label: 'Не в сети', dot: 'dot-offline' },
];

export default function Sidebar() {
  const { user, logout, updateStatus } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = NAV_ITEMS.filter(item =>
    !item.roles || (user && item.roles.includes(user.role))
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const currentStatus = STATUS_OPTIONS.find(s => s.value === user?.status) || STATUS_OPTIONS[0];

  return (
    <aside
      className="flex flex-col h-screen transition-all duration-200"
      style={{
        width: collapsed ? '64px' : '240px',
        background: 'hsl(var(--sidebar-background))',
        borderRight: '1px solid hsl(var(--sidebar-border))',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-[60px] border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[hsl(213,90%,52%)] flex items-center justify-center">
          <Icon name="Headphones" size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-white text-sm tracking-wide">Support Pro 2</span>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="ml-auto text-[hsl(var(--sidebar-foreground))] hover:text-white transition-colors"
        >
          <Icon name={collapsed ? 'ChevronsRight' : 'ChevronsLeft'} size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {visibleItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <Icon name={item.icon} size={18} className="sidebar-icon flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User block */}
      {user && (
        <div className="border-t border-[hsl(var(--sidebar-border))] p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`sidebar-item w-full ${collapsed ? 'justify-center px-0' : ''}`}>
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-[hsl(213,90%,52%)] flex items-center justify-center text-white text-xs font-bold">
                    {user.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[hsl(var(--sidebar-background))] ${currentStatus.dot}`} />
                </div>
                {!collapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-[hsl(var(--sidebar-foreground))] truncate">{getRoleLabel(user.role)}</p>
                  </div>
                )}
                {!collapsed && <Icon name="ChevronUp" size={14} className="flex-shrink-0" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-52">
              <div className="px-2 py-1.5 text-xs text-muted-foreground">{user.email}</div>
              <DropdownMenuSeparator />
              <div className="px-2 py-1 text-xs text-muted-foreground font-medium">Статус</div>
              {STATUS_OPTIONS.map(opt => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => updateStatus(opt.value)}
                  className="gap-2"
                >
                  <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                  {opt.label}
                  {user.status === opt.value && <Icon name="Check" size={12} className="ml-auto" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
                <Icon name="User" size={14} className="mr-2" /> Профиль
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <Icon name="LogOut" size={14} className="mr-2" /> Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </aside>
  );
}