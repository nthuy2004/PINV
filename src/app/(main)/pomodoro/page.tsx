'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, updateDoc, Timestamp, increment } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play,
    Pause,
    RotateCcw,
    Settings,
    Image as ImageIcon,
    Volume2,
    VolumeX,
    Coffee,
    BookOpen,
    X,
    Check,
    Lock,
    Coins,
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

// Background themes
const BACKGROUNDS = [
    {
        id: 'nature_1',
        name: 'Nature',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920',
        price: 0,
        category: 'Nature',
    },
    {
        id: 'anime_1',
        name: 'Anime',
        url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920',
        price: 20,
        category: 'Anime',
    },
    {
        id: 'nature_2',
        name: 'Forest',
        url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920',
        price: 15,
        category: 'Nature',
    },
    {
        id: 'night_1',
        name: 'Night Sky',
        url: 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=1920',
        price: 25,
        category: 'Nature',
    },
    {
        id: 'lofi_1',
        name: 'Lo-Fi Room',
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920',
        price: 30,
        category: 'Anime',
    },
];

// Sound effects
const SOUNDS = [
    { id: 'none', name: 'Không có', price: 0 },
    { id: 'rain', name: 'Mưa', price: 10, url: '/sounds/rain.mp3' },
    { id: 'forest', name: 'Rừng', price: 10, url: '/sounds/forest.mp3' },
    { id: 'cafe', name: 'Quán cafe', price: 15, url: '/sounds/cafe.mp3' },
    { id: 'fireplace', name: 'Lò sưởi', price: 15, url: '/sounds/fireplace.mp3' },
    { id: 'waves', name: 'Sóng biển', price: 20, url: '/sounds/waves.mp3' },
];

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

const TIMER_SETTINGS = {
    focus: 25 * 60, // 25 minutes
    shortBreak: 5 * 60, // 5 minutes
    longBreak: 15 * 60, // 15 minutes
};

export default function PomodoroPage() {
    const { user, userData, refreshUserData } = useAuth();

    // Timer state
    const [mode, setMode] = useState<TimerMode>('focus');
    const [timeLeft, setTimeLeft] = useState(TIMER_SETTINGS.focus);
    const [isRunning, setIsRunning] = useState(false);
    const [sessionsCompleted, setSessionsCompleted] = useState(0);

    // UI state
    const [showShop, setShowShop] = useState(false);
    const [shopTab, setShopTab] = useState<'backgrounds' | 'sounds'>('backgrounds');
    const [selectedBackground, setSelectedBackground] = useState(BACKGROUNDS[0]);
    const [selectedSound, setSelectedSound] = useState(SOUNDS[0]);
    const [isMuted, setIsMuted] = useState(false);
    const [purchasedItems, setPurchasedItems] = useState<string[]>(['nature_1', 'none']);

    // Audio refs
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const alarmRef = useRef<HTMLAudioElement | null>(null);

    // Initialize purchased items from user data
    useEffect(() => {
        if (userData?.purchasedItems) {
            setPurchasedItems(['nature_1', 'none', ...userData.purchasedItems]);
        }
    }, [userData]);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isRunning) {
            // Timer completed
            handleTimerComplete();
        }

        return () => clearInterval(interval);
    }, [isRunning, timeLeft]);

    // Handle background audio
    useEffect(() => {
        if (selectedSound.id !== 'none' && selectedSound.url && !isMuted) {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            audioRef.current = new Audio(selectedSound.url);
            audioRef.current.loop = true;
            if (isRunning) {
                audioRef.current.play().catch(() => { });
            }
        } else if (audioRef.current) {
            audioRef.current.pause();
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, [selectedSound, isMuted, isRunning]);

    const handleTimerComplete = async () => {
        setIsRunning(false);

        // Play alarm sound
        try {
            alarmRef.current = new Audio('/sounds/alarm.mp3');
            alarmRef.current.play().catch(() => { });
        } catch { }

        if (mode === 'focus') {
            const newSessionsCompleted = sessionsCompleted + 1;
            setSessionsCompleted(newSessionsCompleted);

            // Award tokens for completing a focus session
            if (user) {
                try {
                    await updateDoc(doc(db, 'users', user.uid), {
                        tokens: increment(5), // 5 tokens per focus session
                        totalStudyTime: increment(25), // Track study time in minutes
                    });
                    refreshUserData();
                } catch (error) {
                    console.error('Error awarding tokens:', error);
                }
            }

            // Switch to break mode
            if (newSessionsCompleted % 4 === 0) {
                setMode('longBreak');
                setTimeLeft(TIMER_SETTINGS.longBreak);
            } else {
                setMode('shortBreak');
                setTimeLeft(TIMER_SETTINGS.shortBreak);
            }
        } else {
            // Break completed, back to focus
            setMode('focus');
            setTimeLeft(TIMER_SETTINGS.focus);
        }
    };

    const toggleTimer = () => {
        setIsRunning(!isRunning);
    };

    const resetTimer = () => {
        setIsRunning(false);
        setTimeLeft(TIMER_SETTINGS[mode]);
    };

    const switchMode = (newMode: TimerMode) => {
        setMode(newMode);
        setTimeLeft(TIMER_SETTINGS[newMode]);
        setIsRunning(false);
    };

    const purchaseItem = async (itemId: string, price: number) => {
        if (!user || !userData) return;
        if (userData.tokens < price) {
            alert('Không đủ token!');
            return;
        }

        try {
            await updateDoc(doc(db, 'users', user.uid), {
                tokens: increment(-price),
                purchasedItems: [...(userData.purchasedItems || []), itemId],
            });

            setPurchasedItems((prev) => [...prev, itemId]);
            refreshUserData();
        } catch (error) {
            console.error('Error purchasing item:', error);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = 1 - timeLeft / TIMER_SETTINGS[mode];

    return (
        <div
            className="min-h-screen relative flex flex-col"
            style={{
                backgroundImage: `url(${selectedBackground.url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Content */}
            <div className="relative z-10 flex-1 flex flex-col p-6">
                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <div className="text-white">
                        <p className="text-sm opacity-80">Hôm nay: {Math.floor((sessionsCompleted * 25) / 60)}h{(sessionsCompleted * 25) % 60}p</p>
                        <p className="text-sm opacity-80">Tuần này: 0h00p</p>
                        <p className="flex items-center gap-1 mt-2">
                            <span className="text-lg font-bold">Chuỗi: 30 🔥</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-white">
                            <Coins className="w-5 h-5 text-primary-400" />
                            <span>Token: {userData?.tokens || 0}</span>
                        </div>
                        <button
                            onClick={() => setShowShop(true)}
                            className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30"
                        >
                            Shop
                        </button>
                    </div>
                </header>

                {/* Timer area */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        {/* Mode tabs */}
                        <div className="flex items-center justify-center gap-2 mb-8">
                            <button
                                onClick={() => switchMode('focus')}
                                className={cn(
                                    'px-4 py-2 rounded-xl font-medium transition-all',
                                    mode === 'focus'
                                        ? 'bg-white text-dark-800'
                                        : 'bg-white/20 text-white hover:bg-white/30'
                                )}
                            >
                                <BookOpen className="w-4 h-4 inline mr-2" />
                                Tập trung
                            </button>
                            <button
                                onClick={() => switchMode('shortBreak')}
                                className={cn(
                                    'px-4 py-2 rounded-xl font-medium transition-all',
                                    mode === 'shortBreak'
                                        ? 'bg-white text-dark-800'
                                        : 'bg-white/20 text-white hover:bg-white/30'
                                )}
                            >
                                <Coffee className="w-4 h-4 inline mr-2" />
                                Nghỉ ngắn
                            </button>
                            <button
                                onClick={() => switchMode('longBreak')}
                                className={cn(
                                    'px-4 py-2 rounded-xl font-medium transition-all',
                                    mode === 'longBreak'
                                        ? 'bg-white text-dark-800'
                                        : 'bg-white/20 text-white hover:bg-white/30'
                                )}
                            >
                                <Coffee className="w-4 h-4 inline mr-2" />
                                Nghỉ dài
                            </button>
                        </div>

                        {/* Timer display */}
                        <div className="relative w-72 h-72 mx-auto mb-8">
                            {/* Progress ring */}
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="144"
                                    cy="144"
                                    r="136"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth="8"
                                />
                                <circle
                                    cx="144"
                                    cy="144"
                                    r="136"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={2 * Math.PI * 136}
                                    strokeDashoffset={2 * Math.PI * 136 * (1 - progress)}
                                    className="transition-all duration-1000"
                                />
                            </svg>

                            {/* Time display */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                <span className="text-7xl font-bold font-mono">
                                    {formatTime(timeLeft)}
                                </span>
                                <span className="text-lg opacity-80 mt-2">
                                    {mode === 'focus' ? 'Tập trung' : mode === 'shortBreak' ? 'Nghỉ ngắn' : 'Nghỉ dài'}
                                </span>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={resetTimer}
                                className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30"
                            >
                                <RotateCcw className="w-6 h-6" />
                            </button>
                            <button
                                onClick={toggleTimer}
                                className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-dark-800 hover:bg-dark-100 shadow-lg"
                            >
                                {isRunning ? (
                                    <Pause className="w-8 h-8" />
                                ) : (
                                    <Play className="w-8 h-8 ml-1" />
                                )}
                            </button>
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30"
                            >
                                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                            </button>
                        </div>

                        {/* Session counter */}
                        <p className="mt-6 text-white opacity-80">
                            Phiên #{sessionsCompleted + 1} • +5 tokens/phiên
                        </p>
                    </div>
                </div>

                {/* Bottom toolbar */}
                <div className="flex items-center justify-center gap-3">
                    {['Custom', 'Nature', 'Anime', 'Nature', 'Nature'].map((cat, i) => (
                        <button
                            key={i}
                            className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center text-white text-xs hover:bg-white/30"
                        >
                            <ImageIcon className="w-5 h-5 mb-1" />
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Shop Modal */}
            <AnimatePresence>
                {showShop && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowShop(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-dark-100 dark:border-dark-700">
                                <h2 className="text-xl font-bold">Shop</h2>
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                                        <Coins className="w-4 h-4 text-primary-500" />
                                        <span className="font-medium">{userData?.tokens || 0}</span>
                                    </span>
                                    <button
                                        onClick={() => setShowShop(false)}
                                        className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-dark-100 dark:border-dark-700">
                                <button
                                    onClick={() => setShopTab('backgrounds')}
                                    className={cn(
                                        'flex-1 py-3 font-medium transition-colors',
                                        shopTab === 'backgrounds'
                                            ? 'text-primary-500 border-b-2 border-primary-500'
                                            : 'text-dark-500'
                                    )}
                                >
                                    <ImageIcon className="w-4 h-4 inline mr-2" />
                                    Hình nền
                                </button>
                                <button
                                    onClick={() => setShopTab('sounds')}
                                    className={cn(
                                        'flex-1 py-3 font-medium transition-colors',
                                        shopTab === 'sounds'
                                            ? 'text-primary-500 border-b-2 border-primary-500'
                                            : 'text-dark-500'
                                    )}
                                >
                                    <Volume2 className="w-4 h-4 inline mr-2" />
                                    Âm thanh
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4 overflow-y-auto max-h-96">
                                {shopTab === 'backgrounds' && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {BACKGROUNDS.map((bg) => {
                                            const isOwned = purchasedItems.includes(bg.id);
                                            const isSelected = selectedBackground.id === bg.id;

                                            return (
                                                <div
                                                    key={bg.id}
                                                    className={cn(
                                                        'relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all',
                                                        isSelected ? 'border-primary-500' : 'border-transparent'
                                                    )}
                                                    onClick={() => {
                                                        if (isOwned) {
                                                            setSelectedBackground(bg);
                                                        }
                                                    }}
                                                >
                                                    <img
                                                        src={bg.url}
                                                        alt={bg.name}
                                                        className="w-full h-24 object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                                                        <span className="text-white text-sm font-medium">{bg.name}</span>
                                                        {!isOwned && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    purchaseItem(bg.id, bg.price);
                                                                }}
                                                                className="flex items-center gap-1 px-2 py-1 bg-primary-500 rounded-lg text-xs font-medium text-dark-900"
                                                            >
                                                                <Coins className="w-3 h-3" />
                                                                {bg.price}
                                                            </button>
                                                        )}
                                                        {isOwned && isSelected && (
                                                            <Check className="w-5 h-5 text-primary-400" />
                                                        )}
                                                    </div>
                                                    {!isOwned && (
                                                        <div className="absolute top-2 right-2">
                                                            <Lock className="w-4 h-4 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {shopTab === 'sounds' && (
                                    <div className="space-y-2">
                                        {SOUNDS.map((sound) => {
                                            const isOwned = purchasedItems.includes(sound.id);
                                            const isSelected = selectedSound.id === sound.id;

                                            return (
                                                <div
                                                    key={sound.id}
                                                    className={cn(
                                                        'flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all',
                                                        isSelected
                                                            ? 'bg-primary-100 dark:bg-primary-900/30'
                                                            : 'bg-dark-50 dark:bg-dark-700 hover:bg-dark-100 dark:hover:bg-dark-600'
                                                    )}
                                                    onClick={() => {
                                                        if (isOwned) {
                                                            setSelectedSound(sound);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Volume2 className={cn('w-5 h-5', isSelected ? 'text-primary-500' : 'text-dark-500')} />
                                                        <span className="font-medium">{sound.name}</span>
                                                    </div>
                                                    {!isOwned && sound.price > 0 ? (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                purchaseItem(sound.id, sound.price);
                                                            }}
                                                            className="flex items-center gap-1 px-3 py-1 bg-primary-500 rounded-lg text-sm font-medium text-dark-900"
                                                        >
                                                            <Coins className="w-3 h-3" />
                                                            {sound.price}
                                                        </button>
                                                    ) : isSelected ? (
                                                        <Check className="w-5 h-5 text-primary-500" />
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
