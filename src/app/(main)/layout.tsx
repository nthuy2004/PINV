'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, MobileHeader, BottomNav } from '@/components/layout';
import { AIAssistant } from '@/components/ai';
import { useAuth } from '@/lib/hooks/useAuth';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Close sidebar on route change
    useEffect(() => {
        setSidebarOpen(false);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark-50 dark:bg-dark-900">
                <div className="text-center">
                    <div className="spinner w-10 h-10 border-4 border-primary-500 border-t-transparent mx-auto" />
                    <p className="mt-4 text-dark-500">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-dark-50 dark:bg-dark-900">
            {/* Mobile header */}
            <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content */}
            <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0 pb-20 lg:pb-0">
                {children}
            </main>

            {/* Bottom navigation for mobile */}
            <BottomNav />

            {/* AI Assistant floating button */}
            <AIAssistant />
        </div>
    );
}
