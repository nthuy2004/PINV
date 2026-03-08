import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)' },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File quá lớn (tối đa 5MB)' },
                { status: 400 }
            );
        }

        // Convert file to base64 for ImgBB
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString('base64');

        // Upload to ImgBB
        const imgbbApiKey = process.env.IMGBB_API_KEY;

        if (!imgbbApiKey) {
            console.error('Missing IMGBB_API_KEY environment variable');
            return NextResponse.json(
                { error: 'Missing key.' },
                { status: 500 }
            );
        }

        const imgbbFormData = new URLSearchParams();
        imgbbFormData.append('image', base64Image);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
            method: 'POST',
            body: imgbbFormData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            console.error('ImgBB API error:', data);
            throw new Error(data.error?.message || 'Failed to upload to ImgBB');
        }

        // Get public URL from ImgBB
        const publicUrl = data.data.url;

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
    // ImgBB free API doesn't support deleting images via API easily
    // We just return success to not block the UI
    return NextResponse.json({ success: true, warning: 'Image deletion not supported with ImgBB' });
}
