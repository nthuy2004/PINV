'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, BookOpen } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/lib/hooks/useAuth';

const loginSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setLoading(true);
        setError('');

        try {
            await signIn(data.email, data.password);
            router.push('/home');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Đã có lỗi xảy ra';
            if (errorMessage.includes('user-not-found') || errorMessage.includes('wrong-password')) {
                setError('Email hoặc mật khẩu không đúng');
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
                    <p className="mt-6 text-dark-400">
                        Tìm bạn học phù hợp, cùng nhau phát triển và chinh phục mọi mục tiêu học tập.
                    </p>
                </div>
            </div>

            {/* Right side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-dark-900">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-dark-900" />
                        </div>
                        <h1 className="font-display text-2xl font-bold">LearnHub</h1>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-dark-800 dark:text-white">
                            Chào mừng trở lại!
                        </h2>
                        <p className="mt-2 text-dark-500">
                            Đăng nhập để tiếp tục hành trình học tập
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {error && (
                            <div className="p-4 rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800">
                                <p className="text-sm text-accent-300">{error}</p>
                            </div>
                        )}

                        <Input
                            label="Email"
                            type="email"
                            placeholder="example@email.com"
                            leftIcon={<Mail size={20} />}
                            error={errors.email?.message}
                            {...register('email')}
                        />

                        <Input
                            label="Mật khẩu"
                            type="password"
                            placeholder="Nhập mật khẩu"
                            leftIcon={<Lock size={20} />}
                            error={errors.password?.message}
                            {...register('password')}
                        />

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                                />
                                <span className="text-sm text-dark-600 dark:text-dark-400">
                                    Ghi nhớ đăng nhập
                                </span>
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-sm text-primary-600 hover:text-primary-500"
                            >
                                Quên mật khẩu?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            loading={loading}
                        >
                            Đăng nhập
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-dark-500">
                        Chưa có tài khoản?{' '}
                        <Link
                            href="/register"
                            className="text-primary-600 hover:text-primary-500 font-medium"
                        >
                            Đăng ký ngay
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
