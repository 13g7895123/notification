import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useNotification } from '../contexts/NotificationContext';

interface LayoutProps {
    children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const { sidebarCollapsed } = useNotification();

    return (
        <div className="flex min-h-screen bg-bg-primary text-text-primary">
            <Sidebar />
            <div className={`flex flex-1 flex-col transition-all duration-250 ease-out ${sidebarCollapsed ? 'ml-sidebar-collapsed-width' : 'ml-sidebar-width'} max-md:ml-0`}>
                <main className="flex-1 p-md md:p-lg lg:p-xl">
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    );
}
