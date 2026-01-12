'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    Send,
    Image as ImageIcon,
    Paperclip,
    MapPin,
    MoreVertical,
    ArrowLeft,
    Phone,
    Video,
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { uploadFile } from '@/lib/upload';
import { useAuth } from '@/lib/hooks/useAuth';
import { Message, User, Chat } from '@/types';
import { Avatar, Button } from '@/components/ui';
import { cn, timeAgo, formatFileSize } from '@/lib/utils';
import Link from 'next/link';

export default function ChatRoomPage() {
    const params = useParams();
    const chatId = params.id as string;
    const { user, userData } = useAuth();

    const [chat, setChat] = useState<Chat | null>(null);
    const [otherUser, setOtherUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch chat and other user info
    useEffect(() => {
        if (!chatId || !user) return;

        const fetchChat = async () => {
            const chatDoc = await getDoc(doc(db, 'chats', chatId));
            if (chatDoc.exists()) {
                const chatData = { id: chatDoc.id, ...chatDoc.data() } as Chat;
                setChat(chatData);

                // Get other user
                const otherUserId = chatData.participants.find((id) => id !== user.uid);
                if (otherUserId) {
                    const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
                    if (otherUserDoc.exists()) {
                        setOtherUser({ uid: otherUserId, ...otherUserDoc.data() } as User);
                    }
                }
            }
        };

        fetchChat();
    }, [chatId, user]);

    // Subscribe to messages
    useEffect(() => {
        if (!chatId) return;

        const messagesQuery = query(
            collection(db, 'chats', chatId, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const newMessages = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Message[];
            setMessages(newMessages);
        });

        return () => unsubscribe();
    }, [chatId]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (
        content: string,
        type: 'text' | 'image' | 'file' = 'text',
        fileUrl?: string,
        fileName?: string
    ) => {
        if (!user || !chatId) return;

        setSending(true);
        try {
            // Build message data, only include defined fields
            const messageData: Record<string, any> = {
                chatId,
                senderId: user.uid,
                content,
                type,
                createdAt: Timestamp.now(),
                readBy: [user.uid],
            };

            // Only add fileUrl and fileName if they are defined
            if (fileUrl) messageData.fileUrl = fileUrl;
            if (fileName) messageData.fileName = fileName;

            await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);

            // Update chat's last message
            await updateDoc(doc(db, 'chats', chatId), {
                lastMessage: {
                    content: type === 'text' ? content : `Đã gửi ${type === 'image' ? 'ảnh' : 'file'}`,
                    senderId: user.uid,
                    createdAt: Timestamp.now(),
                },
                updatedAt: Timestamp.now(),
            });

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleSend = () => {
        if (!newMessage.trim()) return;
        sendMessage(newMessage.trim());
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploading(true);
        try {
            const isImage = file.type.startsWith('image/');

            // Use local storage API instead of Firebase Storage
            const result = await uploadFile(file, `chats/${chatId}`);

            if (result.success && result.url) {
                await sendMessage(
                    file.name,
                    isImage ? 'image' : 'file',
                    result.url,
                    file.name
                );
            } else {
                alert(result.error || 'Đã có lỗi khi upload file');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    if (!chat || !otherUser) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="spinner w-8 h-8 border-primary-500" />
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-white dark:bg-dark-900">
            {/* Header */}
            <header className="flex items-center gap-4 px-4 py-3 border-b border-dark-100 dark:border-dark-700 bg-white dark:bg-dark-800">
                <Link href="/chat" className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </Link>

                <Avatar
                    src={otherUser.avatar}
                    name={otherUser.displayName}
                    size="md"
                    verified={otherUser.isVerified}
                />

                <div className="flex-1 min-w-0">
                    <h2 className="font-semibold truncate">{otherUser.displayName}</h2>
                    <p className="text-sm text-dark-500 truncate">{otherUser.school}</p>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-xl">
                        <Phone className="w-5 h-5 text-dark-500" />
                    </button>
                    <button className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-xl">
                        <Video className="w-5 h-5 text-dark-500" />
                    </button>
                    <button className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-xl">
                        <MoreVertical className="w-5 h-5 text-dark-500" />
                    </button>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                    const isOwn = message.senderId === user?.uid;

                    return (
                        <div
                            key={message.id}
                            className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
                        >
                            <div
                                className={cn(
                                    'max-w-[70%] rounded-2xl px-4 py-2',
                                    isOwn
                                        ? 'bg-primary-500 text-dark-900'
                                        : 'bg-dark-100 dark:bg-dark-700'
                                )}
                            >
                                {message.type === 'text' && (
                                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                )}

                                {message.type === 'image' && (
                                    <div className="relative w-48 h-48 rounded-lg overflow-hidden">
                                        <Image
                                            src={message.fileUrl!}
                                            alt="Shared image"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}

                                {message.type === 'file' && (
                                    <a
                                        href={message.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 hover:underline"
                                    >
                                        <Paperclip className="w-4 h-4" />
                                        <span className="truncate">{message.fileName}</span>
                                    </a>
                                )}

                                <p
                                    className={cn(
                                        'text-xs mt-1',
                                        isOwn ? 'text-dark-700' : 'text-dark-500'
                                    )}
                                >
                                    {message.createdAt && timeAgo(message.createdAt as Timestamp)}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-dark-100 dark:border-dark-700 bg-white dark:bg-dark-800">
                <div className="flex items-end gap-3">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-xl text-dark-500"
                    >
                        {uploading ? (
                            <div className="spinner w-5 h-5" />
                        ) : (
                            <Paperclip className="w-5 h-5" />
                        )}
                    </button>

                    <div className="flex-1 relative">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Nhập tin nhắn..."
                            className="input resize-none min-h-[44px] max-h-32 py-2.5"
                            rows={1}
                        />
                    </div>

                    <Button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sending}
                        className="shrink-0"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
