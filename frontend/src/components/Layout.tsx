import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useNotification } from '../contexts/NotificationContext';
import './Layout.css';

interface LayoutProps {
    children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const { sidebarCollapsed } = useNotification();

    return (
        <div className="layout">
            <Sidebar />
            <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
                {children}
            </main>
        </div>
    );
}
