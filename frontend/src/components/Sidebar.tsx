import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Send,
    Settings2,
    History,
    FileText,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    Zap,
    Key,
    Activity,
    Book,
    LogOut,
    User,
    ChevronDown,
    Users,
    Shield,
    Monitor
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { confirm } from '../utils/alert';

interface MenuItem {
    path: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
    { path: '/', icon: LayoutDashboard, label: '儀表板' },
    { path: '/channels', icon: Settings2, label: '通知渠道' },
    { path: '/send', icon: Send, label: '發送通知' },
    { path: '/messages', icon: MessageSquare, label: '訊息管理' },
    { path: '/logs', icon: History, label: '發送紀錄' },
    { path: '/templates', icon: FileText, label: '訊息模板' },
    { path: '/windows-notifications', icon: Monitor, label: 'Windows 通知' },
    { path: '/api-keys', icon: Key, label: 'API 金鑰' },
    { path: '/api-usage', icon: Activity, label: 'API 使用紀錄' },
    { path: '/api-docs', icon: Book, label: 'API 文件' },
    { path: '/users', icon: Users, label: '使用者管理', adminOnly: true },
];

export function Sidebar() {
    const { sidebarCollapsed, toggleSidebar, channels } = useNotification();
    const { user, logout, isAdmin } = useAuth();
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const enabledChannels = channels.filter(c => c.enabled).length;

    // 過濾掉非管理員看不到的項目
    const visibleMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin);

    const handleLogout = async () => {
        const confirmed = await confirm.logout();
        if (confirmed) {
            logout();
        }
    };

    return (
        <aside className={`fixed left-0 top-0 bottom-0 z-100 flex flex-col border-r border-border-color bg-bg-secondary transition-all duration-250 ease-out max-md:-translate-x-full ${sidebarCollapsed ? 'w-sidebar-collapsed-width max-md:translate-x-0' : 'w-sidebar-width'}`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-color-light p-lg">
                <div className="flex items-center gap-md">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-linear-to-br from-color-primary to-color-accent text-white shadow-glow">
                        <img src="/icon.png" alt="NotifyHub" className="h-full w-full rounded-md object-contain" />
                    </div>
                    {!sidebarCollapsed && (
                        <div className="flex flex-col">
                            <span className="bg-linear-to-br from-color-primary-light to-color-accent bg-clip-text text-[1.125rem] font-700 text-transparent">NotifyHub</span>
                            <span className="text-[0.7rem] text-text-muted">通知管理中心</span>
                        </div>
                    )}
                </div>
                <button
                    className="flex h-7 w-7 items-center justify-center rounded-sm border border-border-color bg-bg-tertiary text-text-secondary transition-all duration-150 hover:border-color-primary hover:bg-color-primary hover:text-white"
                    onClick={toggleSidebar}
                >
                    {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Status */}
            {!sidebarCollapsed && (
                <div className="mx-md mt-md flex items-center gap-sm border border-success/20 bg-success/10 px-lg py-sm text-[0.75rem] text-color-success-light rounded-md">
                    <Zap size={14} className="animate-pulse" />
                    <span>{enabledChannels} 個渠道運作中</span>
                </div>
            )}

            {/* Navigation */}
            <nav className="my-md flex flex-1 flex-col gap-xs overflow-y-auto px-md">
                {visibleMenuItems.map(item => {
                    const isActive = location.pathname === item.path;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`group relative flex items-center gap-md rounded-md px-md py-sm transition-all duration-150 hover:bg-bg-tertiary hover:text-text-primary ${isActive ? 'bg-linear-to-br from-color-primary/20 to-color-accent/10 text-color-primary-light' : 'text-text-secondary'} ${sidebarCollapsed ? 'justify-center p-sm' : ''} ${item.adminOnly ? 'mt-sm pt-md before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-border-color-light' : ''}`}
                            title={sidebarCollapsed ? item.label : undefined}
                        >
                            <item.icon size={20} className="shrink-0" />
                            {!sidebarCollapsed && <span className="whitespace-nowrap text-[0.875rem] font-500">{item.label}</span>}
                            {!sidebarCollapsed && item.adminOnly && (
                                <Shield size={12} className="ml-auto text-color-warning opacity-70" />
                            )}
                            {!sidebarCollapsed && isActive && (
                                <div className="absolute left-0 top-1/2 h-[60%] w-[3px] -translate-y-1/2 rounded-r-sm bg-color-primary shadow-[0_0_10px_var(--color-primary-glow)]" />
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* User Menu */}
            <div className="border-t border-border-color-light p-md">
                {sidebarCollapsed ? (
                    <button
                        className="flex w-full justify-center"
                        onClick={handleLogout}
                        title="登出"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-color-primary to-color-primary-dark text-[0.9rem] font-600 text-white">
                            {user?.username.charAt(0).toUpperCase()}
                        </div>
                    </button>
                ) : (
                    <div className="relative">
                        <button
                            className={`flex w-full items-center gap-md rounded-md border border-border-color bg-bg-tertiary p-sm transition-all duration-150 hover:border-color-primary hover:bg-bg-hover ${showUserMenu ? 'border-color-primary' : ''}`}
                            onClick={() => setShowUserMenu(!showUserMenu)}
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-color-primary to-color-primary-dark text-[0.9rem] font-600 text-white">
                                {(user?.displayName || user?.username || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-1 flex-col items-start overflow-hidden text-left">
                                <span className="w-full truncate text-[0.85rem] font-600 text-text-primary">{user?.displayName || user?.username}</span>
                                <span className="text-[0.7rem] text-text-muted">
                                    {user?.role === 'admin' ? '管理員' : '使用者'}
                                </span>
                            </div>
                            <ChevronDown size={16} className={`text-text-muted transition-transform duration-150 ${showUserMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {showUserMenu && (
                            <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 animate-slide-up overflow-hidden rounded-md border border-border-color bg-bg-secondary shadow-lg">
                                <div className="flex items-center gap-sm border-b border-border-color-light p-md text-[0.8rem] text-text-muted">
                                    <User size={14} />
                                    <span>{user?.email}</span>
                                </div>
                                <button
                                    className="group flex w-full items-center gap-sm bg-none p-md text-[0.85rem] text-text-secondary transition-all duration-150 hover:bg-bg-hover hover:text-text-primary"
                                    onClick={handleLogout}
                                >
                                    <LogOut size={16} className="group-hover:text-color-error" />
                                    <span className="group-hover:text-color-error">登出</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}
