'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, GraduationCap, ChevronDown, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserCardProps {
    user: {
        id: string;
        displayName: string;
        age?: number;
        school?: string;
        location?: string;
        avatar?: string;
        photos?: string[];
        interests?: string[];
        bio?: string;
        isVerified?: boolean;
    };
    onAccept: (userId: string) => void;
    onDecline: (userId: string) => void;
    disabled?: boolean;
}

export function UserCard({ user, onAccept, onDecline, disabled = false }: UserCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    const allPhotos = [user.avatar || '', ...(user.photos || []).filter((p: string) => p !== user.avatar)];

    const nextPhoto = () => {
        setCurrentPhotoIndex((prev) => (prev + 1) % allPhotos.length);
    };

    const prevPhoto = () => {
        setCurrentPhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
    };

    return (
        <div className="relative w-full max-w-sm mx-auto">
            <motion.div
                layout
                className="card overflow-hidden"
                style={{ borderRadius: '1.5rem' }}
            >
                {/* Photo Section */}
                <div className="relative aspect-[3/4] bg-dark-200 dark:bg-dark-700">
                    <Image
                        src={allPhotos[currentPhotoIndex] || '/placeholder-avatar.png'}
                        alt={user.displayName}
                        fill
                        className="object-cover"
                        priority
                    />

                    {/* Photo navigation dots */}
                    {allPhotos.length > 1 && (
                        <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5 px-4">
                            {allPhotos.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentPhotoIndex(index)}
                                    className={cn(
                                        'h-1 rounded-full transition-all',
                                        index === currentPhotoIndex
                                            ? 'w-6 bg-white'
                                            : 'w-4 bg-white/50'
                                    )}
                                />
                            ))}
                        </div>
                    )}

                    {/* Photo navigation areas */}
                    <div className="absolute inset-0 flex">
                        <button
                            onClick={prevPhoto}
                            className="w-1/2 h-full"
                            aria-label="Previous photo"
                        />
                        <button
                            onClick={nextPhoto}
                            className="w-1/2 h-full"
                            aria-label="Next photo"
                        />
                    </div>

                    {/* Gradient overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />

                    {/* User info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold">
                                {user.displayName}, {user.age}
                            </h2>
                            {user.isVerified && (
                                <BadgeCheck className="w-6 h-6 text-primary-500 fill-primary-500" />
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-white/80">
                            <GraduationCap className="w-4 h-4" />
                            <span className="text-sm">{user.school}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-white/80">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{user.location}</span>
                        </div>
                    </div>
                </div>

                {/* Expand toggle */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full py-3 flex items-center justify-center gap-2 text-dark-500 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors"
                >
                    <span className="text-sm">
                        {expanded ? 'Thu gọn' : 'Xem thêm thông tin'}
                    </span>
                    <ChevronDown
                        className={cn(
                            'w-4 h-4 transition-transform',
                            expanded && 'rotate-180'
                        )}
                    />
                </button>

                {/* Expanded content */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="p-5 pt-0 space-y-4">
                                {/* Bio */}
                                {user.bio && (
                                    <div>
                                        <h3 className="text-sm font-medium text-dark-500 mb-2">Giới thiệu</h3>
                                        <p className="text-dark-700 dark:text-dark-200">{user.bio}</p>
                                    </div>
                                )}

                                {/* Interests */}
                                {user.interests && user.interests.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-dark-500 mb-2">Sở thích</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {user.interests.map((interest: string) => (
                                                <span key={interest} className="tag">
                                                    {interest}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Action buttons */}
            <div className="flex justify-center gap-6 mt-6">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onDecline(user.id)}
                    className="w-16 h-16 rounded-full bg-white dark:bg-dark-800 shadow-lg flex items-center justify-center border-2 border-accent-300 text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-colors"
                    aria-label="Bỏ qua"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onAccept(user.id)}
                    className="w-16 h-16 rounded-full bg-primary-500 shadow-lg shadow-primary-500/30 flex items-center justify-center text-dark-900 hover:bg-primary-400 transition-colors"
                    aria-label="Chấp nhận"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                </motion.button>
            </div>
        </div>
    );
}
