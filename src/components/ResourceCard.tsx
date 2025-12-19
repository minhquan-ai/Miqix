"use client";

import { FileText, Image, File, Download, Trash2 } from "lucide-react";
import { deleteResourceAction } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";

interface ResourceCardProps {
    resource: {
        id: string;
        title: string;
        description?: string | null;
        fileUrl: string;
        fileType: string;
        fileSize: number;
        uploaderName: string;
        uploaderAvatar: string | null;
        createdAt: string;
    };
    classId: string;
    isTeacher: boolean;
    onDelete?: () => void;
}

export function ResourceCard({ resource, classId, isTeacher, onDelete }: ResourceCardProps) {
    const { showToast } = useToast();

    const getFileIcon = (type: string) => {
        if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
        if (type.includes('image')) return <Image className="w-8 h-8 text-blue-500" />;
        return <File className="w-8 h-8 text-gray-500" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleDelete = async () => {
        if (!confirm(`Bạn có chắc muốn xóa tài liệu "${resource.title}"?`)) return;

        const result = await deleteResourceAction(resource.id, classId);
        if (result.success) {
            showToast(result.message, 'success');
            onDelete?.();
        } else {
            showToast(result.message, 'error');
        }
    };

    return (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
            <div className="flex gap-4">
                <div className="shrink-0">
                    {getFileIcon(resource.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{resource.title}</h4>
                    {resource.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{resource.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(resource.fileSize)}</span>
                        <span>•</span>
                        <span>{resource.uploaderName}</span>
                        <span>•</span>
                        <span>{new Date(resource.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <a
                        href={resource.fileUrl}
                        download
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                        title="Tải xuống"
                    >
                        <Download className="w-4 h-4" />
                    </a>
                    {isTeacher && (
                        <button
                            onClick={handleDelete}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                            title="Xóa"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
