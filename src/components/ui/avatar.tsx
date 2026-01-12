import React from 'react';
import Image from 'next/image';
import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
    src?: string | null;
    alt?: string;
    name?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    verified?: boolean;
    online?: boolean;
    className?: string;
}

const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-xl',
};

export function Avatar({
    src,
    alt = 'Avatar',
    name,
    size = 'md',
    verified,
    online,
    className,
}: AvatarProps) {
    const initials = name ? getInitials(name) : '?';

    return (
        <div className={cn('relative inline-flex', className)}>
            <div
                className={cn(
                    'avatar flex items-center justify-center',
                    sizeClasses[size]
                )}
            >
                {src ? (
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <span className="font-medium text-dark-500 dark:text-dark-400">
                        {initials}
                    </span>
                )}
            </div>

            {/* Verified badge */}
            {verified && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-primary-500 rounded-full p-0.5">
                    <svg className="w-3 h-3 text-dark-900" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
            )}

            {/* Online indicator */}
            {online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-dark-800 rounded-full" />
            )}
        </div>
    );
}
