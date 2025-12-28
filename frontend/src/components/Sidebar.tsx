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
    Shield
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { confirm } from '../utils/alert';
import './Sidebar.css';

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
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            {/* Logo */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="logo-icon">
                        <img src="/icon.png" alt="NotifyHub" className="logo-img" />
                    </div>
                    {!sidebarCollapsed && (
                        <div className="logo-text">
                            <span className="logo-title">NotifyHub</span>
                            <span className="logo-subtitle">通知管理中心</span>
                        </div>
                    )}
                </div>
                <button className="sidebar-toggle" onClick={toggleSidebar}>
                    {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* 狀態指示 */}
            {!sidebarCollapsed && (
                <div className="sidebar-status">
                    <Zap size={14} className="status-icon" />
                    <span>{enabledChannels} 個渠道運作中</span>
                </div>
            )}

            {/* 導航選單 */}
            <nav className="sidebar-nav">
                {visibleMenuItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''} ${item.adminOnly ? 'admin-item' : ''}`
                        }
                        title={sidebarCollapsed ? item.label : undefined}
                    >
                        <item.icon size={20} className="nav-icon" />
                        {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
                        {!sidebarCollapsed && item.adminOnly && (
                            <Shield size={12} className="admin-badge" />
                        )}
                        {!sidebarCollapsed && location.pathname === item.path && (
                            <div className="nav-indicator" />
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* 使用者選單 */}
            <div className="sidebar-user">
                {sidebarCollapsed ? (
                    <button
                        className="user-avatar-btn"
                        onClick={handleLogout}
                        title="登出"
                    >
                        <div className="user-avatar">
                            {user?.username.charAt(0).toUpperCase()}
                        </div>
                    </button>
                ) : (
                    <div className="user-menu-wrapper">
                        <button
                            className={`user-menu-trigger ${showUserMenu ? 'open' : ''}`}
                            onClick={() => setShowUserMenu(!showUserMenu)}
                        >
                            <div className="user-avatar">
                                {user?.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="user-info">
                                <span className="user-name">{user?.username}</span>
                                <span className="user-role">
                                    {user?.role === 'admin' ? '管理員' : '使用者'}
                                </span>
                            </div>
                            <ChevronDown size={16} className="user-chevron" />
                        </button>

                        {showUserMenu && (
                            <div className="user-dropdown">
                                <div className="dropdown-header">
                                    <User size={14} />
                                    <span>{user?.email}</span>
                                </div>
                                <button
                                    className="dropdown-item logout"
                                    onClick={handleLogout}
                                >
                                    <LogOut size={16} />
                                    <span>登出</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}
