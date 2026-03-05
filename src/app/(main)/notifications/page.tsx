'use client';

import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    getDoc,
} from 'firebase/firestore';
import { Bell, MessageCircle, Users, Trophy, Settings as SettingsIcon, Check, X, User as UserIcon } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { Notification, User } from '@/types';
import { cn, timeAgo } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';
import { approveJoinRequest, rejectJoinRequest } from '@/lib/firebase/group-matching';
import { Avatar, Button } from '@/components/ui';

export default function NotificationsPage() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
    const [showProfileModal, setShowProfileModal] = useState<User | null>(null);

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
            case 'group_join_request':
                return <UserIcon className="w-5 h-5 text-orange-500" />;
            case 'badge_earned':
                return <Trophy className="w-5 h-5 text-yellow-500" />;
            case 'event_reminder':
                return <Bell className="w-5 h-5 text-orange-500" />;
            default:
                return <SettingsIcon className="w-5 h-5 text-dark-500" />;
        }
    };

    const handleApprove = async (notification: Notification) => {
        if (!user || !notification.data?.requestId) return;

        const requestId = notification.data.requestId;
        setProcessingRequests(prev => new Set(prev).add(requestId));

        try {
            await approveJoinRequest(user.uid, requestId);

            // Mark notification as read
            if (notification.id) {
                await updateDoc(doc(db, 'notifications', notification.id), {
                    read: true,
                });
            }
        } catch (error: any) {
            console.error('Error approving request:', error);
            alert(error.message || 'Đã có lỗi xảy ra');
        } finally {
            setProcessingRequests(prev => {
                const next = new Set(prev);
                next.delete(requestId);
                return next;
            });
        }
    };

    const handleReject = async (notification: Notification) => {
        if (!user || !notification.data?.requestId) return;

        const requestId = notification.data.requestId;
        setProcessingRequests(prev => new Set(prev).add(requestId));

        try {
            await rejectJoinRequest(user.uid, requestId);

            if (notification.id) {
                await updateDoc(doc(db, 'notifications', notification.id), {
                    read: true,
                });
            }
        } catch (error: any) {
            console.error('Error rejecting request:', error);
            alert(error.message || 'Đã có lỗi xảy ra');
        } finally {
            setProcessingRequests(prev => {
                const next = new Set(prev);
                next.delete(requestId);
                return next;
            });
        }
    };

    const handleViewProfile = async (userId: string) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                setShowProfileModal({ uid: userId, ...userDoc.data() } as User);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
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
                    {notifications.map((notification) => {
                        const isGroupRequest = notification.type === 'group_join_request';
                        const isProcessing = notification.data?.requestId
                            ? processingRequests.has(notification.data.requestId)
                            : false;

                        return (
                            <div
                                key={notification.id}
                                className={cn(
                                    'card p-4',
                                    !notification.read && 'bg-primary-50 dark:bg-primary-900/10'
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-dark-100 dark:bg-dark-700 rounded-full flex items-center justify-center shrink-0">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium">{notification.title}</p>
                                        <p className="text-sm text-dark-500">{notification.body}</p>
                                        <p className="text-xs text-dark-400 mt-1">
                                            {timeAgo(notification.createdAt as Timestamp)}
                                        </p>

                                        {/* Group join request actions */}
                                        {isGroupRequest && !notification.read && notification.data?.requestUserId && (
                                            <div className="flex items-center gap-2 mt-3">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleViewProfile(notification.data!.requestUserId)}
                                                >
                                                    Xem hồ sơ
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApprove(notification)}
                                                    loading={isProcessing}
                                                    icon={<Check className="w-4 h-4" />}
                                                >
                                                    Duyệt
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleReject(notification)}
                                                    loading={isProcessing}
                                                    icon={<X className="w-4 h-4" />}
                                                >
                                                    Từ chối
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    {!notification.read && !isGroupRequest && (
                                        <div className="w-2 h-2 bg-primary-500 rounded-full shrink-0" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Profile Preview Modal */}
            {showProfileModal && (
                <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowProfileModal(null)}
                >
                    <div
                        className="card w-full max-w-sm p-6 animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center mb-4">
                            <Avatar
                                src={showProfileModal.avatar}
                                name={showProfileModal.displayName}
                                size="xl"
                                verified={showProfileModal.isVerified}
                            />
                            <h3 className="text-xl font-bold mt-3">{showProfileModal.displayName}</h3>
                            <p className="text-dark-500">{showProfileModal.age} tuổi • {showProfileModal.school}</p>
                            <p className="text-dark-500 text-sm">{showProfileModal.location}</p>
                        </div>

                        {showProfileModal.bio && (
                            <p className="text-sm text-dark-600 dark:text-dark-300 mb-4 text-center">
                                {showProfileModal.bio}
                            </p>
                        )}

                        <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                            {showProfileModal.interests.slice(0, 8).map((interest, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs rounded-full"
                                >
                                    {interest}
                                </span>
                            ))}
                        </div>

                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => setShowProfileModal(null)}
                        >
                            Đóng
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
