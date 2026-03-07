import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase/admin';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = formData.get('folder') as string || 'general';

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain'];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'File type not allowed' },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB for Vercel free tier)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large (max 5MB)' },
                { status: 400 }
            );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = path.extname(file.name);
        const fileName = `${timestamp}_${randomStr}${ext}`;
        const filePath = `${folder}/${fileName}`;

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Firebase Storage via Admin SDK
        const bucket = adminStorage.bucket();
        const fileRef = bucket.file(filePath);

        await fileRef.save(buffer, {
            metadata: {
                contentType: file.type,
            },
            public: true, // Make file publicly accessible
        });

        // Get public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            fileName: file.name,
            size: file.size,
            type: file.type,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Upload failed' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fileUrl = searchParams.get('path');

        if (!fileUrl) {
            return NextResponse.json(
                { error: 'Invalid file path' },
                { status: 400 }
            );
        }

        // Extract path from Google Storage URL
        // Format: https://storage.googleapis.com/<bucket>/<path>
        const bucket = adminStorage.bucket();
        let filePath = fileUrl;

        if (fileUrl.startsWith('https://storage.googleapis.com/')) {
            const pathParts = fileUrl.replace(`https://storage.googleapis.com/${bucket.name}/`, '');
            filePath = pathParts;
        } else if (fileUrl.startsWith('/uploads/')) {
            // Support deleting old local files if any
            return NextResponse.json({ success: true, warning: 'Cannot delete local files on Vercel' });
        }

        const fileRef = bucket.file(filePath);

        const [exists] = await fileRef.exists();
        if (exists) {
            await fileRef.delete();
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { error: 'Delete failed' },
            { status: 500 }
        );
    }
}
