'use client';

import { useState } from 'react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Ban, Flag, ChevronRight } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface ReportBlockModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetUserId: string;
    targetUserName: string;
}

const REPORT_REASONS = [
    { id: 'fake_profile', label: 'Hồ sơ giả mạo', description: 'Thông tin hoặc ảnh không thật' },
    { id: 'inappropriate_content', label: 'Nội dung không phù hợp', description: 'Ngôn ngữ, hình ảnh phản cảm' },
    { id: 'harassment', label: 'Quấy rối', description: 'Tin nhắn làm phiền, đe dọa' },
    { id: 'spam', label: 'Spam', description: 'Quảng cáo, tin nhắn rác' },
    { id: 'scam', label: 'Lừa đảo', description: 'Yêu cầu tiền, thông tin cá nhân' },
    { id: 'underage', label: 'Dưới 18 tuổi', description: 'Người dùng chưa đủ tuổi' },
    { id: 'other', label: 'Lý do khác', description: 'Mô tả chi tiết bên dưới' },
];

export function ReportBlockModal({
    isOpen,
    onClose,
    targetUserId,
    targetUserName,
}: ReportBlockModalProps) {
    const { user } = useAuth();
    const [mode, setMode] = useState<'choose' | 'report' | 'block' | 'success'>('choose');
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReport = async () => {
        if (!user || !selectedReason) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'reports'), {
                reporterId: user.uid,
                reportedUserId: targetUserId,
                reason: selectedReason,
                description: description.trim() || null,
                status: 'pending',
                createdAt: Timestamp.now(),
            });
            setMode('success');
        } catch (error) {
            console.error('Error submitting report:', error);
            alert('Đã có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const handleBlock = async () => {
        if (!user) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'blocks'), {
                blockerId: user.uid,
                blockedId: targetUserId,
                createdAt: Timestamp.now(),
            });
            setMode('success');
        } catch (error) {
            console.error('Error blocking user:', error);
            alert('Đã có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setMode('choose');
        setSelectedReason(null);
        setDescription('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="card w-full max-w-md overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-dark-100 dark:border-dark-700">
                        <h3 className="text-lg font-bold">
                            {mode === 'choose' && 'Báo cáo hoặc Chặn'}
                            {mode === 'report' && 'Báo cáo người dùng'}
                            {mode === 'block' && 'Chặn người dùng'}
                            {mode === 'success' && 'Hoàn tất'}
                        </h3>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-4">
                        {/* Choose mode */}
                        {mode === 'choose' && (
                            <div className="space-y-3">
                                <p className="text-sm text-dark-500 mb-4">
                                    Bạn muốn làm gì với <span className="font-medium text-dark-800 dark:text-white">{targetUserName}</span>?
                                </p>

                                <button
                                    onClick={() => setMode('report')}
                                    className="w-full flex items-center gap-4 p-4 bg-dark-50 dark:bg-dark-700 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-600 transition-colors"
                                >
                                    <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/30 rounded-xl flex items-center justify-center">
                                        <Flag className="w-6 h-6 text-accent-500" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-medium">Báo cáo</p>
                                        <p className="text-sm text-dark-500">Gửi báo cáo cho quản trị viên</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-dark-400" />
                                </button>

                                <button
                                    onClick={() => setMode('block')}
                                    className="w-full flex items-center gap-4 p-4 bg-dark-50 dark:bg-dark-700 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-600 transition-colors"
                                >
                                    <div className="w-12 h-12 bg-dark-200 dark:bg-dark-600 rounded-xl flex items-center justify-center">
                                        <Ban className="w-6 h-6 text-dark-500" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-medium">Chặn</p>
                                        <p className="text-sm text-dark-500">Không nhìn thấy nhau nữa</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-dark-400" />
                                </button>
                            </div>
                        )}

                        {/* Report form */}
                        {mode === 'report' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-accent-50 dark:bg-accent-900/20 rounded-xl">
                                    <AlertTriangle className="w-5 h-5 text-accent-500 shrink-0" />
                                    <p className="text-sm text-accent-600 dark:text-accent-400">
                                        Báo cáo sẽ được gửi đến quản trị viên để xem xét. Thông tin của bạn được bảo mật.
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium mb-3">Chọn lý do:</p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {REPORT_REASONS.map((reason) => (
                                            <button
                                                key={reason.id}
                                                onClick={() => setSelectedReason(reason.id)}
                                                className={cn(
                                                    'w-full p-3 rounded-xl text-left transition-colors',
                                                    selectedReason === reason.id
                                                        ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500'
                                                        : 'bg-dark-50 dark:bg-dark-700 border-2 border-transparent hover:border-dark-200 dark:hover:border-dark-600'
                                                )}
                                            >
                                                <p className="font-medium text-sm">{reason.label}</p>
                                                <p className="text-xs text-dark-500">{reason.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Mô tả thêm (tùy chọn)
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Cung cấp thêm chi tiết nếu cần..."
                                        className="input min-h-20 resize-none"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <Button variant="secondary" className="flex-1" onClick={() => setMode('choose')}>
                                        Quay lại
                                    </Button>
                                    <Button
                                        variant="danger"
                                        className="flex-1"
                                        onClick={handleReport}
                                        disabled={!selectedReason}
                                        loading={loading}
                                    >
                                        Gửi báo cáo
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Block confirmation */}
                        {mode === 'block' && (
                            <div className="space-y-4">
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 bg-dark-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Ban className="w-8 h-8 text-dark-500" />
                                    </div>
                                    <h4 className="font-semibold mb-2">Chặn {targetUserName}?</h4>
                                    <p className="text-sm text-dark-500">
                                        Sau khi chặn, các bạn sẽ không thể nhìn thấy nhau trong phần tìm kiếm và không thể nhắn tin cho nhau.
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <Button variant="secondary" className="flex-1" onClick={() => setMode('choose')}>
                                        Hủy
                                    </Button>
                                    <Button
                                        variant="danger"
                                        className="flex-1"
                                        onClick={handleBlock}
                                        loading={loading}
                                    >
                                        Chặn
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Success */}
                        {mode === 'success' && (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h4 className="font-semibold mb-2">Đã hoàn tất!</h4>
                                <p className="text-sm text-dark-500 mb-4">
                                    Cảm ơn bạn đã giúp cộng đồng LearnHub an toàn hơn.
                                </p>
                                <Button onClick={handleClose}>Đóng</Button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
