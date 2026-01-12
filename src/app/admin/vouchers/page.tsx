'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    addDoc,
    deleteDoc,
    Timestamp,
} from 'firebase/firestore';
import {
    Plus,
    Edit2,
    Trash2,
    X,
    ShoppingBag,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { Voucher } from '@/types';
import { Button, Input } from '@/components/ui';
import Link from 'next/link';

const ADMIN_EMAIL = 'huy0363894103@gmail.com';

const voucherSchema = z.object({
    name: z.string().min(2, 'Tên voucher phải có ít nhất 2 ký tự'),
    description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự'),
    tokenCost: z.coerce.number().min(1, 'Token phải lớn hơn 0'),
    quantity: z.coerce.number().min(1, 'Số lượng phải lớn hơn 0'),
    dailyLimit: z.coerce.number().min(1, 'Giới hạn/ngày phải lớn hơn 0'),
    cooldownHours: z.coerce.number().min(0, 'Cooldown không được âm'),
});

type VoucherFormData = z.infer<typeof voucherSchema>;

export default function VouchersManagement() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loadingVouchers, setLoadingVouchers] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
    const [saving, setSaving] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<VoucherFormData>({
        resolver: zodResolver(voucherSchema),
    });

    useEffect(() => {
        if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
            router.push('/home');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (!user || user.email !== ADMIN_EMAIL) return;

        const fetchVouchers = async () => {
            try {
                const vouchersSnapshot = await getDocs(collection(db, 'vouchers'));
                const vouchersData = vouchersSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Voucher[];
                setVouchers(vouchersData);
            } catch (error) {
                console.error('Error fetching vouchers:', error);
            } finally {
                setLoadingVouchers(false);
            }
        };

        fetchVouchers();
    }, [user]);

    const openCreateModal = () => {
        setEditingVoucher(null);
        reset({
            name: '',
            description: '',
            tokenCost: 10,
            quantity: 100,
            dailyLimit: 5,
            cooldownHours: 24,
        });
        setShowModal(true);
    };

    const openEditModal = (voucher: Voucher) => {
        setEditingVoucher(voucher);
        setValue('name', voucher.name);
        setValue('description', voucher.description);
        setValue('tokenCost', voucher.tokenCost);
        setValue('quantity', voucher.quantity);
        setValue('dailyLimit', voucher.dailyLimit);
        setValue('cooldownHours', voucher.cooldownHours);
        setShowModal(true);
    };

    const onSubmit = async (data: VoucherFormData) => {
        setSaving(true);
        try {
            if (editingVoucher) {
                await updateDoc(doc(db, 'vouchers', editingVoucher.id), {
                    ...data,
                    updatedAt: Timestamp.now(),
                });
                setVouchers(
                    vouchers.map((v) =>
                        v.id === editingVoucher.id ? { ...v, ...data } : v
                    )
                );
            } else {
                const docRef = await addDoc(collection(db, 'vouchers'), {
                    ...data,
                    requiresReview: true,
                    isActive: true,
                    createdAt: Timestamp.now(),
                });
                setVouchers([
                    ...vouchers,
                    {
                        id: docRef.id,
                        ...data,
                        requiresReview: true,
                        isActive: true,
                        createdAt: Timestamp.now(),
                    },
                ]);
            }
            setShowModal(false);
            reset();
        } catch (error) {
            console.error('Error saving voucher:', error);
        } finally {
            setSaving(false);
        }
    };

    const deleteVoucher = async (voucherId: string) => {
        if (!confirm('Bạn có chắc muốn xóa voucher này?')) return;

        try {
            await deleteDoc(doc(db, 'vouchers', voucherId));
            setVouchers(vouchers.filter((v) => v.id !== voucherId));
        } catch (error) {
            console.error('Error deleting voucher:', error);
        }
    };

    const toggleActive = async (voucher: Voucher) => {
        try {
            await updateDoc(doc(db, 'vouchers', voucher.id), {
                isActive: !voucher.isActive,
            });
            setVouchers(
                vouchers.map((v) =>
                    v.id === voucher.id ? { ...v, isActive: !voucher.isActive } : v
                )
            );
        } catch (error) {
            console.error('Error toggling voucher:', error);
        }
    };

    if (loading || loadingVouchers) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner w-8 h-8 border-primary-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-50 dark:bg-dark-900 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <Link href="/admin" className="text-sm text-primary-500 hover:underline">
                            ← Quay lại Dashboard
                        </Link>
                        <h1 className="text-2xl font-bold mt-2">Quản lý Vouchers</h1>
                    </div>
                    <Button onClick={openCreateModal} icon={<Plus className="w-5 h-5" />}>
                        Thêm voucher
                    </Button>
                </div>

                {vouchers.length === 0 ? (
                    <div className="card p-8 text-center">
                        <ShoppingBag className="w-12 h-12 text-dark-400 mx-auto mb-4" />
                        <p className="text-dark-500">Chưa có voucher nào</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {vouchers.map((voucher) => (
                            <div key={voucher.id} className="card p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{voucher.name}</h3>
                                            <span
                                                className={`px-2 py-0.5 text-xs rounded-full ${voucher.isActive
                                                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-dark-200 text-dark-500 dark:bg-dark-700'
                                                    }`}
                                            >
                                                {voucher.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                                            </span>
                                        </div>
                                        <p className="text-dark-500 text-sm mt-1">{voucher.description}</p>
                                        <div className="flex flex-wrap gap-4 mt-3 text-sm">
                                            <span>
                                                <strong>{voucher.tokenCost}</strong> tokens
                                            </span>
                                            <span>
                                                Còn <strong>{voucher.quantity}</strong>
                                            </span>
                                            <span>
                                                Giới hạn <strong>{voucher.dailyLimit}</strong>/ngày
                                            </span>
                                            <span>
                                                Cooldown <strong>{voucher.cooldownHours}</strong>h
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleActive(voucher)}
                                            className={`px-3 py-1.5 text-sm rounded-lg ${voucher.isActive
                                                    ? 'bg-dark-100 dark:bg-dark-700 hover:bg-dark-200'
                                                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                                                }`}
                                        >
                                            {voucher.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                                        </button>
                                        <button
                                            onClick={() => openEditModal(voucher)}
                                            className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteVoucher(voucher.id)}
                                            className="p-2 text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="card w-full max-w-md p-6 animate-scale-in">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">
                                    {editingVoucher ? 'Chỉnh sửa voucher' : 'Thêm voucher mới'}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-xl"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <Input
                                    label="Tên voucher"
                                    placeholder="VD: Giảm 20% Grab"
                                    error={errors.name?.message}
                                    {...register('name')}
                                />

                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Mô tả</label>
                                    <textarea
                                        className="input min-h-20 resize-none"
                                        placeholder="Mô tả chi tiết voucher..."
                                        {...register('description')}
                                    />
                                    {errors.description && (
                                        <p className="mt-1 text-sm text-accent-300">{errors.description.message}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Giá (tokens)"
                                        type="number"
                                        error={errors.tokenCost?.message}
                                        {...register('tokenCost')}
                                    />
                                    <Input
                                        label="Số lượng"
                                        type="number"
                                        error={errors.quantity?.message}
                                        {...register('quantity')}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Giới hạn/ngày"
                                        type="number"
                                        error={errors.dailyLimit?.message}
                                        {...register('dailyLimit')}
                                    />
                                    <Input
                                        label="Cooldown (giờ)"
                                        type="number"
                                        error={errors.cooldownHours?.message}
                                        {...register('cooldownHours')}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Hủy
                                    </Button>
                                    <Button type="submit" className="flex-1" loading={saving}>
                                        {editingVoucher ? 'Lưu' : 'Thêm'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
