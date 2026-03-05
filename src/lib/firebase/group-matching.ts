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
    updateDoc,
    arrayUnion,
    arrayRemove,
    Timestamp,
    orderBy,
    limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SwipeGroup, GroupJoinRequest, User } from '@/types';

/**
 * Create a swipe group from two matched users
 */
export async function createSwipeGroup(
    creatorId: string,
    partnerId: string,
    name: string,
    description: string
): Promise<string> {
    const chatId = `swipe_group_chat_${Date.now()}`;

    const groupRef = await addDoc(collection(db, 'swipeGroups'), {
        name,
        description,
        creatorId,
        members: [creatorId, partnerId],
        maxMembers: 5,
        pendingRequests: [],
        status: 'active',
        chatId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

    // Create group chat
    await setDoc(doc(db, 'chats', chatId), {
        id: chatId,
        type: 'group',
        participants: [creatorId, partnerId],
        groupId: groupRef.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

    return groupRef.id;
}

/**
 * Get swipe groups for discovery (groups user is not in and hasn't swiped on)
 */
export async function getSwipeGroupsForDiscovery(
    userId: string,
    maxResults: number = 20
): Promise<(SwipeGroup & { memberProfiles: User[] })[]> {
    // Get groups user has already swiped on
    const swipedQuery = query(
        collection(db, 'groupSwipes'),
        where('userId', '==', userId)
    );
    const swipedSnapshot = await getDocs(swipedQuery);
    const swipedGroupIds = new Set(swipedSnapshot.docs.map(d => d.data().groupId));

    // Get all active swipe groups
    const groupsQuery = query(
        collection(db, 'swipeGroups'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(50)
    );
    const groupsSnapshot = await getDocs(groupsQuery);

    const results: (SwipeGroup & { memberProfiles: User[] })[] = [];

    for (const groupDoc of groupsSnapshot.docs) {
        const group = { id: groupDoc.id, ...groupDoc.data() } as SwipeGroup;

        // Skip if user is member or already swiped
        if (group.members.includes(userId) || swipedGroupIds.has(group.id)) {
            continue;
        }

        // Skip full groups
        if (group.members.length >= group.maxMembers) {
            continue;
        }

        // Fetch member profiles
        const memberProfiles: User[] = [];
        for (const memberId of group.members) {
            const memberDoc = await getDoc(doc(db, 'users', memberId));
            if (memberDoc.exists()) {
                memberProfiles.push({ uid: memberId, ...memberDoc.data() } as User);
            }
        }

        results.push({ ...group, memberProfiles });

        if (results.length >= maxResults) break;
    }

    return results;
}

/**
 * Request to join a swipe group (user swipes right on group)
 */
export async function requestJoinGroup(
    userId: string,
    groupId: string
): Promise<void> {
    const groupDoc = await getDoc(doc(db, 'swipeGroups', groupId));
    if (!groupDoc.exists()) throw new Error('Group not found');

    const group = groupDoc.data() as SwipeGroup;

    if (group.members.length >= group.maxMembers) {
        throw new Error('Group is full');
    }

    // Record the swipe
    await setDoc(doc(db, 'groupSwipes', `${userId}_${groupId}`), {
        userId,
        groupId,
        action: 'like',
        createdAt: Timestamp.now(),
    });

    // Create join request
    const requestRef = await addDoc(collection(db, 'groupJoinRequests'), {
        userId,
        groupId,
        groupName: group.name,
        status: 'pending',
        createdAt: Timestamp.now(),
    });

    // Add to pending requests
    await updateDoc(doc(db, 'swipeGroups', groupId), {
        pendingRequests: arrayUnion(userId),
        updatedAt: Timestamp.now(),
    });

    // Send notification to all group members
    for (const memberId of group.members) {
        // Get requesting user profile
        const userDoc = await getDoc(doc(db, 'users', userId));
        const userName = userDoc.exists() ? userDoc.data().displayName : 'Ai đó';

        await addDoc(collection(db, 'notifications'), {
            userId: memberId,
            type: 'group_join_request',
            title: 'Yêu cầu tham gia nhóm',
            body: `${userName} muốn tham gia nhóm "${group.name}"`,
            data: {
                requestId: requestRef.id,
                groupId,
                requestUserId: userId,
            },
            read: false,
            createdAt: Timestamp.now(),
        });
    }
}

/**
 * Decline a group (swipe left)
 */
export async function declineGroup(
    userId: string,
    groupId: string
): Promise<void> {
    await setDoc(doc(db, 'groupSwipes', `${userId}_${groupId}`), {
        userId,
        groupId,
        action: 'decline',
        createdAt: Timestamp.now(),
    });
}

/**
 * Approve a join request
 */
export async function approveJoinRequest(
    reviewerId: string,
    requestId: string
): Promise<void> {
    const requestDoc = await getDoc(doc(db, 'groupJoinRequests', requestId));
    if (!requestDoc.exists()) throw new Error('Request not found');

    const request = requestDoc.data() as GroupJoinRequest;
    const groupDoc = await getDoc(doc(db, 'swipeGroups', request.groupId));
    if (!groupDoc.exists()) throw new Error('Group not found');

    const group = groupDoc.data() as SwipeGroup;

    // Check group not full
    if (group.members.length >= group.maxMembers) {
        throw new Error('Group is full');
    }

    // Update request
    await updateDoc(doc(db, 'groupJoinRequests', requestId), {
        status: 'approved',
        reviewedBy: reviewerId,
        reviewedAt: Timestamp.now(),
    });

    // Add user to group
    const newMembers = [...group.members, request.userId];
    await updateDoc(doc(db, 'swipeGroups', request.groupId), {
        members: arrayUnion(request.userId),
        pendingRequests: arrayRemove(request.userId),
        status: newMembers.length >= group.maxMembers ? 'full' : 'active',
        updatedAt: Timestamp.now(),
    });

    // Add user to group chat
    const chatsQuery = query(
        collection(db, 'chats'),
        where('groupId', '==', request.groupId)
    );
    const chatSnapshot = await getDocs(chatsQuery);
    if (!chatSnapshot.empty) {
        await updateDoc(doc(db, 'chats', chatSnapshot.docs[0].id), {
            participants: arrayUnion(request.userId),
        });
    }

    // Notify the user
    await addDoc(collection(db, 'notifications'), {
        userId: request.userId,
        type: 'group_invite',
        title: 'Đã được duyệt!',
        body: `Bạn đã được duyệt vào nhóm "${request.groupName}"`,
        data: { groupId: request.groupId },
        read: false,
        createdAt: Timestamp.now(),
    });
}

/**
 * Reject a join request
 */
export async function rejectJoinRequest(
    reviewerId: string,
    requestId: string
): Promise<void> {
    const requestDoc = await getDoc(doc(db, 'groupJoinRequests', requestId));
    if (!requestDoc.exists()) throw new Error('Request not found');

    const request = requestDoc.data() as GroupJoinRequest;

    await updateDoc(doc(db, 'groupJoinRequests', requestId), {
        status: 'rejected',
        reviewedBy: reviewerId,
        reviewedAt: Timestamp.now(),
    });

    await updateDoc(doc(db, 'swipeGroups', request.groupId), {
        pendingRequests: arrayRemove(request.userId),
        updatedAt: Timestamp.now(),
    });
}

/**
 * Get user's swipe groups
 */
export async function getMySwipeGroups(userId: string): Promise<SwipeGroup[]> {
    const groupsQuery = query(
        collection(db, 'swipeGroups'),
        where('members', 'array-contains', userId)
    );
    const snapshot = await getDocs(groupsQuery);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as SwipeGroup[];
}

/**
 * Get pending join requests for groups the user owns/is a member of
 */
export async function getPendingRequests(
    userId: string
): Promise<(GroupJoinRequest & { userProfile: User })[]> {
    // Get user's groups
    const myGroups = await getMySwipeGroups(userId);
    const groupIds = myGroups.map(g => g.id);

    if (groupIds.length === 0) return [];

    const results: (GroupJoinRequest & { userProfile: User })[] = [];

    // Firestore 'in' query supports max 30 items
    for (let i = 0; i < groupIds.length; i += 30) {
        const batch = groupIds.slice(i, i + 30);
        const requestsQuery = query(
            collection(db, 'groupJoinRequests'),
            where('groupId', 'in', batch),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(requestsQuery);

        for (const reqDoc of snapshot.docs) {
            const request = { id: reqDoc.id, ...reqDoc.data() } as GroupJoinRequest;

            const userDoc = await getDoc(doc(db, 'users', request.userId));
            if (userDoc.exists()) {
                results.push({
                    ...request,
                    userProfile: { uid: request.userId, ...userDoc.data() } as User,
                });
            }
        }
    }

    return results;
}

/**
 * Add member to group by friend code (owner only)
 */
export async function addMemberToGroupByCode(
    groupId: string,
    ownerUserId: string,
    friendCode: string
): Promise<void> {
    // Verify owner
    const groupDoc = await getDoc(doc(db, 'swipeGroups', groupId));
    if (!groupDoc.exists()) throw new Error('Group not found');

    const group = groupDoc.data() as SwipeGroup;
    if (!group.members.includes(ownerUserId)) {
        throw new Error('Only group members can add others');
    }

    if (group.members.length >= group.maxMembers) {
        throw new Error('Group is full');
    }

    // Find user by friend code
    const codeQuery = query(
        collection(db, 'friendCodes'),
        where('code', '==', friendCode.toUpperCase())
    );
    const codeSnapshot = await getDocs(codeQuery);
    if (codeSnapshot.empty) throw new Error('Friend code not found');

    const targetUserId = codeSnapshot.docs[0].data().userId;

    if (group.members.includes(targetUserId)) {
        throw new Error('User is already in the group');
    }

    // Add to group
    const newMembers = [...group.members, targetUserId];
    await updateDoc(doc(db, 'swipeGroups', groupId), {
        members: arrayUnion(targetUserId),
        status: newMembers.length >= group.maxMembers ? 'full' : 'active',
        updatedAt: Timestamp.now(),
    });

    // Add to group chat
    const chatsQuery = query(
        collection(db, 'chats'),
        where('groupId', '==', groupId)
    );
    const chatSnapshot = await getDocs(chatsQuery);
    if (!chatSnapshot.empty) {
        await updateDoc(doc(db, 'chats', chatSnapshot.docs[0].id), {
            participants: arrayUnion(targetUserId),
        });
    }

    // Notify added user
    await addDoc(collection(db, 'notifications'), {
        userId: targetUserId,
        type: 'group_invite',
        title: 'Đã được thêm vào nhóm!',
        body: `Bạn đã được thêm vào nhóm "${group.name}"`,
        data: { groupId },
        read: false,
        createdAt: Timestamp.now(),
    });
}
