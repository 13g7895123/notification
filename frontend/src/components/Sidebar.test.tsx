/// <reference types="vitest" />
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
    LogOut: () => <div data-testid="icon-logout" />,
    Monitor: () => <div data-testid="icon-monitor" />,
    Database: () => <div data-testid="icon-database" />,
    ShieldCheck: () => <div data-testid="icon-shield-check" />,
    ChevronDown: () => <div data-testid="icon-down" />,
    ChevronRight: () => <div data-testid="icon-right" />
}));

describe('Sidebar 組件', () => {
    const renderSidebar = () => render(
        <BrowserRouter>
            <Sidebar />
        </BrowserRouter>
    );

    it('應該正確渲染導航標籤', () => {
        renderSidebar();
        // 預設應該選中「總覽」分組，顯示「實時儀表板」
        expect(screen.getByText('實時儀表板')).toBeInTheDocument();
    });

    it('管理員應該能看到系統管理組件', () => {
        renderSidebar();
        // 管理員應該能看到「系統管理」的 Tooltip 或導覽標籤
        expect(screen.getAllByText('系統管理').length).toBeGreaterThan(0);
    });

    it('點擊使用者頭像按鈕應該展開選單內容', () => {
        renderSidebar();
        // 找到頭像按鈕 (顯示 'A')
        const userTrigger = screen.getByText('A');
        fireEvent.click(userTrigger);

        // 檢查選單內容
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
        expect(screen.getByText('安全登出')).toBeInTheDocument();
    });
});
