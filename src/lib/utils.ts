import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Timestamp } from 'firebase/firestore';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date | Timestamp): number {
    const dob = dateOfBirth instanceof Timestamp ? dateOfBirth.toDate() : dateOfBirth;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }

    return age;
}

/**
 * Format timestamp to readable string
 */
export function formatTimestamp(timestamp: Timestamp, options?: Intl.DateTimeFormatOptions): string {
    const date = timestamp.toDate();
    return date.toLocaleDateString('vi-VN', options || {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format time ago (e.g., "5 phút trước")
 */
export function timeAgo(timestamp: Timestamp): string {
    const now = new Date();
    const date = timestamp.toDate();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const intervals = [
        { label: 'năm', seconds: 31536000 },
        { label: 'tháng', seconds: 2592000 },
        { label: 'tuần', seconds: 604800 },
        { label: 'ngày', seconds: 86400 },
        { label: 'giờ', seconds: 3600 },
        { label: 'phút', seconds: 60 },
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `${count} ${interval.label} trước`;
        }
    }

    return 'Vừa xong';
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): {
    score: number;
    label: string;
    color: string;
} {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const levels = [
        { min: 0, label: 'Rất yếu', color: 'bg-red-500' },
        { min: 2, label: 'Yếu', color: 'bg-orange-500' },
        { min: 3, label: 'Trung bình', color: 'bg-yellow-500' },
        { min: 4, label: 'Mạnh', color: 'bg-green-500' },
        { min: 5, label: 'Rất mạnh', color: 'bg-emerald-500' },
    ];

    const level = [...levels].reverse().find((l) => score >= l.min) || levels[0];

    return { score, label: level.label, color: level.color };
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.slice(0, length) + '...';
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Validate Vietnamese phone number
 */
export function isValidVietnamesePhone(phone: string): boolean {
    const regex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    return regex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Check if user has reached daily swipe limit
 */
export function hasReachedSwipeLimit(
    dailySwipes: number,
    isPremium: boolean
): boolean {
    const limit = isPremium ? 10 : 5;
    return dailySwipes >= limit;
}

/**
 * Get max tokens based on premium status
 */
export function getMaxTokens(isPremium: boolean): number {
    return isPremium ? 50 : 20;
}
