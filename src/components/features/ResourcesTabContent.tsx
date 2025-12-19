"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Download, Trash2, Loader2, File, Image as ImageIcon, Plus, FolderOpen, Search, Filter, X, LayoutGrid, List, MessageSquare, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/utils/motionConfig";
import { getClassResourcesAction, deleteResourceAction, getCurrentUserAction, getAnnouncementMediaAction } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import { FileUpload } from "@/components/FileUpload";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

import { User } from "@/types";

interface ResourcesTabContentProps {
    classId: string;
    currentUser: User | null;
}

interface AnnouncementMedia {
    id: string;
    name: string;
    url: string;
    type: string;
    size?: number;
    announcementId: string;
    announcementTitle: string | null;
    announcementContent: string;
    announcementType: string;
    teacherName: string;
    teacherAvatar: string | null;
    createdAt: string;
}

export default function ResourcesTabContent({ classId, currentUser }: ResourcesTabContentProps) {
    const { showToast } = useToast();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resources, setResources] = useState<any[]>([]);
    const [announcementMedia, setAnnouncementMedia] = useState<AnnouncementMedia[]>([]);
    const [showUpload, setShowUpload] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showAnnouncementMedia, setShowAnnouncementMedia] = useState(true);

    const filteredResources = resources.filter(resource =>
        resource.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredAnnouncementMedia = announcementMedia.filter(media =>
        media.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        media.announcementTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        media.announcementContent.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        loadData();
    }, [classId]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load both resources and announcement media in parallel
            const [resourcesResult, mediaResult] = await Promise.all([
                getClassResourcesAction(classId),
                getAnnouncementMediaAction(classId)
            ]);

            if (resourcesResult.success) {
                console.log("Loaded resources:", resourcesResult.data);
                setResources(resourcesResult.data || []);
            } else {
                setError("Không thể tải tài liệu. Vui lòng thử lại.");
            }

            if (mediaResult.success) {
                console.log("Loaded announcement media:", mediaResult.data);
                setAnnouncementMedia(mediaResult.data || []);
            }
        } catch (err) {
            console.error("Failed to load resources:", err);
            setError("Đã xảy ra lỗi khi tải tài liệu.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) return;

        const result = await deleteResourceAction(id, classId);
        if (result.success) {
            showToast("Đã xóa tài liệu", "success");
            loadData();
        } else {
            showToast("Lỗi khi xóa", "error");
        }
    };

    const getFileIcon = (type: string | undefined) => {
        if (!type) return <File className="w-8 h-8 text-blue-500" />;
        if (type.includes('image')) return <ImageIcon className="w-8 h-8 text-purple-500" />;
        if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
        if (type.includes('word') || type.includes('doc')) return <FileText className="w-8 h-8 text-blue-600" />;
        if (type.includes('excel') || type.includes('sheet')) return <FileText className="w-8 h-8 text-green-600" />;
        if (type.includes('powerpoint') || type.includes('presentation')) return <FileText className="w-8 h-8 text-orange-500" />;
        return <File className="w-8 h-8 text-gray-500" />;
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-red-500">
                <p>{error}</p>
                <button onClick={loadData} className="mt-4 text-blue-500 hover:underline">Thử lại</button>
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Tài liệu lớp học</h2>
                    <p className="text-sm text-gray-500 mt-1">{resources.length} tài liệu được chia sẻ</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tài liệu..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-full sm:w-64 shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Chế độ lưới"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Chế độ danh sách"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    {currentUser?.role === 'teacher' && (
                        <button
                            onClick={() => setShowUpload(!showUpload)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all text-sm font-medium shadow-sm hover:shadow-md active:scale-95 ${showUpload
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-gradient-to-r from-primary to-blue-600 text-white hover:opacity-90'
                                }`}
                        >
                            <Plus className={`w-4 h-4 transition-transform duration-300 ${showUpload ? 'rotate-45' : ''}`} />
                            {showUpload ? 'Đóng' : 'Thêm mới'}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Upload Section - Only visible to teacher */}
                {showUpload && currentUser?.role === 'teacher' && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="lg:col-span-1"
                    >
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/5 border border-white/20 p-6 sticky top-24 overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 -z-10" />
                            <h3 className="font-semibold mb-4 text-gray-900 flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                                    <Plus className="w-4 h-4" />
                                </div>
                                Tải lên tài liệu
                            </h3>
                            <FileUpload
                                classId={classId}
                                teacherId={currentUser?.id || ''}
                                onUploadSuccess={() => {
                                    loadData();
                                    setShowUpload(false);
                                }}
                            />
                        </div>
                    </motion.div>
                )}

                {/* Resources List */}
                <div className={showUpload && currentUser?.role === 'teacher' ? "lg:col-span-3" : "lg:col-span-4"}>
                    {filteredResources.length > 0 ? (
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                            className={viewMode === 'grid'
                                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
                                : "flex flex-col gap-2"
                            }
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredResources.map((resource) => (
                                    <motion.div
                                        key={resource.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        layout
                                        className={viewMode === 'grid'
                                            ? "group bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200/50 relative overflow-hidden"
                                            : "group flex flex-row items-center p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 relative gap-4"
                                        }
                                    >
                                        {viewMode === 'grid' ? (
                                            // GRID VIEW CARD (Vertical - Original Style)
                                            <>
                                                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                                <div className="flex items-start justify-between mb-4 relative z-10">
                                                    <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-white group-hover:scale-110 transition-all duration-300 border border-gray-100 group-hover:shadow-sm">
                                                        {getFileIcon(resource.fileType)}
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                                        <a
                                                            href={resource.url}
                                                            download
                                                            className="p-2 hover:bg-white rounded-full text-gray-400 hover:text-primary shadow-sm hover:shadow transition-all"
                                                            title="Tải xuống"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </a>
                                                        {currentUser?.role === 'teacher' && (
                                                            <button
                                                                onClick={() => handleDelete(resource.id)}
                                                                className="p-2 hover:bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm hover:shadow transition-all"
                                                                title="Xóa"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="relative z-10">
                                                    <h4 className="font-semibold text-gray-900 truncate mb-1.5 group-hover:text-primary transition-colors" title={resource.title}>
                                                        {resource.title}
                                                    </h4>

                                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                                        <span className="bg-gray-100/80 px-2 py-0.5 rounded-md">{formatSize(resource.size)}</span>
                                                        <span>{formatDistanceToNow(new Date(resource.createdAt), { addSuffix: true, locale: vi })}</span>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            // LIST VIEW CARD (Horizontal - Student Card Style)
                                            <>
                                                <div className="flex-shrink-0">
                                                    <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-white group-hover:scale-105 transition-all duration-300 shadow-sm">
                                                        {getFileIcon(resource.fileType)}
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0 text-left">
                                                    <h4 className="font-bold text-base text-gray-900 truncate group-hover:text-primary transition-colors mb-1" title={resource.title}>
                                                        {resource.title}
                                                    </h4>

                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <span className="bg-gray-100 px-2 py-0.5 rounded-md font-medium">{formatSize(resource.size)}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                        <span>{formatDistanceToNow(new Date(resource.createdAt), { addSuffix: true, locale: vi })}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a
                                                        href={resource.url}
                                                        download
                                                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-primary transition-colors"
                                                        title="Tải xuống"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                    {currentUser?.role === 'teacher' && (
                                                        <button
                                                            onClick={() => handleDelete(resource.id)}
                                                            className="p-2 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-gray-200/60"
                        >
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-full w-24 h-24 mx-auto mb-6 shadow-inner flex items-center justify-center ring-8 ring-white">
                                <FolderOpen className="w-10 h-10 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có tài liệu nào'}
                            </h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-8">
                                {searchQuery
                                    ? `Không tìm thấy tài liệu nào khớp với "${searchQuery}"`
                                    : (currentUser?.role === 'teacher'
                                        ? "Hãy tải lên tài liệu đầu tiên để học sinh có thể xem và tải về. Hỗ trợ nhiều định dạng file."
                                        : "Giáo viên chưa tải lên tài liệu nào cho lớp học này. Vui lòng quay lại sau.")
                                }
                            </p>
                            {currentUser?.role === 'teacher' && !searchQuery && (
                                <button
                                    onClick={() => setShowUpload(true)}
                                    className="px-8 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all font-semibold active:scale-95"
                                >
                                    Tải tài liệu ngay
                                </button>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Announcement Media Section */}
            {filteredAnnouncementMedia.length > 0 && (
                <div className="mt-8">
                    <button
                        onClick={() => setShowAnnouncementMedia(!showAnnouncementMedia)}
                        className="flex items-center gap-2 mb-4 text-gray-700 hover:text-gray-900 transition-colors group"
                    >
                        <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-lg">File từ thông báo</h3>
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                            {filteredAnnouncementMedia.length}
                        </span>
                        {showAnnouncementMedia ? (
                            <ChevronUp className="w-4 h-4 text-gray-400 ml-auto" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                        )}
                    </button>

                    <AnimatePresence>
                        {showAnnouncementMedia && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="space-y-3">
                                    {filteredAnnouncementMedia.map((media) => (
                                        <div
                                            key={media.id}
                                            className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* File Icon */}
                                                <div className="p-3 bg-white rounded-xl shadow-sm flex-shrink-0">
                                                    {media.type?.startsWith('image') ? (
                                                        <ImageIcon className="w-6 h-6 text-purple-500" />
                                                    ) : media.type?.includes('pdf') ? (
                                                        <FileText className="w-6 h-6 text-red-500" />
                                                    ) : (
                                                        <File className="w-6 h-6 text-gray-500" />
                                                    )}
                                                </div>

                                                {/* File Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-900 truncate mb-1">{media.name}</h4>

                                                    {/* Source from Announcement */}
                                                    <div className="flex items-start gap-2 p-2 bg-white/80 rounded-lg border border-blue-100/50 mb-2">
                                                        <MessageSquare className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="text-xs text-gray-600 line-clamp-2">
                                                                {media.announcementTitle || media.announcementContent}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                                                                <span>{media.teacherName}</span>
                                                                <span>•</span>
                                                                <span>{formatDistanceToNow(new Date(media.createdAt), { addSuffix: true, locale: vi })}</span>
                                                                {media.announcementType !== 'NORMAL' && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span className={`px-1.5 py-0.5 rounded ${media.announcementType === 'URGENT' ? 'bg-red-100 text-red-600' :
                                                                            media.announcementType === 'IMPORTANT' ? 'bg-orange-100 text-orange-600' :
                                                                                'bg-purple-100 text-purple-600'
                                                                            }`}>
                                                                            {media.announcementType === 'URGENT' ? 'Khẩn cấp' :
                                                                                media.announcementType === 'IMPORTANT' ? 'Quan trọng' :
                                                                                    media.announcementType === 'EVENT' ? 'Sự kiện' : ''}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        {media.size && (
                                                            <>
                                                                <span className="bg-gray-100 px-2 py-0.5 rounded">{formatSize(media.size)}</span>
                                                                <span>•</span>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={() => router.push(`/dashboard/classes/${classId}?tab=stream&announcement=${media.announcementId}`)}
                                                            className="text-blue-600 hover:underline flex items-center gap-1"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            Xem thông báo gốc
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                    <a
                                                        href={media.url}
                                                        download
                                                        className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm"
                                                        title="Tải xuống"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
