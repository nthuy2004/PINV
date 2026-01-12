import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

// Mock users data
const MOCK_USERS = [
    {
        email: 'kimthan@example.com',
        password: 'Test123456!',
        displayName: 'Kim Thần',
        age: 21,
        location: 'Hà Nội',
        school: 'Đại học Bách Khoa Hà Nội',
        class: 'K65-CNTT',
        studentId: '20200001',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop',
        photos: [
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop',
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop',
        ],
        interests: ['Lập trình', 'AI/Machine Learning', 'Đọc sách', 'Cà phê', 'Gaming'],
        bio: 'Đang học năm 3, chuyên ngành CNTT. Thích học nhóm và chia sẻ kiến thức!',
    },
    {
        email: 'minhanh@example.com',
        password: 'Test123456!',
        displayName: 'Minh Anh',
        age: 20,
        location: 'Hà Nội',
        school: 'Đại học Kinh tế Quốc dân',
        class: 'K66-MKT',
        studentId: '20210002',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop',
        photos: [
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop',
            'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
        ],
        interests: ['Kinh tế', 'Marketing', 'Tiếng Anh', 'Yoga', 'Du lịch'],
        bio: 'Sinh viên năm 2 Marketing. Đang tìm bạn học IELTS và các môn chuyên ngành.',
    },
    {
        email: 'ducnam@example.com',
        password: 'Test123456!',
        displayName: 'Đức Nam',
        age: 22,
        location: 'Hà Nội',
        school: 'Đại học FPT',
        class: 'K64-SE',
        studentId: '20190003',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
        photos: [
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop',
        ],
        interests: ['Web Development', 'Mobile App', 'Bóng đá', 'Gaming', 'Esports'],
        bio: 'Full-stack developer. Thích làm side projects và hackathons!',
    },
    {
        email: 'thuhang@example.com',
        password: 'Test123456!',
        displayName: 'Thu Hằng',
        age: 19,
        location: 'Hà Nội',
        school: 'Đại học Ngoại Thương',
        class: 'K67-KTQT',
        studentId: '20220004',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop',
        photos: [
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop',
            'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop',
            'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=600&fit=crop',
        ],
        interests: ['Kinh tế quốc tế', 'Tiếng Nhật', 'Piano', 'Nhiếp ảnh', 'Nấu ăn'],
        bio: 'Năm nhất FTU. Muốn tìm bạn học tiếng Nhật N2 cùng!',
    },
    {
        email: 'hoangminh@example.com',
        password: 'Test123456!',
        displayName: 'Hoàng Minh',
        age: 23,
        location: 'TP.HCM',
        school: 'Đại học Bách Khoa TP.HCM',
        class: 'K63-DTVT',
        studentId: '20180005',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
        photos: [
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
            'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=600&fit=crop',
            'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=600&fit=crop',
        ],
        interests: ['Điện tử', 'IoT', 'Arduino', 'Gym', 'Chạy bộ'],
        bio: 'Năm cuối DTVT. Đang làm đồ án tốt nghiệp về IoT. Cần bạn học cùng!',
    },
];

export async function POST(request: NextRequest) {
    try {
        const auth = getAdminAuth();
        const createdUsers: string[] = [];

        for (const mockUser of MOCK_USERS) {
            try {
                // Create user in Firebase Auth
                const userRecord = await auth.createUser({
                    email: mockUser.email,
                    password: mockUser.password,
                    displayName: mockUser.displayName,
                });

                // Create user document in Firestore
                await adminDb.collection('users').doc(userRecord.uid).set({
                    uid: userRecord.uid,
                    email: mockUser.email,
                    username: mockUser.email.split('@')[0],
                    displayName: mockUser.displayName,
                    dateOfBirth: Timestamp.fromDate(new Date(2003, 0, 1)),
                    age: mockUser.age,
                    location: mockUser.location,
                    school: mockUser.school,
                    class: mockUser.class,
                    studentId: mockUser.studentId,
                    avatar: mockUser.avatar,
                    photos: mockUser.photos,
                    interests: mockUser.interests,
                    bio: mockUser.bio,
                    tokens: 100,
                    dailySwipes: 0,
                    lastSwipeReset: Timestamp.now(),
                    isPremium: false,
                    isActive: true,
                    isVerified: true,
                    reviewStatus: 'approved',
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                });

                createdUsers.push(mockUser.displayName);
            } catch (error: any) {
                // Skip if user already exists
                if (error.code === 'auth/email-already-exists') {
                    console.log(`User ${mockUser.email} already exists, skipping...`);
                    continue;
                }
                throw error;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Created ${createdUsers.length} mock users`,
            users: createdUsers,
        });
    } catch (error) {
        console.error('Error creating mock users:', error);
        return NextResponse.json(
            { error: 'Failed to create mock users' },
            { status: 500 }
        );
    }
}
