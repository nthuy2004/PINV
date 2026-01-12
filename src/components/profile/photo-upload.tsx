'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { X, Plus, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadFile } from '@/lib/upload';

interface PhotoUploadProps {
    photos: string[];
    onChange: (photos: string[]) => void;
    userId: string;
    min?: number;
    max?: number;
}

export function PhotoUpload({
    photos,
    onChange,
    userId,
    min = 3,
    max = 6,
}: PhotoUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const remainingSlots = max - photos.length;
        const filesToUpload = Array.from(files).slice(0, remainingSlots);

        if (filesToUpload.length === 0) return;

        setUploading(true);
        setUploadProgress(0);

        try {
            const uploadedUrls: string[] = [];

            for (let i = 0; i < filesToUpload.length; i++) {
                const file = filesToUpload[i];

                // Validate file type
                if (!file.type.startsWith('image/')) {
                    alert('Chỉ được upload file ảnh');
                    continue;
                }

                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('Ảnh không được quá 5MB');
                    continue;
                }

                // Upload using local storage API
                const result = await uploadFile(file, `users/${userId}/photos`);

                if (result.success && result.url) {
                    uploadedUrls.push(result.url);
                } else {
                    alert(result.error || 'Đã có lỗi khi upload ảnh');
                }

                setUploadProgress(((i + 1) / filesToUpload.length) * 100);
            }

            if (uploadedUrls.length > 0) {
                onChange([...photos, ...uploadedUrls]);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Đã có lỗi khi upload ảnh');
        } finally {
            setUploading(false);
            setUploadProgress(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [photos, max, userId, onChange]);

    const removePhoto = (index: number) => {
        const newPhotos = [...photos];
        newPhotos.splice(index, 1);
        onChange(newPhotos);
    };

    const setAsAvatar = (index: number) => {
        if (index === 0) return;
        const newPhotos = [...photos];
        const [photo] = newPhotos.splice(index, 1);
        newPhotos.unshift(photo);
        onChange(newPhotos);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-medium">Ảnh hồ sơ</p>
                    <p className="text-sm text-dark-500">
                        Tối thiểu {min} ảnh, tối đa {max} ảnh
                    </p>
                </div>
                <span className={cn(
                    'text-sm font-medium',
                    photos.length < min ? 'text-accent-300' : 'text-green-500'
                )}>
                    {photos.length}/{max}
                </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {/* Existing photos */}
                {photos.map((photo, index) => (
                    <div
                        key={photo}
                        className={cn(
                            'relative aspect-[3/4] rounded-xl overflow-hidden group',
                            index === 0 && 'ring-2 ring-primary-500'
                        )}
                    >
                        <Image
                            src={photo}
                            alt={`Photo ${index + 1}`}
                            fill
                            className="object-cover"
                        />

                        {/* Avatar badge */}
                        {index === 0 && (
                            <div className="absolute top-2 left-2 px-2 py-1 bg-primary-500 text-dark-900 text-xs font-medium rounded-lg">
                                Avatar
                            </div>
                        )}

                        {/* Overlay actions */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {index !== 0 && (
                                <button
                                    onClick={() => setAsAvatar(index)}
                                    className="p-2 bg-white rounded-full text-dark-800 hover:bg-dark-100"
                                    title="Đặt làm avatar"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={() => removePhoto(index)}
                                className="p-2 bg-accent-300 rounded-full text-white hover:bg-accent-400"
                                title="Xóa ảnh"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Upload button */}
                {photos.length < max && (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className={cn(
                            'aspect-[3/4] rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-2',
                            uploading
                                ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-dark-300 dark:border-dark-600 hover:border-primary-400 hover:bg-dark-50 dark:hover:bg-dark-800'
                        )}
                    >
                        {uploading ? (
                            <>
                                <div className="spinner w-6 h-6 border-primary-500" />
                                <span className="text-sm text-dark-500">
                                    {Math.round(uploadProgress || 0)}%
                                </span>
                            </>
                        ) : (
                            <>
                                <Plus className="w-6 h-6 text-dark-400" />
                                <span className="text-sm text-dark-500">Thêm ảnh</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
            />

            {photos.length < min && (
                <p className="text-sm text-accent-300">
                    Bạn cần thêm ít nhất {min - photos.length} ảnh nữa
                </p>
            )}
        </div>
    );
}
