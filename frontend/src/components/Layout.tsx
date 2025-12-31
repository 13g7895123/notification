import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
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
            <div className={`main-wrapper ${sidebarCollapsed ? 'expanded' : ''}`}>
                <main className="main-content">
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    );
}
