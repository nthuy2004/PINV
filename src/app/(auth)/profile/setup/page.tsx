'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import {
    ChevronRight,
    ChevronLeft,
    User,
    MapPin,
    GraduationCap,
    Camera,
    Heart,
    Check,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { InterestsPicker, PhotoUpload } from '@/components/profile';
import { useAuth } from '@/lib/hooks/useAuth';
import { db } from '@/lib/firebase/config';
import { calculateAge, cn } from '@/lib/utils';

const basicInfoSchema = z.object({
    displayName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
    dateOfBirth: z.string().min(1, 'Vui lòng nhập ngày sinh'),
    location: z.string().min(2, 'Vui lòng nhập nơi ở'),
    school: z.string().min(2, 'Vui lòng nhập tên trường'),
    class: z.string().min(1, 'Vui lòng nhập lớp'),
    studentId: z.string().min(1, 'Vui lòng nhập mã sinh viên'),
    bio: z.string().max(300, 'Giới thiệu không quá 300 ký tự').optional(),
});

type BasicInfoData = z.infer<typeof basicInfoSchema>;

const steps = [
    { id: 1, title: 'Thông tin cơ bản', icon: User },
    { id: 2, title: 'Ảnh hồ sơ', icon: Camera },
    { id: 3, title: 'Sở thích', icon: Heart },
    { id: 4, title: 'Hoàn tất', icon: Check },
];

export default function ProfileSetupPage() {
    const router = useRouter();
    const { user, refreshUserData } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [saving, setSaving] = useState(false);

    // Form data
    const [photos, setPhotos] = useState<string[]>([]);
    const [interests, setInterests] = useState<string[]>([]);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<BasicInfoData>({
        resolver: zodResolver(basicInfoSchema),
    });

    const basicInfo = watch();

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return (
                    basicInfo.displayName?.length >= 2 &&
                    basicInfo.dateOfBirth &&
                    basicInfo.location?.length >= 2 &&
                    basicInfo.school?.length >= 2 &&
                    basicInfo.class &&
                    basicInfo.studentId
                );
            case 2:
                return photos.length >= 3;
            case 3:
                return interests.length >= 5;
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const dob = new Date(basicInfo.dateOfBirth);
            const age = calculateAge(dob);

            await updateDoc(doc(db, 'users', user.uid), {
                displayName: basicInfo.displayName,
                dateOfBirth: Timestamp.fromDate(dob),
                age,
                location: basicInfo.location,
                school: basicInfo.school,
                class: basicInfo.class,
                studentId: basicInfo.studentId,
                bio: basicInfo.bio || '',
                avatar: photos[0],
                photos,
                interests,
                reviewStatus: 'pending',
                updatedAt: Timestamp.now(),
            });

            await refreshUserData();
            router.push('/home');
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Đã có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-50 dark:bg-dark-900 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Progress steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div
                                    className={cn(
                                        'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                                        currentStep > step.id
                                            ? 'bg-primary-500 text-dark-900'
                                            : currentStep === step.id
                                                ? 'bg-primary-500 text-dark-900'
                                                : 'bg-dark-200 dark:bg-dark-700 text-dark-500'
                                    )}
                                >
                                    {currentStep > step.id ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <step.icon className="w-5 h-5" />
                                    )}
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={cn(
                                            'w-16 sm:w-24 h-1 mx-2 rounded-full transition-colors',
                                            currentStep > step.id
                                                ? 'bg-primary-500'
                                                : 'bg-dark-200 dark:bg-dark-700'
                                        )}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-center">
                        <h2 className="text-xl font-semibold">{steps[currentStep - 1].title}</h2>
                        <p className="text-dark-500 text-sm mt-1">
                            Bước {currentStep} / {steps.length}
                        </p>
                    </div>
                </div>

                {/* Step content */}
                <div className="card p-6 sm:p-8">
                    {/* Step 1: Basic Info */}
                    {currentStep === 1 && (
                        <div className="space-y-5">
                            <Input
                                label="Họ và tên"
                                placeholder="Nhập họ và tên đầy đủ"
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
                                placeholder="VD: Quận Cầu Giấy, Hà Nội"
                                leftIcon={<MapPin size={20} />}
                                error={errors.location?.message}
                                {...register('location')}
                            />

                            <Input
                                label="Trường"
                                placeholder="VD: Đại học Bách Khoa Hà Nội"
                                leftIcon={<GraduationCap size={20} />}
                                error={errors.school?.message}
                                {...register('school')}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Lớp"
                                    placeholder="VD: K65-CNTT"
                                    error={errors.class?.message}
                                    {...register('class')}
                                />

                                <Input
                                    label="Mã sinh viên"
                                    placeholder="VD: 20200001"
                                    error={errors.studentId?.message}
                                    {...register('studentId')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-1.5">
                                    Giới thiệu bản thân (không bắt buộc)
                                </label>
                                <textarea
                                    placeholder="Viết vài dòng về bản thân, mục tiêu học tập..."
                                    className="input min-h-24 resize-none"
                                    maxLength={300}
                                    {...register('bio')}
                                />
                                <p className="text-xs text-dark-500 mt-1">
                                    {(basicInfo.bio?.length || 0)}/300 ký tự
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Photos */}
                    {currentStep === 2 && user && (
                        <PhotoUpload
                            photos={photos}
                            onChange={setPhotos}
                            userId={user.uid}
                            min={3}
                            max={6}
                        />
                    )}

                    {/* Step 3: Interests */}
                    {currentStep === 3 && (
                        <InterestsPicker
                            selected={interests}
                            onChange={setInterests}
                            min={5}
                            max={15}
                        />
                    )}

                    {/* Step 4: Complete */}
                    {currentStep === 4 && (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check className="w-10 h-10 text-primary-500" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Hoàn tất hồ sơ!</h3>
                            <p className="text-dark-500 mb-6">
                                Hồ sơ của bạn sẽ được xét duyệt trong vòng 24 giờ.
                                Sau khi được duyệt, bạn có thể bắt đầu tìm bạn học!
                            </p>

                            <div className="bg-dark-50 dark:bg-dark-700 rounded-xl p-4 text-left space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-dark-500">Tên:</span>
                                    <span className="font-medium">{basicInfo.displayName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-500">Trường:</span>
                                    <span className="font-medium">{basicInfo.school}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-500">Ảnh:</span>
                                    <span className="font-medium">{photos.length} ảnh</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-500">Sở thích:</span>
                                    <span className="font-medium">{interests.length} mục</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-dark-100 dark:border-dark-700">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            icon={<ChevronLeft className="w-5 h-5" />}
                        >
                            Quay lại
                        </Button>

                        {currentStep < steps.length ? (
                            <Button
                                onClick={handleNext}
                                disabled={!canProceed()}
                            >
                                Tiếp theo
                                <ChevronRight className="w-5 h-5 ml-1" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleComplete}
                                loading={saving}
                                disabled={!canProceed()}
                            >
                                Hoàn tất
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
