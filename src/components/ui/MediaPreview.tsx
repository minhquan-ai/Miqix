"use client";

import { useState } from "react";
import { Video } from "lucide-react";

export interface MediaFile {
    name: string;
    url: string;
    type: string;
    size: number;
}

interface MediaPreviewProps {
    files: MediaFile[];
    className?: string;
}

export function MediaPreview({ files, className = '' }: MediaPreviewProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    if (files.length === 0) return null;

    const isVideoFile = (file: MediaFile) => {
        if (file.type?.startsWith('video/')) return true;
        const ext = file.name.toLowerCase().split('.').pop();
        const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
        return videoExts.includes(ext || '');
    };

    const selectedFile = files[selectedIndex];

    return (
        <div className={`space-y-4 ${className}`}>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Media ({files.length})
            </h3>

            {/* Main Preview */}
            <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                {isVideoFile(selectedFile) ? (
                    <video
                        src={selectedFile.url}
                        controls
                        className="w-full h-auto max-h-[400px]"
                    >
                        Trình duyệt không hỗ trợ video.
                    </video>
                ) : (
                    <img
                        src={selectedFile.url}
                        alt={selectedFile.name}
                        className="w-full h-auto max-h-[400px] object-contain"
                    />
                )}
            </div>

            {/* Thumbnails */}
            {files.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {files.map((file, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedIndex(index)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedIndex === index
                                    ? 'border-blue-500 ring-2 ring-blue-200'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            {isVideoFile(file) ? (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                    <Video className="w-6 h-6 text-gray-400" />
                                </div>
                            ) : (
                                <img
                                    src={file.url}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// Helper function to check if file is media (image/video)
export function isMediaFile(file: MediaFile): boolean {
    // Check MIME type first
    if (file.type) {
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            return true;
        }
    }
    // Fallback: check file extension
    const ext = file.name.toLowerCase().split('.').pop();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
    return imageExts.includes(ext || '') || videoExts.includes(ext || '');
}
