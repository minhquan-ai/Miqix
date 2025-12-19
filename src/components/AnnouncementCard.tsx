"use client";

import { useState, useEffect, memo, useRef } from "react";
import { createPortal } from "react-dom";
import { formatDistanceToNow, differenceInDays, format } from "date-fns";
import { vi } from "date-fns/locale";
import {
    MoreVertical,
    Pin,
    Trash2,
    Edit2,
    File as FileIcon,
    Download,
    Video,
    Image as ImageIcon,
    FileText
} from "lucide-react";
import {
    deleteAnnouncementAction,
    updateAnnouncementAction
} from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import { motion } from "framer-motion";
import { cardHover, prefersReducedMotion } from "@/utils/motionConfig";
import { MediaPreview, isMediaFile, MediaFile } from "@/components/ui/MediaPreview";
import { getAnnouncementStyle } from "@/utils/announcementStyle";

interface AnnouncementCardProps {
    announcement: any;
    currentUserId: string;
    isTeacher: boolean;
    onTogglePin?: (id: string, newStatus: boolean) => void;
    onDelete?: (id: string) => void;
    isOverlay?: boolean;
    isDetail?: boolean;
    onClose?: () => void;
}

function AnnouncementCard({ announcement, currentUserId, isTeacher, onTogglePin, onDelete, isOverlay = false, isDetail = false, onClose }: AnnouncementCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(announcement.content);
    const [showMenu, setShowMenu] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // We use the prop 'announcement.isPinned' directly now, as the parent handles the optimistic state
    const isPinned = announcement.isPinned;

    const { showToast } = useToast();

    useEffect(() => {
        // Auto-collapse if older than 3 days and not pinned
        // But never collapse in overlay or detail mode
        if (isOverlay || isDetail) {
            // eslint-disable-next-line
            setIsCollapsed(false);
            return;
        }
        const daysOld = differenceInDays(new Date(), new Date(announcement.createdAt));
        if (daysOld > 3 && !isPinned) {
            // eslint-disable-next-line
            setIsCollapsed(true);
        }
    }, [announcement.createdAt, isPinned, isOverlay, isDetail]);

    const handleDelete = async () => {
        if (confirm("Bạn có chắc chắn muốn xóa thông báo này?")) {
            // Optimistic delete if parent provided handler
            if (onDelete) onDelete(announcement.id);

            const result = await deleteAnnouncementAction(announcement.id);
            if (result.success) {
                showToast("Đã xóa thông báo", "success");
            } else {
                showToast("Lỗi khi xóa", "error");
            }
        }
    };

    const handleUpdate = async () => {
        const result = await updateAnnouncementAction(announcement.id, editContent);
        if (result.success) {
            setIsEditing(false);
            showToast("Đã cập nhật thông báo", "success");
        } else {
            showToast("Lỗi khi cập nhật", "error");
        }
    };

    const handlePin = async () => {
        const newStatus = !isPinned;
        setShowMenu(false); // Close menu immediately

        // Call parent handler for immediate sorting update
        if (onTogglePin) {
            onTogglePin(announcement.id, newStatus);
        }

        const result = await updateAnnouncementAction(announcement.id, announcement.content, newStatus);
        if (result.success) {
            showToast(newStatus ? "Đã ghim thông báo" : "Đã bỏ ghim", "success");
        } else {
            // Revert if failed (optional, but good practice)
            if (onTogglePin) onTogglePin(announcement.id, !newStatus);
            showToast("Lỗi khi cập nhật ghim", "error");
        }
    };

    const typeConfig = getAnnouncementStyle(announcement.type);
    const shouldReduceMotion = prefersReducedMotion();
    const createdDate = new Date(announcement.createdAt);

    // Simplified style for Overlay mode to avoid "box in a box" look
    // If isDetail, remove background/border completely to blend into modal
    const containerClasses = isDetail
        ? `relative bg-transparent ${showMenu ? 'z-50' : 'z-0'}`
        : isOverlay
            ? `relative bg-white rounded-xl ${showMenu ? 'z-50' : 'z-0'}`
            : `relative bg-gradient-to-br ${typeConfig.gradient} rounded-2xl border-2 ${typeConfig.border} transition-all duration-300 hover:shadow-xl ${isPinned ? 'ring-2 ring-yellow-400/50 shadow-lg shadow-yellow-100' : 'shadow-sm hover:shadow-lg'} ${showMenu ? 'z-50' : 'z-0'}`;

    const getFileIcon = (type: string) => {
        if (type?.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
        if (type?.startsWith('video/')) return <Video className="w-5 h-5" />;
        if (type?.includes('pdf')) return <FileText className="w-5 h-5" />;
        if (type?.includes('word') || type?.includes('document')) return <FileText className="w-5 h-5" />;
        if (type?.includes('powerpoint') || type?.includes('presentation')) return <FileText className="w-5 h-5" />;
        return <FileIcon className="w-5 h-5" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <motion.div
            className={containerClasses}
            whileHover={!isOverlay && !isDetail && !shouldReduceMotion ? { ...cardHover, transition: { duration: 0.15 } } : {}}
            layout
            onClick={() => {
                // If isDetail or isOverlay, do nothing (parent handles or no action)
                // If normal card, parent (list item) handles the click to open detail
            }}
            style={{ cursor: isEditing || showMenu || isDetail ? 'default' : 'pointer' }}
        >
            {/* Accent Bar - Only for regular cards, not overlay/detail */}
            {!isOverlay && !isDetail && (
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${typeConfig.accentColor} rounded-l-full`} />
            )}

            <div className={isDetail ? "p-0" : "p-5 pl-6"}>
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div
                        className="flex items-center gap-3 flex-1"
                    >
                        {/* Avatar with glow effect */}
                        <div className="relative">
                            <div className={`w-11 h-11 rounded-full overflow-hidden shadow-md ${isPinned ? 'ring-2 ring-yellow-400' : ''}`}>
                                {announcement.teacherAvatar ? (
                                    <img
                                        src={announcement.teacherAvatar}
                                        alt={announcement.teacherName}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg">
                                        {announcement.teacherName.charAt(0)}
                                    </div>
                                )}
                            </div>

                            {/* Pinned Icon - Redesigned */}
                            {isPinned && !isDetail && (
                                <div className="absolute -top-2 -right-2 z-10">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-yellow-200 rounded-full blur-sm opacity-50 animate-pulse" />
                                        <div className="relative w-6 h-6 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full flex items-center justify-center shadow-sm border border-white">
                                            <Pin className="w-3.5 h-3.5 text-white fill-white transform rotate-45" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-gray-900">{announcement.teacherName}</h4>
                                {typeConfig.badge && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${typeConfig.badge}`}>
                                        {typeConfig.badgeText}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                <span title={format(createdDate, 'PPP p', { locale: vi })}>
                                    {formatDistanceToNow(createdDate, { addSuffix: true, locale: vi })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {isTeacher && (
                            <div className="relative">
                                <button
                                    ref={buttonRef}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!showMenu && buttonRef.current) {
                                            const rect = buttonRef.current.getBoundingClientRect();
                                            setMenuPosition({
                                                top: rect.bottom + 8,
                                                left: rect.right - 224 // 224px is w-56
                                            });
                                            setShowMenu(true);
                                        } else {
                                            setShowMenu(false);
                                        }
                                    }}
                                    className="p-2 hover:bg-black/5 rounded-xl transition-colors"
                                >
                                    <MoreVertical className="w-4 h-4 text-gray-400" />
                                </button>

                                {showMenu && menuPosition && createPortal(
                                    <>
                                        <div className="fixed inset-0 z-[99999]" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                                        <div
                                            className="fixed w-56 bg-white border border-gray-100 rounded-xl shadow-2xl z-[99999] p-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5"
                                            style={{
                                                top: menuPosition.top,
                                                left: menuPosition.left
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={handlePin}
                                                className="w-full text-left px-3 py-2.5 text-[13px] hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors font-medium text-gray-700"
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPinned ? 'bg-gray-100' : 'bg-yellow-50'}`}>
                                                    <Pin className={`w-4 h-4 ${isPinned ? 'text-gray-500' : 'text-yellow-600'}`} />
                                                </div>
                                                {isPinned ? "Bỏ ghim bài viết" : "Ghim bài viết này"}
                                            </button>
                                            <button
                                                onClick={() => { setShowMenu(false); setIsEditing(true); }}
                                                className="w-full text-left px-3 py-2.5 text-[13px] hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors font-medium text-gray-700 mt-1"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                                    <Edit2 className="w-4 h-4 text-blue-600" />
                                                </div>
                                                Chỉnh sửa nội dung
                                            </button>

                                            <div className="h-px bg-gray-100 my-1.5" />

                                            <button
                                                onClick={handleDelete}
                                                className="w-full text-left px-3 py-2.5 text-[13px] hover:bg-red-50 text-red-600 rounded-lg flex items-center gap-3 transition-colors font-medium"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </div>
                                                Xóa thông báo
                                            </button>
                                        </div>
                                    </>,
                                    document.body
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content - Hidden if collapsed */}
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4"
                    >
                        {isEditing ? (
                            <div className="space-y-3">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full p-4 border border-gray-200 rounded-xl bg-white min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none transition-all"
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleUpdate}
                                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                    >
                                        Lưu thay đổi
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {announcement.title && (
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                                        {announcement.title}
                                    </h3>
                                )}
                                <div className="text-gray-700 text-[15px] whitespace-pre-wrap leading-relaxed">
                                    {announcement.content}
                                </div>
                            </div>
                        )}

                        {/* Attachments */}
                        {(() => {
                            try {
                                const attachments = announcement.attachments ? JSON.parse(announcement.attachments) : [];

                                if (attachments.length === 0) return null;

                                const mediaFiles = attachments.filter(isMediaFile) as MediaFile[];
                                const docFiles = attachments.filter((f: any) => !isMediaFile(f));

                                // Detail View: Show Media Preview + Vertical Document List
                                if (isDetail) {
                                    return (
                                        <div className="space-y-6 pt-2">
                                            {/* Media Preview */}
                                            {mediaFiles.length > 0 && (
                                                <MediaPreview files={mediaFiles} />
                                            )}

                                            {/* Document Files (Vertical List) */}
                                            {docFiles.length > 0 && (
                                                <div className="space-y-3">
                                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                                                        Tài liệu đính kèm ({docFiles.length})
                                                    </h3>
                                                    <div className="space-y-2">
                                                        {docFiles.map((file: any, index: number) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                                                            >
                                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                                                                        {getFileIcon(file.type)}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-medium text-gray-900 truncate">
                                                                            {file.name}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500">
                                                                            {formatFileSize(file.size)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <a
                                                                    href={file.url}
                                                                    download
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex-shrink-0"
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                    Tải về
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                // Default View (Pills)
                                return (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {attachments.map((file: any, index: number) => (
                                            <a
                                                key={index}
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 bg-white hover:bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 transition-all hover:shadow-sm group"
                                            >
                                                <div className="p-1.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                                    {file.type?.startsWith('image/') ? (
                                                        <img src={file.url} alt="" className="w-4 h-4 object-cover rounded" />
                                                    ) : (
                                                        <FileIcon className="w-4 h-4 text-blue-600" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-gray-700 max-w-[120px] truncate">
                                                        {file.name}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {(file.size / 1024).toFixed(1)} KB
                                                    </span>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                );
                            } catch (e) {
                                return null;
                            }
                        })()}
                    </motion.div>
                )}

                {/* Collapsed View Titles */}
                {isCollapsed && announcement.title && (
                    <div className="mt-1">
                        <h3 className="text-sm font-semibold text-gray-700 truncate">{announcement.title}</h3>
                    </div>
                )}
                {isCollapsed && !announcement.title && (
                    <div className="mt-1">
                        <p className="text-sm text-gray-500 truncate">{announcement.content.slice(0, 80)}...</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// Memoize to prevent unnecessary re-renders when parent updates
export default memo(AnnouncementCard);
