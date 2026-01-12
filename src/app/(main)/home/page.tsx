'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Users, UsersRound, Coins, ShoppingBag, Timer, Flame, RefreshCw } from 'lucide-react';
import { UserCard } from '@/components/matching';
import { Button } from '@/components/ui';
import { TodoList } from '@/components/todo';
import { Calendar } from '@/components/calendar';
import { useAuth } from '@/lib/hooks/useAuth';
import { cn, hasReachedSwipeLimit } from '@/lib/utils';
import { getPotentialMatches, recordLike, recordDecline, updateSwipeCount } from '@/lib/firebase/matching';
import { User } from '@/types';
import Link from 'next/link';

interface MatchCandidate {
    user: User;
    score: number;
    reasons: string[];
}

export default function HomePage() {
    const { user, userData, refreshUserData } = useAuth();
    const [activeTab, setActiveTab] = useState<'people' | 'groups'>('people');
    const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [showMatch, setShowMatch] = useState(false);

    const swipesUsed = userData?.dailySwipes || 0;
    const isPremium = userData?.isPremium || false;
    const swipeLimit = isPremium ? 10 : 5;
    const hasReachedLimit = hasReachedSwipeLimit(swipesUsed, isPremium);

    // Fetch potential matches from Firestore
    useEffect(() => {
        if (!user) return;

        const fetchCandidates = async () => {
            setLoading(true);
            try {
                const matches = await getPotentialMatches(user.uid, 20);
                setCandidates(matches);
                setCurrentIndex(0);
            } catch (error) {
                console.error('Error fetching matches:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCandidates();
    }, [user]);

    const refreshCandidates = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const matches = await getPotentialMatches(user.uid, 20);
            setCandidates(matches);
            setCurrentIndex(0);
        } catch (error) {
            console.error('Error refreshing matches:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (userId: string) => {
        if (!user || processing || hasReachedLimit) return;

        setProcessing(true);
        try {
            // Record like
            const result = await recordLike(user.uid, userId);

            // Update swipe count
            await updateSwipeCount(user.uid);
            await refreshUserData();

            // Show match animation if it's a match
            if (result.isMatch) {
                setShowMatch(true);
                setTimeout(() => setShowMatch(false), 2000);
            }

            // Move to next
            if (currentIndex < candidates.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                // Refresh candidates when we run out
                await refreshCandidates();
            }
        } catch (error) {
            console.error('Error accepting user:', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleDecline = async (userId: string) => {
        if (!user || processing || hasReachedLimit) return;

        setProcessing(true);
        try {
            // Record decline
            await recordDecline(user.uid, userId);

            // Update swipe count
            await updateSwipeCount(user.uid);
            await refreshUserData();

            // Move to next
            if (currentIndex < candidates.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                await refreshCandidates();
            }
        } catch (error) {
            console.error('Error declining user:', error);
        } finally {
            setProcessing(false);
        }
    };

    const currentCandidate = candidates[currentIndex];

    return (
        <div className="min-h-screen p-4 lg:p-6">
            {/* Match animation overlay */}
            <AnimatePresence>
                {showMatch && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-primary-500/90 flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-center text-dark-900"
                        >
                            <h1 className="text-5xl font-bold mb-4">🎉 Match!</h1>
                            <p className="text-xl">Bạn và người này đã thích nhau!</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
                <div>
                    <h1 className="font-display text-2xl lg:text-3xl font-bold italic text-primary-500">
                        Khơi nguồn sáng tạo
                    </h1>
                </div>

                {/* Right side widgets - hidden on mobile */}
                <div className="hidden sm:flex items-center gap-4">
                    {/* Token display */}
                    <div className="flex items-center gap-4 bg-white dark:bg-dark-800 rounded-2xl px-5 py-3 shadow-card">
                        <div className="flex items-center gap-2">
                            <Coins className="w-5 h-5 text-primary-500" />
                            <span className="font-semibold">Token: {userData?.tokens || 0}</span>
                        </div>
                        <Link href="/pomodoro">
                            <Button variant="ghost" size="sm" className="text-sm" icon={<ShoppingBag className="w-4 h-4" />}>
                                Shop
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                {/* Main content */}
                <div className="flex-1 order-1">
                    {/* Tabs */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <button
                            onClick={() => setActiveTab('people')}
                            className={cn(
                                'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all',
                                activeTab === 'people'
                                    ? 'bg-dark-800 text-white dark:bg-white dark:text-dark-800'
                                    : 'bg-white dark:bg-dark-800 text-dark-600 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700'
                            )}
                        >
                            <Users className="w-5 h-5" />
                            Người
                        </button>
                        <button
                            onClick={() => setActiveTab('groups')}
                            className={cn(
                                'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all',
                                activeTab === 'groups'
                                    ? 'bg-dark-800 text-white dark:bg-white dark:text-dark-800'
                                    : 'bg-white dark:bg-dark-800 text-dark-600 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700'
                            )}
                        >
                            <UsersRound className="w-5 h-5" />
                            Nhóm
                        </button>
                    </div>

                    {/* User Card */}
                    {activeTab === 'people' && (
                        <div className="flex justify-center">
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="spinner w-10 h-10 border-primary-500 mx-auto mb-4" />
                                    <p className="text-dark-500">Đang tìm bạn học phù hợp...</p>
                                </div>
                            ) : hasReachedLimit ? (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 bg-dark-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Timer className="w-10 h-10 text-dark-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Đã hết lượt hôm nay</h3>
                                    <p className="text-dark-500 mb-4">
                                        Bạn đã sử dụng hết {swipeLimit} lượt. Quay lại vào ngày mai!
                                    </p>
                                    {!isPremium && (
                                        <Button variant="primary">
                                            Nâng cấp Premium để có thêm lượt
                                        </Button>
                                    )}
                                </div>
                            ) : currentCandidate ? (
                                <div>
                                    {/* Match reasons */}
                                    {currentCandidate.reasons.length > 0 && (
                                        <div className="flex flex-wrap gap-2 justify-center mb-4">
                                            {currentCandidate.reasons.map((reason, i) => (
                                                <span
                                                    key={i}
                                                    className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm rounded-full"
                                                >
                                                    {reason}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentCandidate.user.uid}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, x: 100 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <UserCard
                                                user={{
                                                    id: currentCandidate.user.uid,
                                                    displayName: currentCandidate.user.displayName,
                                                    age: currentCandidate.user.age,
                                                    school: currentCandidate.user.school,
                                                    location: currentCandidate.user.location,
                                                    avatar: currentCandidate.user.avatar,
                                                    photos: currentCandidate.user.photos,
                                                    interests: currentCandidate.user.interests,
                                                    bio: currentCandidate.user.bio,
                                                    isVerified: currentCandidate.user.isVerified,
                                                }}
                                                onAccept={handleAccept}
                                                onDecline={handleDecline}
                                                disabled={processing}
                                            />
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 bg-dark-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Users className="w-10 h-10 text-dark-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Không còn ai phù hợp</h3>
                                    <p className="text-dark-500 mb-4">
                                        Hãy quay lại sau để tìm thêm bạn học mới!
                                    </p>
                                    <Button
                                        variant="secondary"
                                        onClick={refreshCandidates}
                                        icon={<RefreshCw className="w-4 h-4" />}
                                    >
                                        Tải lại
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'groups' && (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-dark-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <UsersRound className="w-10 h-10 text-dark-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Nhóm học</h3>
                            <p className="text-dark-500 mb-4">
                                Tìm nhóm học phù hợp với lịch trình của bạn
                            </p>
                            <Link href="/groups">
                                <Button variant="primary">Xem nhóm học</Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Right sidebar - Desktop: side, Mobile: below main content */}
                <div className="w-full lg:w-80 space-y-4 lg:space-y-6 order-2">
                    {/* Lock In button */}
                    <div className="card p-5">
                        <Link href="/pomodoro">
                            <Button className="w-full mb-4" size="lg">
                                LOCK IN
                            </Button>
                        </Link>
                        <div className="space-y-2 text-sm text-dark-600 dark:text-dark-400">
                            <div className="flex justify-between">
                                <span>Hôm nay:</span>
                                <span className="font-medium text-dark-800 dark:text-white">
                                    {Math.floor((userData?.totalStudyTime || 0) / 60)}h{(userData?.totalStudyTime || 0) % 60}p
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Study streak */}
                    <div className="card p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                                <Flame className="w-6 h-6 text-primary-500" />
                            </div>
                            <div>
                                <p className="text-sm text-dark-500">Chuỗi</p>
                                <p className="text-2xl font-bold">{userData?.streak || 0} 🔥</p>
                            </div>
                        </div>
                    </div>

                    {/* Swipe counter */}
                    <div className="card p-5">
                        <h3 className="font-medium mb-3">Lượt còn lại hôm nay</h3>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary-500 transition-all"
                                    style={{ width: `${((swipeLimit - swipesUsed) / swipeLimit) * 100}%` }}
                                />
                            </div>
                            <span className="font-medium">
                                {Math.max(0, swipeLimit - swipesUsed)}/{swipeLimit}
                            </span>
                        </div>
                    </div>

                    {/* Calendar mini */}
                    <Calendar />

                    {/* To-do list */}
                    <TodoList />
                </div>
            </div>
        </div>
    );
}
