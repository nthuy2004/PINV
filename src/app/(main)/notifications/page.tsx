'use client';

import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    getDocs,
} from 'firebase/firestore';
import { Bell, MessageCircle, Users, Trophy, Settings as SettingsIcon, Check, Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { Notification } from '@/types';
import { cn, timeAgo } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

export default function NotificationsPage() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const notificationsQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
            const newNotifications = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Notification[];
            setNotifications(newNotifications);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'match':
                return <MessageCircle className="w-5 h-5 text-primary-500" />;
            case 'message':
                return <MessageCircle className="w-5 h-5 text-blue-500" />;
            case 'group_invite':
                return <Users className="w-5 h-5 text-green-500" />;
            case 'badge_earned':
                return <Trophy className="w-5 h-5 text-yellow-500" />;
            case 'event_reminder':
                return <Bell className="w-5 h-5 text-orange-500" />;
            default:
                return <SettingsIcon className="w-5 h-5 text-dark-500" />;
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="spinner w-8 h-8 border-primary-500" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Thông báo</h1>

            {notifications.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-dark-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-10 h-10 text-dark-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Chưa có thông báo</h3>
                    <p className="text-dark-500">
                        Bạn sẽ nhận được thông báo khi có hoạt động mới
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={cn(
                                'card p-4 flex items-start gap-4',
                                !notification.read && 'bg-primary-50 dark:bg-primary-900/10'
                            )}
                        >
                            <div className="w-10 h-10 bg-dark-100 dark:bg-dark-700 rounded-full flex items-center justify-center">
                                {getIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium">{notification.title}</p>
                                <p className="text-sm text-dark-500">{notification.body}</p>
                                <p className="text-xs text-dark-400 mt-1">
                                    {timeAgo(notification.createdAt as Timestamp)}
                                </p>
                            </div>
                            {!notification.read && (
                                <div className="w-2 h-2 bg-primary-500 rounded-full" />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
