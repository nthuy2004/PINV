'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    User,
    MapPin,
    GraduationCap,
    Camera,
    Save,
    ArrowLeft,
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button, Input, Avatar } from '@/components/ui';
import { InterestsPicker, PhotoUpload } from '@/components/profile';
import { calculateAge } from '@/lib/utils';
import Link from 'next/link';

const profileSchema = z.object({
    displayName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
    dateOfBirth: z.string().min(1, 'Vui lòng nhập ngày sinh'),
    location: z.string().min(2, 'Vui lòng nhập nơi ở'),
    school: z.string().min(2, 'Vui lòng nhập tên trường'),
    class: z.string().min(1, 'Vui lòng nhập lớp'),
    studentId: z.string().min(1, 'Vui lòng nhập mã sinh viên'),
    bio: z.string().max(300, 'Giới thiệu không quá 300 ký tự').optional(),
});

type ProfileData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
    const router = useRouter();
    const { user, userData, refreshUserData } = useAuth();
    const [saving, setSaving] = useState(false);
    const [photos, setPhotos] = useState<string[]>([]);
    const [interests, setInterests] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'info' | 'photos' | 'interests'>('info');

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isDirty },
    } = useForm<ProfileData>({
        resolver: zodResolver(profileSchema),
    });

    // Populate form with existing data
    useEffect(() => {
        if (userData) {
            setValue('displayName', userData.displayName || '');
            setValue('location', userData.location || '');
            setValue('school', userData.school || '');
            setValue('class', userData.class || '');
            setValue('studentId', userData.studentId || '');
            setValue('bio', userData.bio || '');

            if (userData.dateOfBirth) {
                const date = userData.dateOfBirth.toDate();
                setValue('dateOfBirth', date.toISOString().split('T')[0]);
            }

            setPhotos(userData.photos || []);
            setInterests(userData.interests || []);
        }
    }, [userData, setValue]);

    const onSubmit = async (data: ProfileData) => {
        if (!user) return;

        setSaving(true);
        try {
            const dob = new Date(data.dateOfBirth);
            const age = calculateAge(dob);

            await updateDoc(doc(db, 'users', user.uid), {
                displayName: data.displayName,
                dateOfBirth: Timestamp.fromDate(dob),
                age,
                location: data.location,
                school: data.school,
                class: data.class,
                studentId: data.studentId,
                bio: data.bio || '',
                avatar: photos[0] || userData?.avatar,
                photos,
                interests,
                updatedAt: Timestamp.now(),
            });

            await refreshUserData();
            alert('Đã lưu thay đổi!');
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Đã có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    if (!userData) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="spinner w-8 h-8 border-primary-500" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href="/home"
                    className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-xl"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold">Chỉnh sửa hồ sơ</h1>
            </div>

            {/* Profile header */}
            <div className="card p-6 mb-6 text-center">
                <Avatar
                    src={photos[0] || userData.avatar}
                    name={userData.displayName}
                    size="xl"
                    verified={userData.isVerified}
                    className="mx-auto mb-4"
                />
                <h2 className="text-xl font-bold">{userData.displayName}</h2>
                <p className="text-dark-500">{userData.school}</p>
                {userData.isVerified && (
                    <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm rounded-full">
                        ✓ Đã xác thực
                    </span>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
                {[
                    { id: 'info', label: 'Thông tin', icon: User },
                    { id: 'photos', label: 'Ảnh', icon: Camera },
                    { id: 'interests', label: 'Sở thích', icon: GraduationCap },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === tab.id
                                ? 'bg-primary-500 text-dark-900'
                                : 'bg-dark-100 dark:bg-dark-700 text-dark-600 dark:text-dark-300'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <form onSubmit={handleSubmit(onSubmit)}>
                {activeTab === 'info' && (
                    <div className="card p-6 space-y-5">
                        <Input
                            label="Họ và tên"
                            leftIcon={<User size={20} />}
                            error={errors.displayName?.message}
                            {...register('displayName')}
                        />

                        <Input
                            label="Ngày sinh"
                            type="date"
                            error={errors.dateOfBirth?.message}
                            {...register('dateOfBirth')}
                        />

                        <Input
                            label="Nơi ở"
                            leftIcon={<MapPin size={20} />}
                            error={errors.location?.message}
                            {...register('location')}
                        />

                        <Input
                            label="Trường"
                            leftIcon={<GraduationCap size={20} />}
                            error={errors.school?.message}
                            {...register('school')}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Lớp"
                                error={errors.class?.message}
                                {...register('class')}
                            />
                            <Input
                                label="Mã sinh viên"
                                error={errors.studentId?.message}
                                {...register('studentId')}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-1.5">
                                Giới thiệu bản thân
                            </label>
                            <textarea
                                className="input min-h-24 resize-none"
                                maxLength={300}
                                {...register('bio')}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'photos' && user && (
                    <div className="card p-6">
                        <PhotoUpload
                            photos={photos}
                            onChange={setPhotos}
                            userId={user.uid}
                            min={3}
                            max={6}
                        />
                    </div>
                )}

                {activeTab === 'interests' && (
                    <div className="card p-6">
                        <InterestsPicker
                            selected={interests}
                            onChange={setInterests}
                            min={5}
                            max={15}
                        />
                    </div>
                )}

                {/* Save button */}
                <div className="mt-6">
                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        loading={saving}
                        icon={<Save className="w-5 h-5" />}
                    >
                        Lưu thay đổi
                    </Button>
                </div>
            </form>
        </div>
    );
}
