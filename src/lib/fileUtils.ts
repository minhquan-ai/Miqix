/**
 * File utility functions for handling file uploads and conversions
 */

export interface FileAttachment {
    id: string;
    name: string;
    url: string;  // Base64 data URL or cloud URL
    type: string;  // MIME type
    size: number;  // bytes
    uploadedAt: string;
}

/**
 * Convert a File to base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

/**
 * Generate a unique ID for files
 */
export const generateFileId = (): string => {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format file size to human-readable string
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate file size (max in MB)
 */
export const validateFileSize = (file: File, maxSizeMB: number = 10): boolean => {
    const maxBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxBytes;
};

/**
 * Validate file type
 */
export const validateFileType = (file: File, acceptedTypes: string[]): boolean => {
    if (acceptedTypes.length === 0) return true;

    return acceptedTypes.some(type => {
        // Handle wildcards like "image/*"
        if (type.endsWith('/*')) {
            const category = type.split('/')[0];
            return file.type.startsWith(category + '/');
        }
        return file.type === type;
    });
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Check if file is an image
 */
export const isImageFile = (file: File | FileAttachment): boolean => {
    if ('type' in file && file.type) {
        return file.type.startsWith('image/');
    }
    // For FileAttachment
    if ('url' in file && file.url) {
        const dataUrlType = file.url.split(';')[0].split(':')[1];
        return dataUrlType?.startsWith('image/') || false;
    }
    return false;
};

/**
 * Check if file is a PDF
 */
export const isPDFFile = (file: File | FileAttachment): boolean => {
    if ('type' in file && file.type) {
        return file.type === 'application/pdf';
    }
    // For FileAttachment
    if ('url' in file && file.url) {
        const dataUrlType = file.url.split(';')[0].split(':')[1];
        return dataUrlType === 'application/pdf';
    }
    return false;
};

/**
 * Convert File to FileAttachment object
 */
export const fileToAttachment = async (file: File): Promise<FileAttachment> => {
    const base64 = await fileToBase64(file);

    return {
        id: generateFileId(),
        name: file.name,
        url: base64,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString()
    };
};

/**
 * Download file from base64 or URL
 */
export const downloadFile = (fileAttachment: FileAttachment) => {
    const link = document.createElement('a');
    link.href = fileAttachment.url;
    link.download = fileAttachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
