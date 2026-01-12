'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    getDoc,
} from 'firebase/firestore';
import { MessageCircle, Search } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { Chat, User } from '@/types';
import { Avatar, Input } from '@/components/ui';
import { cn, timeAgo, truncate } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

interface ChatWithUser extends Chat {
    otherUser: User;
}

export default function ChatListPage() {
    const { user } = useAuth();
    const [chats, setChats] = useState<ChatWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!user) return;

        const chatsQuery = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', user.uid),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
            const chatPromises = snapshot.docs.map(async (chatDoc) => {
                const chatData = { id: chatDoc.id, ...chatDoc.data() } as Chat;

                // Get other user
                const otherUserId = chatData.participants.find((id) => id !== user.uid);
                if (otherUserId) {
                    const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
                    if (otherUserDoc.exists()) {
                        return {
                            ...chatData,
                            otherUser: { uid: otherUserId, ...otherUserDoc.data() } as User,
                        };
                    }
                }
                return null;
            });

            const resolvedChats = (await Promise.all(chatPromises)).filter(
                (chat): chat is ChatWithUser => chat !== null
            );

            setChats(resolvedChats);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const filteredChats = chats.filter((chat) =>
        chat.otherUser.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="spinner w-8 h-8 border-primary-500" />
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <header className="px-6 py-4 border-b border-dark-100 dark:border-dark-700">
                <h1 className="text-2xl font-bold mb-4">Tin nhắn</h1>
                <Input
                    placeholder="Tìm kiếm cuộc trò chuyện..."
                    leftIcon={<Search size={20} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </header>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto">
                {filteredChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-20 h-20 bg-dark-100 dark:bg-dark-700 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="w-10 h-10 text-dark-400" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Chưa có tin nhắn</h3>
                        <p className="text-dark-500">
                            {searchQuery
                                ? 'Không tìm thấy cuộc trò chuyện nào'
                                : 'Match với ai đó để bắt đầu trò chuyện!'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-dark-100 dark:divide-dark-700">
                        {filteredChats.map((chat) => (
                            <Link
                                key={chat.id}
                                href={`/chat/${chat.id}`}
                                className="flex items-center gap-4 px-6 py-4 hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors"
                            >
                                <Avatar
                                    src={chat.otherUser.avatar}
                                    name={chat.otherUser.displayName}
                                    size="lg"
                                    verified={chat.otherUser.isVerified}
                                />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-semibold truncate">
                                            {chat.otherUser.displayName}
                                        </h3>
                                        {chat.lastMessage && (
                                            <span className="text-xs text-dark-500">
                                                {timeAgo(chat.lastMessage.createdAt as Timestamp)}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-dark-500 truncate">
                                        {chat.lastMessage
                                            ? chat.lastMessage.senderId === user?.uid
                                                ? `Bạn: ${truncate(chat.lastMessage.content, 30)}`
                                                : truncate(chat.lastMessage.content, 40)
                                            : 'Bắt đầu cuộc trò chuyện!'}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
