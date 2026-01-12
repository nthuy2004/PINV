'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Phone, BookOpen, Check, X } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/lib/hooks/useAuth';
import { checkPasswordStrength } from '@/lib/utils';

const registerSchema = z.object({
    username: z
        .string()
        .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
        .max(20, 'Tên đăng nhập không được quá 20 ký tự')
        .regex(/^[a-zA-Z0-9_]+$/, 'Chỉ được dùng chữ cái, số và dấu gạch dưới'),
    email: z.string().email('Email không hợp lệ'),
    phone: z
        .string()
        .optional()
        .refine(
            (val) => !val || /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/.test(val.replace(/\s/g, '')),
            'Số điện thoại không hợp lệ'
        ),
    password: z
        .string()
        .min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const { signUp } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const password = watch('password', '');
    const passwordStrength = checkPasswordStrength(password);

    const passwordRequirements = [
        { label: 'Ít nhất 8 ký tự', met: password.length >= 8 },
        { label: 'Có chữ thường', met: /[a-z]/.test(password) },
        { label: 'Có chữ hoa', met: /[A-Z]/.test(password) },
        { label: 'Có số', met: /[0-9]/.test(password) },
        { label: 'Có ký tự đặc biệt', met: /[^a-zA-Z0-9]/.test(password) },
    ];

    const onSubmit = async (data: RegisterFormData) => {
        setLoading(true);
        setError('');

        try {
            await signUp(data.email, data.password, data.username);
            router.push('/profile/setup');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Đã có lỗi xảy ra';
            if (errorMessage.includes('email-already-in-use')) {
                setError('Email đã được sử dụng');
            } else if (errorMessage.includes('weak-password')) {
                setError('Mật khẩu quá yếu');
            } else {
                setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left side - Brand */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-dark-800 to-dark-900 items-center justify-center p-12">
                <div className="max-w-md text-center">
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-dark-900" />
                        </div>
                        <h1 className="font-display text-4xl font-bold text-white">LearnHub</h1>
                    </div>
                    <p className="text-xl text-dark-300 italic font-display">
                        Khơi nguồn sáng tạo
                    </p>

                    <div className="mt-12 text-left space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Check className="w-4 h-4 text-primary-400" />
                            </div>
                            <div>
                                <h3 className="font-medium text-white">Tìm bạn học phù hợp</h3>
                                <p className="text-sm text-dark-400">Matching thông minh dựa trên sở thích và mục tiêu</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Check className="w-4 h-4 text-primary-400" />
                            </div>
                            <div>
                                <h3 className="font-medium text-white">Học nhóm hiệu quả</h3>
                                <p className="text-sm text-dark-400">Tạo nhóm học, lên lịch và theo dõi tiến độ</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Check className="w-4 h-4 text-primary-400" />
                            </div>
                            <div>
                                <h3 className="font-medium text-white">Nhận thưởng khi học</h3>
                                <p className="text-sm text-dark-400">Tích điểm đổi voucher và mở khóa huy hiệu</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Register Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-dark-900 overflow-y-auto">
                <div className="w-full max-w-md py-8">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-dark-900" />
                        </div>
                        <h1 className="font-display text-2xl font-bold">LearnHub</h1>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-dark-800 dark:text-white">
                            Tạo tài khoản mới
                        </h2>
                        <p className="mt-2 text-dark-500">
                            Bắt đầu hành trình học tập cùng cộng đồng
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {error && (
                            <div className="p-4 rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800">
                                <p className="text-sm text-accent-300">{error}</p>
                            </div>
                        )}

                        <Input
                            label="Tên đăng nhập"
                            placeholder="username"
                            leftIcon={<User size={20} />}
                            error={errors.username?.message}
                            {...register('username')}
                        />

                        <Input
                            label="Email"
                            type="email"
                            placeholder="example@email.com"
                            leftIcon={<Mail size={20} />}
                            error={errors.email?.message}
                            {...register('email')}
                        />

                        <Input
                            label="Số điện thoại (không bắt buộc)"
                            type="tel"
                            placeholder="0912345678"
                            leftIcon={<Phone size={20} />}
                            error={errors.phone?.message}
                            {...register('phone')}
                        />

                        <div>
                            <Input
                                label="Mật khẩu"
                                type="password"
                                placeholder="Tạo mật khẩu mạnh"
                                leftIcon={<Lock size={20} />}
                                error={errors.password?.message}
                                {...register('password')}
                            />

                            {/* Password strength indicator */}
                            {password && (
                                <div className="mt-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-dark-200 dark:bg-dark-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                                                style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-dark-500">
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                        {passwordRequirements.map((req) => (
                                            <div key={req.label} className="flex items-center gap-1.5">
                                                {req.met ? (
                                                    <Check className="w-3 h-3 text-green-500" />
                                                ) : (
                                                    <X className="w-3 h-3 text-dark-400" />
                                                )}
                                                <span className={`text-xs ${req.met ? 'text-green-600' : 'text-dark-400'}`}>
                                                    {req.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <Input
                            label="Xác nhận mật khẩu"
                            type="password"
                            placeholder="Nhập lại mật khẩu"
                            leftIcon={<Lock size={20} />}
                            error={errors.confirmPassword?.message}
                            {...register('confirmPassword')}
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            loading={loading}
                        >
                            Đăng ký
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-dark-500">
                        Đã có tài khoản?{' '}
                        <Link
                            href="/login"
                            className="text-primary-600 hover:text-primary-500 font-medium"
                        >
                            Đăng nhập
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
