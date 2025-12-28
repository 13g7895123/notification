import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Send,
    Settings2,
    History,
    FileText,
    MessageSquare,
    LogOut,
    Users,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Activity,
    Monitor,
    Bell,
    Database,
    ShieldCheck,
    Key,
    Book
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { confirm } from '../utils/alert';
import './Sidebar.css';

export function Sidebar() {
    const { user, logout, isAdmin } = useAuth();
    const { sidebarCollapsed, toggleSidebar } = useNotification();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = async () => {
        const confirmed = await confirm.logout();
        if (confirmed) logout();
    };

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: '儀表板' },
        { path: '/channels', icon: Settings2, label: '通知渠道' },
        { path: '/send', icon: Send, label: '發送通知' },
        { path: '/messages', icon: MessageSquare, label: '訊息管理' },
        { path: '/templates', icon: FileText, label: '訊息模板' },
        { path: '/logs', icon: History, label: '發送紀錄' },
        { path: '/api-docs', icon: Book, label: 'API 文件' },
        { path: '/windows-notifications', icon: Monitor, label: '桌面通知' },
    ];

    const adminItems = [
        { path: '/users', icon: Users, label: '使用者管理', adminOnly: true },
    ];

    return (
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                {!sidebarCollapsed && (
                    <div className="sidebar-logo">
                        <div className="logo-icon">
                            <Bell size={24} />
                        </div>
                        <div className="logo-text">
                            <span className="logo-title">NotifyHub</span>
                            <span className="logo-subtitle">Management Portal</span>
                        </div>
                    </div>
                )}
                {sidebarCollapsed && (
                    <div className="logo-icon" style={{ margin: '0 auto' }}>
                        <Bell size={20} />
                    </div>
                )}
                <button className="sidebar-toggle" onClick={toggleSidebar}>
                    {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            <div className="sidebar-status">
                <Activity size={14} className="status-icon" />
                {!sidebarCollapsed && <span>系統運作正常</span>}
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        title={sidebarCollapsed ? item.label : ''}
                    >
                        <item.icon size={20} className="nav-icon" />
                        {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
                        {!sidebarCollapsed && <div className="nav-indicator" />}
                    </NavLink>
                ))}

                {isAdmin && adminItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item admin-item ${isActive ? 'active' : ''}`}
                        title={sidebarCollapsed ? item.label : ''}
                    >
                        <item.icon size={20} className="nav-icon" />
                        {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
                        {!sidebarCollapsed && <span className="admin-badge">Admin</span>}
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-user">
                <div className="user-menu-wrapper">
                    <button
                        className={`user-menu-trigger ${showUserMenu ? 'open' : ''}`}
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        title={sidebarCollapsed ? user?.username : ''}
                    >
                        <div className="user-avatar">
                            {(user?.displayName || user?.username || '?').charAt(0).toUpperCase()}
                        </div>
                        {!sidebarCollapsed && (
                            <>
                                <div className="user-info">
                                    <span className="user-name">{user?.displayName || user?.username}</span>
                                    <span className="user-role">{isAdmin ? '系統管理員' : '一般使用者'}</span>
                                </div>
                                <ChevronDown size={14} className="user-chevron" />
                            </>
                        )}
                    </button>

                    {showUserMenu && (
                        <div className="user-dropdown">
                            <div className="dropdown-header">
                                <span>{user?.email}</span>
                            </div>
                            <button className="dropdown-item logout" onClick={handleLogout}>
                                <LogOut size={16} />
                                登出
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {!sidebarCollapsed && (
                <div className="sidebar-footer">
                    <div className="footer-info">
                        <span>Version 1.2.0</span>
                        <span>© 2024 NotifyHub Team</span>
                    </div>
                </div>
            )}
        </aside>
    );
}
