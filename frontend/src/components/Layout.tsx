import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
    children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="flex min-h-screen bg-bg-primary text-text-primary">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
                <div className="mx-auto max-w-7xl animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
}
