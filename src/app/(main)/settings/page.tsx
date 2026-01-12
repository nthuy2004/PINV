'use client';

import { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import {
    Sun,
    Moon,
    Bell,
    Lock,
    Eye,
    HelpCircle,
    LogOut,
    ChevronRight,
    User,
    Shield,
    Trash2,
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
    const { user, userData, signOut } = useAuth();
    const [darkMode, setDarkMode] = useState(
        typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
    );

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);

        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const settingsSections = [
        {
            title: 'Tài khoản',
            items: [
                { icon: User, label: 'Chỉnh sửa hồ sơ', href: '/profile' },
                { icon: Lock, label: 'Đổi mật khẩu', href: '/settings/password' },
                { icon: Shield, label: 'Bảo mật', href: '/settings/security' },
            ],
        },
        {
            title: 'Cài đặt chung',
            items: [
                { icon: Bell, label: 'Thông báo', href: '/settings/notifications' },
                { icon: Eye, label: 'Quyền riêng tư', href: '/settings/privacy' },
            ],
        },
        {
            title: 'Hỗ trợ',
            items: [
                { icon: HelpCircle, label: 'Trung tâm trợ giúp', href: '/help' },
            ],
        },
    ];

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Cài đặt</h1>

            {/* Dark mode toggle */}
            <div className="card p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {darkMode ? (
                            <Moon className="w-5 h-5 text-primary-500" />
                        ) : (
                            <Sun className="w-5 h-5 text-primary-500" />
                        )}
                        <span className="font-medium">Chế độ tối</span>
                    </div>
                    <button
                        onClick={toggleDarkMode}
                        className={cn(
                            'w-12 h-6 rounded-full transition-colors relative',
                            darkMode ? 'bg-primary-500' : 'bg-dark-300'
                        )}
                    >
                        <span
                            className={cn(
                                'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                                darkMode ? 'translate-x-7' : 'translate-x-1'
                            )}
                        />
                    </button>
                </div>
            </div>

            {/* Settings sections */}
            {settingsSections.map((section) => (
                <div key={section.title} className="mb-6">
                    <h2 className="text-sm font-medium text-dark-500 mb-2 px-1">
                        {section.title}
                    </h2>
                    <div className="card divide-y divide-dark-100 dark:divide-dark-700">
                        {section.items.map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors"
                            >
                                <item.icon className="w-5 h-5 text-dark-500" />
                                <span className="flex-1">{item.label}</span>
                                <ChevronRight className="w-5 h-5 text-dark-400" />
                            </a>
                        ))}
                    </div>
                </div>
            ))}

            {/* Premium status */}
            {userData && (
                <div className="card p-4 mb-6 bg-gradient-to-r from-primary-500 to-primary-400">
                    <div className="flex items-center justify-between text-dark-900">
                        <div>
                            <p className="font-bold text-lg">
                                {userData.isPremium ? 'Premium Active' : 'Nâng cấp Premium'}
                            </p>
                            <p className="text-sm opacity-80">
                                {userData.isPremium
                                    ? '10 lượt/ngày + 50 tokens max'
                                    : 'Mở khóa thêm nhiều tính năng'}
                            </p>
                        </div>
                        {!userData.isPremium && (
                            <Button variant="secondary" size="sm">
                                Nâng cấp
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Danger zone */}
            <div className="space-y-3">
                <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-3 px-4 py-3 text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-xl transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Đăng xuất</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-xl transition-colors">
                    <Trash2 className="w-5 h-5" />
                    <span>Xóa tài khoản</span>
                </button>
            </div>

            {/* App version */}
            <p className="text-center text-sm text-dark-400 mt-8">
                LearnHub v0.1.0
            </p>
        </div>
    );
}
