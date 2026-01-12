/**
 * Upload service - handles file uploads to local storage
 * Can be easily swapped for cloud storage (S3, OSS, etc.) later
 */

interface UploadResult {
    success: boolean;
    url?: string;
    fileName?: string;
    size?: number;
    error?: string;
}

/**
 * Upload a file to local storage
 */
export async function uploadFile(
    file: File,
    folder: string = 'general'
): Promise<UploadResult> {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.error || 'Upload failed' };
        }

        return {
            success: true,
            url: data.url,
            fileName: data.fileName,
            size: data.size,
        };
    } catch (error) {
        console.error('Upload error:', error);
        return { success: false, error: 'Network error' };
    }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
    files: File[],
    folder: string = 'general'
): Promise<UploadResult[]> {
    const results = await Promise.all(
        files.map((file) => uploadFile(file, folder))
    );
    return results;
}

/**
 * Delete a file from local storage
 */
export async function deleteFile(filePath: string): Promise<boolean> {
    try {
        const response = await fetch(`/api/upload?path=${encodeURIComponent(filePath)}`, {
            method: 'DELETE',
        });
        return response.ok;
    } catch (error) {
        console.error('Delete error:', error);
        return false;
    }
}

/**
 * Check if a URL is a local upload
 */
export function isLocalUpload(url: string): boolean {
    return url.startsWith('/uploads/');
}
