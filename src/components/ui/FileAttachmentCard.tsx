"use client";

import { FileText, Download, Eye, Image as ImageIcon, Film, Music, Box } from "lucide-react";
import { FileAttachment } from "@/types";

interface FileAttachmentCardProps {
    attachment: FileAttachment;
    onRemove?: () => void;
}

export function FileAttachmentCard({ attachment, onRemove }: FileAttachmentCardProps) {
    const isImage = attachment.type.startsWith("image/");
    const isVideo = attachment.type.startsWith("video/");
    const isAudio = attachment.type.startsWith("audio/");
    const isPdf = attachment.type === "application/pdf";

    // ... rest of icons logic ...
    const getIcon = () => {
        if (isImage) return <ImageIcon className="w-8 h-8 text-purple-500" />;
        if (isVideo) return <Film className="w-8 h-8 text-red-500" />;
        if (isAudio) return <Music className="w-8 h-8 text-amber-500" />;
        if (isPdf) return <FileText className="w-8 h-8 text-blue-500" />;
        return <Box className="w-8 h-8 text-gray-400" />;
    };

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(attachment.url, "_blank");
    };

    return (
        <div
            className="group relative flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all cursor-pointer hover:shadow-sm"
            onClick={handleDownload}
        >
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-background border border-border flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                {getIcon()}
            </div>

            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate pr-16" title={attachment.name}>
                    {attachment.name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className="uppercase font-semibold tracking-wider opacity-70">
                        {attachment.type.split('/')[1] || 'FILE'}
                    </span>
                    <span>•</span>
                    <span>{attachment.size ? formatBytes(attachment.size) : 'Unknown size'}</span>
                </div>
            </div>

            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {onRemove && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        className="p-2 rounded-full bg-background border border-border text-muted-foreground hover:text-red-600 hover:border-red-200 hover:bg-red-50 shadow-sm transition-colors"
                        title="Xóa file"
                    >
                        {/* SVG for Trash/X */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                    </button>
                )}
                <button
                    onClick={handleDownload}
                    className="p-2 rounded-full bg-background border border-border text-foreground hover:text-primary hover:border-primary shadow-sm"
                    title="Tải xuống"
                >
                    <Download className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
