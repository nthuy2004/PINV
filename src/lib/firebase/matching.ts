import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    setDoc,
    Timestamp,
    orderBy,
    limit as firestoreLimit,
    GeoPoint
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User, Like, Match } from '@/types';
import { calculateDistance } from '@/lib/utils';

// Matching score weights
const WEIGHTS = {
    SAME_SCHOOL: 100,
    PREMIUM: 50,
    DISTANCE: 40, // Max points for distance
    SAME_LOCATION: 30,
    COMMON_INTEREST: 5, // Per interest, max 25
    SAME_AGE: 10,
};

interface CandidateScore {
    user: User;
    score: number;
    reasons: string[];
}

/**
 * Calculate matching score between two users
 */
export function calculateMatchScore(
    currentUser: User,
    candidate: User
): CandidateScore {
    let score = 0;
    const reasons: string[] = [];

    // 1. Same school (+100)
    if (currentUser.school.toLowerCase() === candidate.school.toLowerCase()) {
        score += WEIGHTS.SAME_SCHOOL;
        reasons.push('Cùng trường');
    }

    // 2. Premium users (+50)
    if (candidate.isPremium) {
        score += WEIGHTS.PREMIUM;
        reasons.push('Premium');
    }

    // 3. Distance (up to +40, decreases with distance)
    if (currentUser.lastLocation && candidate.lastLocation) {
        const distance = calculateDistance(
            currentUser.lastLocation.latitude,
            currentUser.lastLocation.longitude,
            candidate.lastLocation.latitude,
            candidate.lastLocation.longitude
        );

        // Max 40 points if within 1km, decreasing to 0 at 20km
        const distanceScore = Math.max(0, WEIGHTS.DISTANCE * (1 - distance / 20));
        score += distanceScore;

        if (distance < 5) {
            reasons.push(`Gần bạn (${distance.toFixed(1)}km)`);
        }
    }

    // 4. Same location/area (+30)
    if (currentUser.location.toLowerCase() === candidate.location.toLowerCase()) {
        score += WEIGHTS.SAME_LOCATION;
        reasons.push('Cùng khu vực');
    }

    // 5. Common interests (+5 each, max 25)
    const commonInterests = currentUser.interests.filter(
        (interest) => candidate.interests.includes(interest)
    );
    const interestScore = Math.min(commonInterests.length * WEIGHTS.COMMON_INTEREST, 25);
    score += interestScore;

    if (commonInterests.length > 0) {
        reasons.push(`${commonInterests.length} sở thích chung`);
    }

    // 6. Same age (+10, ±2 years still counts)
    if (Math.abs(currentUser.age - candidate.age) <= 2) {
        score += WEIGHTS.SAME_AGE;
        reasons.push('Cùng độ tuổi');
    }

    return { user: candidate, score, reasons };
}

/**
 * Get potential matches for a user
 */
export async function getPotentialMatches(
    userId: string,
    limit: number = 20
): Promise<CandidateScore[]> {
    // Get current user
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
        throw new Error('User not found');
    }
    const currentUser = { uid: userId, ...userDoc.data() } as User;

    // Get users that current user has already liked or been matched with
    const likesQuery = query(
        collection(db, 'likes'),
        where('fromUserId', '==', userId)
    );
    const likesSnapshot = await getDocs(likesQuery);
    const likedUserIds = new Set(likesSnapshot.docs.map((doc) => doc.data().toUserId));

    // Get blocked users
    const blocksQuery = query(
        collection(db, 'blocks'),
        where('blockerId', '==', userId)
    );
    const blocksSnapshot = await getDocs(blocksQuery);
    const blockedUserIds = new Set(blocksSnapshot.docs.map((doc) => doc.data().blockedId));

    // Get users who blocked current user
    const blockedByQuery = query(
        collection(db, 'blocks'),
        where('blockedId', '==', userId)
    );
    const blockedBySnapshot = await getDocs(blockedByQuery);
    blockedBySnapshot.docs.forEach((doc) => blockedUserIds.add(doc.data().blockerId));

    // Get matched users
    const matchesQuery = query(
        collection(db, 'matches'),
        where('users', 'array-contains', userId)
    );
    const matchesSnapshot = await getDocs(matchesQuery);
    const matchedUserIds = new Set<string>();
    matchesSnapshot.docs.forEach((doc) => {
        const users = doc.data().users as string[];
        users.forEach((id) => {
            if (id !== userId) matchedUserIds.add(id);
        });
    });

    // Get all active users with approved profiles
    const usersQuery = query(
        collection(db, 'users'),
        where('isActive', '==', true),
        where('reviewStatus', '==', 'approved')
    );
    const usersSnapshot = await getDocs(usersQuery);

    // Filter and score candidates
    const candidates: CandidateScore[] = [];

    for (const userDoc of usersSnapshot.docs) {
        const candidateId = userDoc.id;

        // Skip current user and already processed users
        if (
            candidateId === userId ||
            likedUserIds.has(candidateId) ||
            blockedUserIds.has(candidateId) ||
            matchedUserIds.has(candidateId)
        ) {
            continue;
        }

        const candidate = { uid: candidateId, ...userDoc.data() } as User;
        const scoreResult = calculateMatchScore(currentUser, candidate);
        candidates.push(scoreResult);
    }

    // Check if any candidates have liked current user (boost their score)
    const likedByQuery = query(
        collection(db, 'likes'),
        where('toUserId', '==', userId),
        where('isMatched', '==', false)
    );
    const likedBySnapshot = await getDocs(likedByQuery);
    const likedByUserIds = new Set(likedBySnapshot.docs.map((doc) => doc.data().fromUserId));

    // Boost score for users who already liked current user
    candidates.forEach((candidate) => {
        if (likedByUserIds.has(candidate.user.uid)) {
            candidate.score += 200; // Big boost to prioritize potential matches
            candidate.reasons.unshift('Đã thích bạn');
        }
    });

    // Sort by score (highest first) and limit
    candidates.sort((a, b) => b.score - a.score);

    return candidates.slice(0, limit);
}

/**
 * Record a like action
 */
export async function recordLike(
    fromUserId: string,
    toUserId: string
): Promise<{ isMatch: boolean; matchId?: string }> {
    const likeId = `${fromUserId}_${toUserId}`;

    // Check if reverse like exists
    const reverseLikeId = `${toUserId}_${fromUserId}`;
    const reverseLikeDoc = await getDoc(doc(db, 'likes', reverseLikeId));

    const isMatch = reverseLikeDoc.exists() && !reverseLikeDoc.data().isMatched;

    // Create like document
    await setDoc(doc(db, 'likes', likeId), {
        fromUserId,
        toUserId,
        createdAt: Timestamp.now(),
        isMatched: isMatch,
    });

    if (isMatch) {
        // Update reverse like
        await setDoc(doc(db, 'likes', reverseLikeId), {
            ...reverseLikeDoc.data(),
            isMatched: true,
        });

        // Create match and chat
        const matchId = `${[fromUserId, toUserId].sort().join('_')}`;
        const chatId = `chat_${matchId}`;

        await setDoc(doc(db, 'matches', matchId), {
            users: [fromUserId, toUserId],
            chatId,
            createdAt: Timestamp.now(),
            isFriend: false,
        });

        await setDoc(doc(db, 'chats', chatId), {
            id: chatId,
            type: 'direct',
            participants: [fromUserId, toUserId],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });

        return { isMatch: true, matchId };
    }

    return { isMatch: false };
}

/**
 * Record a decline action
 */
export async function recordDecline(
    fromUserId: string,
    toUserId: string
): Promise<void> {
    const declineId = `${fromUserId}_${toUserId}`;

    await setDoc(doc(db, 'declines', declineId), {
        fromUserId,
        toUserId,
        createdAt: Timestamp.now(),
    });
}

/**
 * Update daily swipe count
 */
export async function updateSwipeCount(userId: string): Promise<number> {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        throw new Error('User not found');
    }

    const userData = userDoc.data() as User;
    const now = new Date();
    const lastReset = userData.lastSwipeReset?.toDate() || new Date(0);

    // Check if we need to reset (new day)
    const isNewDay = now.toDateString() !== lastReset.toDateString();

    const newCount = isNewDay ? 1 : userData.dailySwipes + 1;

    await setDoc(userRef, {
        dailySwipes: newCount,
        lastSwipeReset: isNewDay ? Timestamp.now() : userData.lastSwipeReset,
        updatedAt: Timestamp.now(),
    }, { merge: true });

    return newCount;
}
