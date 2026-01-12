'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    MessageCircle,
    User,
    Bell,
    Settings,
    LogOut,
    BookOpen,
    Star,
    Timer,
    Users,
    Menu,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui';
import { useAuth } from '@/lib/hooks/useAuth';

const navigation = [
    { name: 'Trang chủ', href: '/home', icon: Home },
    { name: 'Tin nhắn', href: '/chat', icon: MessageCircle },
    { name: 'Pomodoro', href: '/pomodoro', icon: Timer },
    { name: 'Nhóm học', href: '/groups', icon: Users },
    { name: 'Sửa hồ sơ', href: '/profile', icon: User },
    { name: 'Thông báo', href: '/notifications', icon: Bell },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { userData, signOut } = useAuth();

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-0 h-full w-64 bg-white dark:bg-dark-800 border-r border-dark-100 dark:border-dark-700 flex flex-col z-50 transition-transform duration-300',
                    // Mobile: hidden by default, show when open
                    'lg:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                {/* Logo */}
                <div className="p-4 lg:p-6 border-b border-dark-100 dark:border-dark-700 flex items-center justify-between">
                    <Link href="/home" className="flex items-center gap-3" onClick={onClose}>
                        <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-dark-900" />
                        </div>
                        <span className="font-display text-xl font-bold">LearnHub</span>
                    </Link>
                    {/* Mobile close button */}
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg lg:hidden"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={onClose}
                                className={cn('nav-item', isActive && 'active')}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-dark-100 dark:border-dark-700">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <Avatar
                            src={userData?.avatar}
                            name={userData?.displayName || 'User'}
                            size="md"
                            verified={userData?.isVerified}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-dark-800 dark:text-white truncate">
                                {userData?.displayName || 'Loading...'}
                            </p>
                            <p className="text-xs text-dark-500 truncate">
                                {userData?.tokens || 0} tokens
                            </p>
                        </div>
                        {userData?.isPremium && (
                            <Star className="w-4 h-4 text-primary-500 fill-primary-500" />
                        )}
                    </div>

                    <div className="space-y-1">
                        <Link href="/settings" onClick={onClose} className="nav-item">
                            <Settings className="w-5 h-5" />
                            <span>Cài đặt</span>
                        </Link>
                        <button
                            onClick={() => signOut()}
                            className="nav-item w-full text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-900/20"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}

// Mobile header with menu button
export function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
    const { userData } = useAuth();

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-dark-800 border-b border-dark-100 dark:border-dark-700 flex items-center justify-between px-4 z-30 lg:hidden">
            <button
                onClick={onMenuClick}
                className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
            >
                <Menu className="w-6 h-6" />
            </button>

            <Link href="/home" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-dark-900" />
                </div>
                <span className="font-display text-lg font-bold">LearnHub</span>
            </Link>

            <Link href="/profile">
                <Avatar
                    src={userData?.avatar}
                    name={userData?.displayName || 'User'}
                    size="sm"
                />
            </Link>
        </header>
    );
}

// Bottom navigation for mobile
export function BottomNav() {
    const pathname = usePathname();

    const bottomNavItems = [
        { name: 'Trang chủ', href: '/home', icon: Home },
        { name: 'Tin nhắn', href: '/chat', icon: MessageCircle },
        { name: 'Pomodoro', href: '/pomodoro', icon: Timer },
        { name: 'Nhóm', href: '/groups', icon: Users },
        { name: 'Cài đặt', href: '/settings', icon: Settings },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-800 border-t border-dark-100 dark:border-dark-700 flex items-center justify-around py-2 z-30 lg:hidden safe-area-bottom">
            {bottomNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                            'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors',
                            isActive
                                ? 'text-primary-500'
                                : 'text-dark-400 hover:text-dark-600 dark:hover:text-dark-300'
                        )}
                    >
                        <item.icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
                        <span className="text-xs font-medium">{item.name}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
