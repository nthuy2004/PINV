'use client';

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    setDoc,
    addDoc,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { FriendCode } from '@/types';

/**
 * Generate a unique 6-character friend code
 */
function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Get or create friend code for a user
 */
export async function getFriendCode(userId: string): Promise<string> {
    // Check if user already has a code
    const codeQuery = query(
        collection(db, 'friendCodes'),
        where('userId', '==', userId)
    );
    const snapshot = await getDocs(codeQuery);

    if (!snapshot.empty) {
        return snapshot.docs[0].data().code;
    }

    // Generate unique code
    let code: string;
    let isUnique = false;

    do {
        code = generateCode();
        const existingQuery = query(
            collection(db, 'friendCodes'),
            where('code', '==', code)
        );
        const existing = await getDocs(existingQuery);
        isUnique = existing.empty;
    } while (!isUnique);

    // Save code
    await addDoc(collection(db, 'friendCodes'), {
        userId,
        code,
        createdAt: Timestamp.now(),
    });

    return code;
}

/**
 * Match with someone by entering their friend code
 * Creates an instant match + chat (no need for mutual like)
 */
export async function matchByFriendCode(
    userId: string,
    friendCode: string
): Promise<{ success: boolean; matchId?: string; error?: string }> {
    // Find user by friend code
    const codeQuery = query(
        collection(db, 'friendCodes'),
        where('code', '==', friendCode.toUpperCase())
    );
    const codeSnapshot = await getDocs(codeQuery);

    if (codeSnapshot.empty) {
        return { success: false, error: 'Mã bạn bè không tồn tại' };
    }

    const targetUserId = codeSnapshot.docs[0].data().userId;

    if (targetUserId === userId) {
        return { success: false, error: 'Bạn không thể nhập mã của chính mình' };
    }

    // Check if already matched
    const matchId = `${[userId, targetUserId].sort().join('_')}`;
    const existingMatch = await getDoc(doc(db, 'matches', matchId));

    if (existingMatch.exists()) {
        return { success: false, error: 'Các bạn đã match với nhau rồi' };
    }

    // Create match + chat instantly
    const chatId = `chat_${matchId}`;

    await setDoc(doc(db, 'matches', matchId), {
        users: [userId, targetUserId].sort(),
        chatId,
        createdAt: Timestamp.now(),
        isFriend: true, // Mark as real-world friend
    });

    await setDoc(doc(db, 'chats', chatId), {
        id: chatId,
        type: 'direct',
        participants: [userId, targetUserId].sort(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

    // Create mutual likes 
    await setDoc(doc(db, 'likes', `${userId}_${targetUserId}`), {
        fromUserId: userId,
        toUserId: targetUserId,
        createdAt: Timestamp.now(),
        isMatched: true,
    });

    await setDoc(doc(db, 'likes', `${targetUserId}_${userId}`), {
        fromUserId: targetUserId,
        toUserId: userId,
        createdAt: Timestamp.now(),
        isMatched: true,
    });

    // Get user name for notification
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userName = userDoc.exists() ? userDoc.data().displayName : 'Ai đó';

    // Notify the target user
    await addDoc(collection(db, 'notifications'), {
        userId: targetUserId,
        type: 'match',
        title: 'Match mới! 🎉',
        body: `${userName} đã match với bạn qua mã bạn bè`,
        data: { matchId, chatId },
        read: false,
        createdAt: Timestamp.now(),
    });

    return { success: true, matchId };
}
