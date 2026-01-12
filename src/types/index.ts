import { Timestamp, GeoPoint } from 'firebase/firestore';

// ============ User Types ============
export interface User {
    uid: string;
    email: string;
    phone?: string;
    username: string;

    // Profile
    displayName: string;
    dateOfBirth: Timestamp;
    age: number;
    location: string; // Nơi ở
    school: string;
    class: string;
    studentId: string;
    avatar: string; // URL
    photos: string[]; // min 3
    bio?: string;
    interests: string[]; // min 5

    // Status
    isPremium: boolean;
    premiumExpiry?: Timestamp;
    isVerified: boolean; // Tick xanh
    isActive: boolean;
    lastLocation?: GeoPoint;
    lastOnline: Timestamp;

    // Limits
    dailySwipes: number;
    lastSwipeReset: Timestamp;
    tokens: number;
    maxTokens: number; // 20 or 50

    // Metadata
    createdAt: Timestamp;
    updatedAt: Timestamp;

    // Review status
    reviewStatus: 'pending' | 'approved' | 'rejected';
}

export interface UserProfile extends Omit<User, 'uid' | 'email' | 'phone' | 'createdAt' | 'updatedAt'> {
    uid: string;
}

// ============ Matching Types ============
export interface Like {
    id?: string;
    fromUserId: string;
    toUserId: string;
    createdAt: Timestamp;
    isMatched: boolean;
}

export interface Match {
    id?: string;
    users: string[]; // [userA, userB]
    chatId: string;
    createdAt: Timestamp;
    isFriend: boolean;
}

// ============ Chat Types ============
export interface Chat {
    id: string;
    type: 'direct' | 'group';
    participants: string[];
    lastMessage?: Message;
    createdAt: Timestamp;
    updatedAt: Timestamp;

    // Group specific
    groupId?: string;
}

export interface Message {
    id?: string;
    chatId: string;
    senderId: string;
    content: string;
    type: 'text' | 'image' | 'file' | 'location';
    fileUrl?: string;
    fileName?: string;
    location?: GeoPoint;
    createdAt: Timestamp;
    readBy: string[];
}

// ============ Group Types ============
export interface StudyGroup {
    id: string;
    name: string; // Tên môn học
    description: string;
    location: string; // Địa điểm học
    locationCoords?: GeoPoint;
    isPublic?: boolean; // Nhóm công khai hay riêng tư

    creatorId: string;
    members: string[]; // max 5
    membersCanCreateEvent: boolean;

    chatId: string;
    createdAt: Timestamp;
}

export interface Event {
    id: string;
    groupId: string;
    title: string;
    description?: string;
    location: string;
    locationCoords?: GeoPoint;

    startTime: Timestamp;
    endTime: Timestamp;
    reminders: number[]; // minutes before

    createdBy: string;
    attendees: string[];
    googleCalendarEventId?: string;

    createdAt: Timestamp;
}

// ============ Token & Voucher Types ============
export interface TokenTransaction {
    id?: string;
    userId: string;
    amount: number; // + or -
    type: 'check_in' | 'study_complete' | 'voucher_redeem' | 'daily_bonus';
    description: string;
    createdAt: Timestamp;
}

export interface Voucher {
    id: string;
    name: string;
    description: string;
    tokenCost: number;
    quantity: number;
    dailyLimit: number;
    cooldownHours: number;
    requiresReview: boolean;
    imageUrl?: string;
    isActive: boolean;
    createdAt: Timestamp;
}

export interface VoucherRedemption {
    id?: string;
    userId: string;
    voucherId: string;
    status: 'pending' | 'approved' | 'rejected';
    redeemedAt: Timestamp;
    reviewedBy?: string;
    reviewedAt?: Timestamp;
}

// ============ Badge Types ============
export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    criteria: {
        type: 'matches' | 'study_sessions' | 'streak' | 'tokens';
        count: number;
    };
}

export interface UserBadge {
    id?: string;
    userId: string;
    badgeId: string;
    earnedAt: Timestamp;
}

// ============ Moderation Types ============
export interface Report {
    id?: string;
    reporterId: string;
    reportedUserId: string;
    reason: string;
    description?: string;
    status: 'pending' | 'resolved' | 'dismissed';
    createdAt: Timestamp;
    resolvedBy?: string;
    resolvedAt?: Timestamp;
}

export interface Block {
    id?: string;
    blockerId: string;
    blockedId: string;
    createdAt: Timestamp;
}

// ============ Location Types ============
export interface StudyLocation {
    id: string;
    name: string;
    address: string;
    coords: GeoPoint;
    type: 'library' | 'cafe' | 'coworking' | 'other';
    imageUrl?: string;
    rating?: number;
    createdBy: string; // admin
    createdAt: Timestamp;
}

// ============ Notification Types ============
export interface Notification {
    id?: string;
    userId: string;
    type: 'match' | 'message' | 'group_invite' | 'event_reminder' | 'badge_earned' | 'system';
    title: string;
    body: string;
    data?: Record<string, string>;
    read: boolean;
    createdAt: Timestamp;
}

// ============ Interest Options ============
export const INTEREST_OPTIONS = [
    // Học tập
    'Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Văn học',
    'Lịch sử', 'Địa lý', 'Tiếng Anh', 'Tiếng Nhật', 'Tiếng Hàn',
    'Lập trình', 'AI/Machine Learning', 'Web Development', 'Mobile App', 'Data Science',
    'Kinh tế', 'Marketing', 'Tài chính', 'Kế toán', 'Quản trị kinh doanh',
    'Y học', 'Dược học', 'Luật', 'Kiến trúc', 'Thiết kế đồ họa',

    // Sở thích
    'Đọc sách', 'Viết lách', 'Âm nhạc', 'Chơi guitar', 'Piano',
    'Vẽ tranh', 'Nhiếp ảnh', 'Điện ảnh', 'Gaming', 'Esports',
    'Thể thao', 'Bóng đá', 'Bóng rổ', 'Cầu lông', 'Bơi lội',
    'Yoga', 'Gym', 'Chạy bộ', 'Leo núi', 'Du lịch',
    'Nấu ăn', 'Cà phê', 'Board game', 'Anime/Manga', 'K-pop',

    // Soft skills
    'Public speaking', 'Leadership', 'Teamwork', 'Time management', 'Problem solving',
] as const;

export type Interest = typeof INTEREST_OPTIONS[number];
