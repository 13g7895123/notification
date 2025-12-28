import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { BrowserRouter } from 'react-router-dom';

// Mock Context Providers
vi.mock('../contexts/NotificationContext', () => ({
    useNotification: vi.fn(() => ({
        sidebarCollapsed: false,
        toggleSidebar: vi.fn(),
        channels: []
    }))
}));

vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn(() => ({
        user: { username: 'Admin', role: 'admin', email: 'admin@example.com' },
        logout: vi.fn(),
        isAdmin: true
    }))
}));

// Mock Lucide icons to avoid rendering complexities in snapshots
vi.mock('lucide-react', () => ({
    LayoutDashboard: () => <div data-testid="icon-dashboard" />,
    Send: () => <div data-testid="icon-send" />,
    Settings2: () => <div data-testid="icon-settings" />,
    History: () => <div data-testid="icon-history" />,
    MessageSquare: () => <div data-testid="icon-messages" />,
    FileText: () => <div data-testid="icon-templates" />,
    Key: () => <div data-testid="icon-keys" />,
    Activity: () => <div data-testid="icon-usage" />,
    Book: () => <div data-testid="icon-docs" />,
    Users: () => <div data-testid="icon-users" />,
    Bell: () => <div data-testid="icon-bell" />,
    ChevronLeft: () => <div data-testid="icon-left" />,
    ChevronRight: () => <div data-testid="icon-right" />,
    ChevronDown: () => <div data-testid="icon-down" />,
    Zap: () => <div data-testid="icon-zap" />,
    LogOut: () => <div data-testid="icon-logout" />,
    User: () => <div data-testid="icon-user" />,
    Shield: () => <div data-testid="icon-shield" />,
    Monitor: () => <div data-testid="icon-monitor" />
}));

describe('Sidebar 組件', () => {
    const renderSidebar = () => render(
        <BrowserRouter>
            <Sidebar />
        </BrowserRouter>
    );

    it('應該正確渲染導航標籤', () => {
        renderSidebar();
        expect(screen.getByText('儀表板')).toBeInTheDocument();
        expect(screen.getByText('通知渠道')).toBeInTheDocument();
        expect(screen.getByText('發送通知')).toBeInTheDocument();
    });

    it('管理員應該能看到使用者管理選項', () => {
        renderSidebar();
        expect(screen.getByText('使用者管理')).toBeInTheDocument();
    });

    it('點擊使用者選單應該展開下拉內容', () => {
        renderSidebar();
        const userTrigger = screen.getByText('Admin');
        fireEvent.click(userTrigger);
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
        expect(screen.getByText('登出')).toBeInTheDocument();
    });
});
