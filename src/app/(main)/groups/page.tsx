'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    doc,
    updateDoc,
    arrayUnion,
    Timestamp,
    limit,
    orderBy,
} from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Users,
    Plus,
    MapPin,
    Calendar,
    X,
    Search,
    Settings,
    Globe,
    Lock,
    UserPlus,
    Check,
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { StudyGroup } from '@/types';
import { Avatar, Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

const createGroupSchema = z.object({
    name: z.string().min(2, 'Tên nhóm phải có ít nhất 2 ký tự'),
    description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự'),
    location: z.string().min(2, 'Vui lòng nhập địa điểm'),
    isPublic: z.boolean().default(true),
});

type CreateGroupData = z.infer<typeof createGroupSchema>;

export default function GroupsPage() {
    const { user, userData } = useAuth();
    const [activeTab, setActiveTab] = useState<'my' | 'explore'>('my');
    const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
    const [exploreGroups, setExploreGroups] = useState<StudyGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [joining, setJoining] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateGroupData>({
        resolver: zodResolver(createGroupSchema),
        defaultValues: {
            isPublic: true,
        },
    });

    // Fetch my groups
    useEffect(() => {
        if (!user) return;

        const fetchMyGroups = async () => {
            const groupsQuery = query(
                collection(db, 'groups'),
                where('members', 'array-contains', user.uid)
            );
            const snapshot = await getDocs(groupsQuery);
            const groupsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as StudyGroup[];

            setMyGroups(groupsData);
            setLoading(false);
        };

        fetchMyGroups();
    }, [user]);

    // Fetch explore groups (public groups user is not a member of)
    useEffect(() => {
        if (!user) return;

        const fetchExploreGroups = async () => {
            // Get all public groups
            const groupsQuery = query(
                collection(db, 'groups'),
                where('isPublic', '==', true),
                orderBy('createdAt', 'desc'),
                limit(50)
            );
            const snapshot = await getDocs(groupsQuery);
            const groupsData = snapshot.docs
                .map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }))
                .filter((group: any) => !group.members.includes(user.uid)) as StudyGroup[];

            setExploreGroups(groupsData);
        };

        if (activeTab === 'explore') {
            fetchExploreGroups();
        }
    }, [user, activeTab]);

    const handleCreateGroup = async (data: CreateGroupData) => {
        if (!user) return;

        setCreating(true);
        try {
            const chatId = `group_chat_${Date.now()}`;

            // Create group
            const groupRef = await addDoc(collection(db, 'groups'), {
                name: data.name,
                description: data.description,
                location: data.location,
                isPublic: data.isPublic,
                creatorId: user.uid,
                members: [user.uid],
                membersCanCreateEvent: true,
                chatId,
                createdAt: Timestamp.now(),
            });

            // Create group chat
            await addDoc(collection(db, 'chats'), {
                id: chatId,
                type: 'group',
                participants: [user.uid],
                groupId: groupRef.id,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });

            // Refresh groups list
            const newGroup: StudyGroup = {
                id: groupRef.id,
                name: data.name,
                description: data.description,
                location: data.location,
                isPublic: data.isPublic,
                creatorId: user.uid,
                members: [user.uid],
                membersCanCreateEvent: true,
                chatId,
                createdAt: Timestamp.now(),
            };

            setMyGroups([newGroup, ...myGroups]);
            setShowCreateModal(false);
            reset();
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Đã có lỗi xảy ra khi tạo nhóm');
        } finally {
            setCreating(false);
        }
    };

    const handleJoinGroup = async (group: StudyGroup) => {
        if (!user || joining) return;

        // Check if group is full
        if (group.members.length >= 5) {
            alert('Nhóm đã đầy (tối đa 5 thành viên)');
            return;
        }

        setJoining(group.id);
        try {
            // Add user to group
            await updateDoc(doc(db, 'groups', group.id), {
                members: arrayUnion(user.uid),
            });

            // Add user to group chat
            const chatsQuery = query(
                collection(db, 'chats'),
                where('groupId', '==', group.id)
            );
            const chatSnapshot = await getDocs(chatsQuery);
            if (!chatSnapshot.empty) {
                const chatDoc = chatSnapshot.docs[0];
                await updateDoc(doc(db, 'chats', chatDoc.id), {
                    participants: arrayUnion(user.uid),
                });
            }

            // Move group from explore to my groups
            setExploreGroups(exploreGroups.filter((g) => g.id !== group.id));
            setMyGroups([{ ...group, members: [...group.members, user.uid] }, ...myGroups]);
            setActiveTab('my');

            alert('Đã tham gia nhóm thành công!');
        } catch (error) {
            console.error('Error joining group:', error);
            alert('Đã có lỗi xảy ra');
        } finally {
            setJoining(null);
        }
    };

    // Filter groups by search
    const filteredExploreGroups = exploreGroups.filter(
        (group) =>
            group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            group.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="spinner w-8 h-8 border-primary-500" />
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Nhóm học</h1>
                    <p className="text-dark-500 mt-1">Cùng nhau học tập hiệu quả hơn</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} icon={<Plus className="w-5 h-5" />}>
                    Tạo nhóm mới
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('my')}
                    className={cn(
                        'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all',
                        activeTab === 'my'
                            ? 'bg-primary-500 text-dark-900'
                            : 'bg-white dark:bg-dark-800 hover:bg-dark-100 dark:hover:bg-dark-700'
                    )}
                >
                    <Users className="w-4 h-4" />
                    Nhóm của tôi ({myGroups.length})
                </button>
                <button
                    onClick={() => setActiveTab('explore')}
                    className={cn(
                        'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all',
                        activeTab === 'explore'
                            ? 'bg-primary-500 text-dark-900'
                            : 'bg-white dark:bg-dark-800 hover:bg-dark-100 dark:hover:bg-dark-700'
                    )}
                >
                    <Globe className="w-4 h-4" />
                    Khám phá
                </button>
            </div>

            {/* My Groups Tab */}
            {activeTab === 'my' && (
                <>
                    {myGroups.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-dark-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-10 h-10 text-dark-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Chưa có nhóm học nào</h3>
                            <p className="text-dark-500 mb-4">
                                Tạo nhóm mới hoặc khám phá các nhóm công khai để tham gia!
                            </p>
                            <div className="flex justify-center gap-3">
                                <Button onClick={() => setShowCreateModal(true)}>
                                    Tạo nhóm ngay
                                </Button>
                                <Button variant="secondary" onClick={() => setActiveTab('explore')}>
                                    Khám phá nhóm
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myGroups.map((group) => (
                                <Link
                                    key={group.id}
                                    href={`/groups/${group.id}`}
                                    className="card p-5 hover:shadow-card-hover transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                                            <Users className="w-6 h-6 text-primary-500" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {group.isPublic ? (
                                                <Globe className="w-4 h-4 text-dark-400" />
                                            ) : (
                                                <Lock className="w-4 h-4 text-dark-400" />
                                            )}
                                            <span className="text-sm text-dark-500">
                                                {group.members.length}/5
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="font-semibold text-lg mb-2">{group.name}</h3>
                                    <p className="text-dark-500 text-sm mb-4 line-clamp-2">
                                        {group.description}
                                    </p>

                                    <div className="flex items-center gap-2 text-sm text-dark-500">
                                        <MapPin className="w-4 h-4" />
                                        <span>{group.location}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Explore Groups Tab */}
            {activeTab === 'explore' && (
                <>
                    {/* Search */}
                    <div className="mb-6">
                        <div className="relative max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                            <input
                                type="text"
                                placeholder="Tìm nhóm học..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input pl-12"
                            />
                        </div>
                    </div>

                    {filteredExploreGroups.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-dark-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Globe className="w-10 h-10 text-dark-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">
                                {searchQuery ? 'Không tìm thấy nhóm' : 'Chưa có nhóm công khai'}
                            </h3>
                            <p className="text-dark-500 mb-4">
                                {searchQuery
                                    ? 'Thử tìm kiếm với từ khóa khác'
                                    : 'Hãy là người đầu tiên tạo nhóm công khai!'}
                            </p>
                            {!searchQuery && (
                                <Button onClick={() => setShowCreateModal(true)}>
                                    Tạo nhóm công khai
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredExploreGroups.map((group) => (
                                <div
                                    key={group.id}
                                    className="card p-5 hover:shadow-card-hover transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                                            <Users className="w-6 h-6 text-primary-500" />
                                        </div>
                                        <span className="text-sm text-dark-500">
                                            {group.members.length}/5 thành viên
                                        </span>
                                    </div>

                                    <h3 className="font-semibold text-lg mb-2">{group.name}</h3>
                                    <p className="text-dark-500 text-sm mb-4 line-clamp-2">
                                        {group.description}
                                    </p>

                                    <div className="flex items-center gap-2 text-sm text-dark-500 mb-4">
                                        <MapPin className="w-4 h-4" />
                                        <span>{group.location}</span>
                                    </div>

                                    <Button
                                        className="w-full"
                                        variant={group.members.length >= 5 ? 'secondary' : 'primary'}
                                        disabled={group.members.length >= 5 || joining === group.id}
                                        loading={joining === group.id}
                                        onClick={() => handleJoinGroup(group)}
                                        icon={group.members.length >= 5 ? undefined : <UserPlus className="w-4 h-4" />}
                                    >
                                        {group.members.length >= 5 ? 'Đã đầy' : 'Tham gia nhóm'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Create group modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card w-full max-w-md p-6 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Tạo nhóm học mới</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-xl"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(handleCreateGroup)} className="space-y-4">
                            <Input
                                label="Tên môn học / Nhóm"
                                placeholder="VD: Ôn thi IELTS 7.0"
                                error={errors.name?.message}
                                {...register('name')}
                            />

                            <div>
                                <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-1.5">
                                    Mô tả
                                </label>
                                <textarea
                                    placeholder="Mô tả chi tiết về mục tiêu và nội dung học tập..."
                                    className="input min-h-24 resize-none"
                                    {...register('description')}
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-accent-300">
                                        {errors.description.message}
                                    </p>
                                )}
                            </div>

                            <Input
                                label="Địa điểm học"
                                placeholder="VD: Thư viện Quốc gia, Hà Nội"
                                leftIcon={<MapPin size={20} />}
                                error={errors.location?.message}
                                {...register('location')}
                            />

                            {/* Public/Private toggle */}
                            <div className="flex items-center justify-between p-4 bg-dark-50 dark:bg-dark-700 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Globe className="w-5 h-5 text-primary-500" />
                                    <div>
                                        <p className="font-medium">Nhóm công khai</p>
                                        <p className="text-sm text-dark-500">
                                            Mọi người có thể tìm và tham gia
                                        </p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        defaultChecked
                                        {...register('isPublic')}
                                    />
                                    <div className="w-11 h-6 bg-dark-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Hủy
                                </Button>
                                <Button type="submit" className="flex-1" loading={creating}>
                                    Tạo nhóm
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
