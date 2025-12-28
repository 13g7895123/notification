import { useState, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Send,
    Settings2,
    History,
    FileText,
    MessageSquare,
    Key,
    Activity,
    Book,
    LogOut,
    Users,
    Monitor,
    Bell,
    Database,
    ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { confirm } from '../utils/alert';

interface MenuItem {
    path: string;
    icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
    label: string;
    adminOnly?: boolean;
}

interface NavGroup {
    id: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
    items: MenuItem[];
    adminOnly?: boolean;
}

const navGroups: NavGroup[] = [
    {
        id: 'overview',
        label: '總覽',
        icon: LayoutDashboard,
        items: [
            { path: '/', icon: LayoutDashboard, label: '實時儀表板' },
        ]
    },
    {
        id: 'notifications',
        label: '通知與郵件',
        icon: Bell,
        items: [
            { path: '/send', icon: Send, label: '發送即時通知' },
            { path: '/channels', icon: Settings2, label: '通知渠道配置' },
            { path: '/templates', icon: FileText, label: '訊息外掛模板' },
            { path: '/windows-notifications', icon: Monitor, label: '桌面通知紀錄' },
        ]
    },
    {
        id: 'messages',
        label: '訊息管理',
        icon: MessageSquare,
        items: [
            { path: '/messages', icon: MessageSquare, label: '所有訊息列表' },
            { path: '/logs', icon: History, label: '發送詳細紀錄' },
        ]
    },
    {
        id: 'api',
        label: '開發者工具',
        icon: Database,
        items: [
            { path: '/api-keys', icon: Key, label: 'API 訪問金鑰' },
            { path: '/api-usage', icon: Activity, label: '流量使用紀錄' },
            { path: '/api-docs', icon: Book, label: '互動式文檔' },
        ]
    },
    {
        id: 'admin',
        label: '系統管理',
        icon: ShieldCheck,
        adminOnly: true,
        items: [
            { path: '/users', icon: Users, label: '使用者帳號管理' },
        ]
    }
];

export function Sidebar() {
    const { user, logout, isAdmin } = useAuth();
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Finding current active group based on path
    const activeGroupId = useMemo(() => {
        const group = navGroups.find(g => g.items.some(item =>
            item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
        ));
        return group ? group.id : 'overview';
    }, [location.pathname]);

    const [hoverGroupId, setHoverGroupId] = useState<string | null>(null);
    const displayedGroupId = hoverGroupId || activeGroupId;

    const currentGroup = useMemo(() =>
        navGroups.find(g => g.id === displayedGroupId) || navGroups[0]
        , [displayedGroupId]);

    const handleLogout = async () => {
        const confirmed = await confirm.logout();
        if (confirmed) logout();
    };

    const visibleGroups = navGroups.filter(g => !g.adminOnly || isAdmin);

    return (
        <aside className="flex h-screen bg-bg-primary border-r border-white/5 font-sans">
            {/* Primary Sidebar (Narrow Icons) */}
            <div className="w-18 flex flex-col items-center py-6 bg-bg-secondary border-r border-white/5 z-20">
                <div className="mb-8">
                    <img src="/icon.png" alt="Logo" className="w-8 h-8 rounded-lg brightness-110 drop-shadow-glow" />
                </div>

                <div className="flex-1 flex flex-col gap-4">
                    {visibleGroups.map((group) => {
                        const isActive = activeGroupId === group.id;
                        return (
                            <button
                                key={group.id}
                                onMouseEnter={() => setHoverGroupId(group.id)}
                                onMouseLeave={() => setHoverGroupId(null)}
                                className={`
                                    relative p-3 rounded-xl transition-all duration-300 group
                                    ${isActive
                                        ? 'bg-primary/20 text-primary shadow-glow'
                                        : 'text-text-secondary hover:bg-white/5 hover:text-white'}
                                `}
                            >
                                <group.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                {isActive && (
                                    <div className="absolute left-[-1px] top-1/4 w-1 h-1/2 bg-primary rounded-r-full" />
                                )}

                                {/* Tooltip on Hover */}
                                <div className="absolute left-full ml-4 px-3 py-1 bg-bg-tertiary text-white text-xs rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl border border-white/10">
                                    {group.label}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* User Section Bottom */}
                <div className="mt-auto relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold border border-orange-500/30 hover:bg-orange-500/30 transition-colors"
                    >
                        {(user?.displayName || user?.username || '?').charAt(0).toUpperCase()}
                    </button>

                    {showUserMenu && (
                        <div className="absolute bottom-full left-full ml-4 mb-2 w-48 bg-bg-secondary border border-white/10 rounded-xl shadow-2xl p-2 z-50">
                            <div className="px-3 py-2 border-b border-white/5 mb-1">
                                <div className="text-sm font-semibold text-white truncate">{user?.displayName || user?.username}</div>
                                <div className="text-xs text-text-muted truncate">{user?.email}</div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <LogOut size={16} />
                                <span>安全登出</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Secondary Sidebar (Sub-items) */}
            <div
                className="w-60 flex flex-col py-8 px-5 bg-bg-primary/50 backdrop-blur-xl z-10 animate-fade-in"
                onMouseEnter={() => setHoverGroupId(currentGroup.id)}
                onMouseLeave={() => setHoverGroupId(null)}
            >
                <div className="mb-8">
                    <h2 className="text-xs font-bold text-primary/80 uppercase tracking-widest px-2 mb-1">
                        {currentGroup.label}
                    </h2>
                    <div className="text-lg font-black text-white px-2">
                        選單導覽
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    {currentGroup.items.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                                ${isActive
                                    ? 'bg-white/5 text-white shadow-sm'
                                    : 'text-text-secondary hover:text-white hover:translate-x-1'}
                            `}
                        >
                            <div className={`
                                p-1.5 rounded-lg transition-colors
                                group-hover:bg-primary/10 group-hover:text-primary
                            `}>
                                <item.icon size={18} />
                            </div>
                            <span className="text-sm font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </div>

                {/* Info Card at bottom of secondary */}
                <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-bg-tertiary to-transparent border border-white/5">
                    <div className="flex items-center gap-2 mb-2 text-primary">
                        <Activity size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-tight">System Status</span>
                    </div>
                    <div className="text-xs text-text-secondary">
                        所有服務運作正常。歡迎回來，{user?.displayName || user?.username}。
                    </div>
                </div>
            </div>
        </aside>
    );
}
