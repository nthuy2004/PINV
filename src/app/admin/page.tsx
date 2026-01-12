'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    Timestamp,
    orderBy,
} from 'firebase/firestore';
import {
    Users,
    FileCheck,
    ShoppingBag,
    AlertTriangle,
    Check,
    X,
    Eye,
    ChevronRight,
    Shield,
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { User, Report } from '@/types';
import { Avatar, Button } from '@/components/ui';
import Link from 'next/link';

const ADMIN_EMAIL = 'huy0363894103@gmail.com';

interface DashboardStats {
    pendingReviews: number;
    totalUsers: number;
    pendingReports: number;
    activeVouchers: number;
}

export default function AdminDashboard() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        pendingReviews: 0,
        totalUsers: 0,
        pendingReports: 0,
        activeVouchers: 0,
    });
    const [pendingUsers, setPendingUsers] = useState<User[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);

    // Check if user is admin
    useEffect(() => {
        if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
            router.push('/home');
        }
    }, [user, loading, router]);

    // Fetch dashboard stats
    useEffect(() => {
        if (!user || user.email !== ADMIN_EMAIL) return;

        const fetchStats = async () => {
            try {
                // Get pending reviews
                const pendingQuery = query(
                    collection(db, 'users'),
                    where('reviewStatus', '==', 'pending')
                );
                const pendingSnapshot = await getDocs(pendingQuery);

                const pendingUsersData = pendingSnapshot.docs.map((doc) => ({
                    uid: doc.id,
                    ...doc.data(),
                })) as User[];
                setPendingUsers(pendingUsersData);

                // Get total users
                const usersSnapshot = await getDocs(collection(db, 'users'));

                // Get pending reports
                const reportsQuery = query(
                    collection(db, 'reports'),
                    where('status', '==', 'pending')
                );
                const reportsSnapshot = await getDocs(reportsQuery);

                // Get active vouchers
                const vouchersQuery = query(
                    collection(db, 'vouchers'),
                    where('isActive', '==', true)
                );
                const vouchersSnapshot = await getDocs(vouchersQuery);

                setStats({
                    pendingReviews: pendingSnapshot.size,
                    totalUsers: usersSnapshot.size,
                    pendingReports: reportsSnapshot.size,
                    activeVouchers: vouchersSnapshot.size,
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoadingStats(false);
            }
        };

        fetchStats();
    }, [user]);

    const handleApprove = async (userId: string) => {
        try {
            await updateDoc(doc(db, 'users', userId), {
                reviewStatus: 'approved',
                isVerified: true,
                updatedAt: Timestamp.now(),
            });
            setPendingUsers(pendingUsers.filter((u) => u.uid !== userId));
            setStats((prev) => ({ ...prev, pendingReviews: prev.pendingReviews - 1 }));
        } catch (error) {
            console.error('Error approving user:', error);
        }
    };

    const handleReject = async (userId: string) => {
        try {
            await updateDoc(doc(db, 'users', userId), {
                reviewStatus: 'rejected',
                updatedAt: Timestamp.now(),
            });
            setPendingUsers(pendingUsers.filter((u) => u.uid !== userId));
            setStats((prev) => ({ ...prev, pendingReviews: prev.pendingReviews - 1 }));
        } catch (error) {
            console.error('Error rejecting user:', error);
        }
    };

    if (loading || loadingStats) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner w-8 h-8 border-primary-500" />
            </div>
        );
    }

    if (!user || user.email !== ADMIN_EMAIL) {
        return null;
    }

    return (
        <div className="min-h-screen bg-dark-50 dark:bg-dark-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
                        <Shield className="w-6 h-6 text-dark-900" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                        <p className="text-dark-500">Quản lý LearnHub</p>
                    </div>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="card p-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                                <FileCheck className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.pendingReviews}</p>
                                <p className="text-sm text-dark-500">Chờ duyệt</p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                                <p className="text-sm text-dark-500">Tổng user</p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.pendingReports}</p>
                                <p className="text-sm text-dark-500">Báo cáo</p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                <ShoppingBag className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.activeVouchers}</p>
                                <p className="text-sm text-dark-500">Vouchers</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Link href="/admin/reviews" className="card p-5 hover:shadow-card-hover transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileCheck className="w-5 h-5 text-primary-500" />
                                <span className="font-medium">Xét duyệt hồ sơ</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-dark-400" />
                        </div>
                    </Link>
                    <Link href="/admin/vouchers" className="card p-5 hover:shadow-card-hover transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShoppingBag className="w-5 h-5 text-primary-500" />
                                <span className="font-medium">Quản lý vouchers</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-dark-400" />
                        </div>
                    </Link>
                    <Link href="/admin/reports" className="card p-5 hover:shadow-card-hover transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-primary-500" />
                                <span className="font-medium">Xử lý báo cáo</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-dark-400" />
                        </div>
                    </Link>
                </div>

                {/* Pending reviews */}
                <div className="card">
                    <div className="p-5 border-b border-dark-100 dark:border-dark-700">
                        <h2 className="font-semibold text-lg">Hồ sơ chờ duyệt</h2>
                    </div>

                    {pendingUsers.length === 0 ? (
                        <div className="p-8 text-center text-dark-500">
                            Không có hồ sơ nào cần duyệt
                        </div>
                    ) : (
                        <div className="divide-y divide-dark-100 dark:divide-dark-700">
                            {pendingUsers.slice(0, 5).map((pendingUser) => (
                                <div key={pendingUser.uid} className="p-5 flex items-center gap-4">
                                    <Avatar
                                        src={pendingUser.avatar}
                                        name={pendingUser.displayName}
                                        size="lg"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{pendingUser.displayName}</p>
                                        <p className="text-sm text-dark-500 truncate">{pendingUser.school}</p>
                                        <p className="text-xs text-dark-400">MSV: {pendingUser.studentId}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleReject(pendingUser.uid)}
                                            icon={<X className="w-4 h-4" />}
                                        >
                                            Từ chối
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => handleApprove(pendingUser.uid)}
                                            icon={<Check className="w-4 h-4" />}
                                        >
                                            Duyệt
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {pendingUsers.length > 5 && (
                        <div className="p-4 text-center border-t border-dark-100 dark:border-dark-700">
                            <Link href="/admin/reviews" className="text-primary-500 hover:underline">
                                Xem tất cả ({pendingUsers.length})
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
