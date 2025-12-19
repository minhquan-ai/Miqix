"use client";

import { useState, useRef } from "react";
import { MessageSquare, Send, X, Paperclip, Eye, Edit2, File as FileIcon, Sparkles, Bell, AlertTriangle, Calendar } from "lucide-react";
import { createAnnouncementAction } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import AnnouncementCard from "@/components/AnnouncementCard";

interface AnnouncementComposerProps {
    classId: string;
    teacherId: string;
    onPost: () => void;
    teacherAvatar?: string | null;
    teacherName?: string;
}

export default function AnnouncementComposer({ classId, onPost, teacherAvatar, teacherName }: AnnouncementComposerProps) {
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [type, setType] = useState("NORMAL");
    const [isPosting, setIsPosting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isPreview, setIsPreview] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();

    const handlePost = async () => {
        if (!content.trim()) return;
        setIsPosting(true);
        try {
            // Convert attachments to JSON metadata (mock upload)
            const attachmentMetadata = attachments.map(file => ({
                name: file.name,
                size: file.size,
                type: file.type,
                url: URL.createObjectURL(file) // Temporary local URL for demo
            }));

            const result = await createAnnouncementAction({
                classId,
                content,
                title,
                type,
                isPinned: false,
                attachments: JSON.stringify(attachmentMetadata)
            });
            if (result.success) {
                setContent("");
                setTitle("");
                setType("NORMAL");
                setAttachments([]);
                setIsExpanded(false);
                setIsPreview(false);
                showToast("Đã đăng thông báo", "success");
                onPost();
            } else {
                showToast("Lỗi khi đăng thông báo", "error");
            }
        } catch (_error) {
            showToast("Có lỗi xảy ra", "error");
        } finally {
            setIsPosting(false);
        }
    };

    const handleCancel = () => {
        setIsExpanded(false);
        setContent("");
        setTitle("");
        setType("NORMAL");
        setAttachments([]);
        setIsPreview(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const types = [
        { value: 'NORMAL', label: 'Thông thường', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' },
        { value: 'IMPORTANT', label: 'Quan trọng', icon: <Bell className="w-3.5 h-3.5" />, color: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100' },
        { value: 'URGENT', label: 'Khẩn cấp', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' },
        { value: 'EVENT', label: 'Sự kiện', icon: <Calendar className="w-3.5 h-3.5" />, color: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100' },
    ];

    // const selectedType = types.find(t => t.value === type);

    // Collapsed state - Beautiful prompt button
    if (!isExpanded) {
        return (
            <div className="group bg-white border-2 border-gray-100 hover:border-indigo-200 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => setIsExpanded(true)}
            >
                <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white shadow-md group-hover:ring-indigo-100 transition-all">
                            {teacherAvatar ? (
                                <img src={teacherAvatar} alt={teacherName || "Teacher"} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg">
                                    {teacherName?.charAt(0) || 'T'}
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                            <span className="text-[10px]">✏️</span>
                        </div>
                    </div>

                    {/* Input placeholder */}
                    <div className="flex-1">
                        <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 group-hover:bg-indigo-50/50 rounded-full transition-all">
                            <MessageSquare className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                            <span className="text-gray-500 group-hover:text-gray-700 font-medium transition-colors">
                                Chia sẻ điều gì đó với lớp...
                            </span>
                        </div>
                    </div>

                    {/* Quick action hints */}
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-orange-50 text-orange-500 opacity-60 group-hover:opacity-100 transition-opacity">
                            <Bell className="w-4 h-4" />
                        </div>
                        <div className="p-2 rounded-xl bg-purple-50 text-purple-500 opacity-60 group-hover:opacity-100 transition-opacity">
                            <Calendar className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Expanded state - Full composer
    return (
        <div className="bg-white border-2 border-indigo-200 rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-4 border-b border-indigo-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white shadow-sm">
                            {teacherAvatar ? (
                                <img src={teacherAvatar} alt={teacherName || "Teacher"} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                                    {teacherName?.charAt(0) || 'T'}
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{teacherName || 'Giáo viên'}</h3>
                            <p className="text-xs text-gray-500">Đang soạn thông báo...</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsPreview(!isPreview)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${isPreview
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                                }`}
                        >
                            {isPreview ? <><Edit2 className="w-3 h-3" /> Viết tiếp</> : <><Eye className="w-3 h-3" /> Xem trước</>}
                        </button>
                        <button
                            onClick={handleCancel}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {isPreview ? (
                <div className="p-5 bg-gray-50/50">
                    <div className="text-xs text-gray-500 mb-3 flex items-center gap-2">
                        <Eye className="w-3 h-3" />
                        Xem trước thông báo
                    </div>
                    <AnnouncementCard
                        announcement={{
                            id: 'preview',
                            content,
                            title,
                            type,
                            createdAt: new Date().toISOString(),
                            teacherName: teacherName || "Giáo viên",
                            teacherAvatar: teacherAvatar,
                            reactions: [],
                            isPinned: false,
                            attachments: JSON.stringify(attachments.map(f => ({ name: f.name, size: f.size, type: f.type, url: '#' })))
                        }}
                        currentUserId="preview"
                        isTeacher={false}
                    />
                </div>
            ) : (
                <div className="p-5 space-y-4">
                    {/* Title Input */}
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Tiêu đề thông báo (tùy chọn)..."
                        className="w-full text-lg font-semibold text-gray-900 placeholder:text-gray-400 bg-transparent border-none p-0 focus:outline-none focus:ring-0"
                    />

                    {/* Content Textarea */}
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Nội dung thông báo của bạn..."
                        className="w-full min-h-[150px] text-gray-700 placeholder:text-gray-400 bg-gray-50/50 border border-gray-100 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 resize-none transition-all"
                        autoFocus
                    />

                    {/* Attachments */}
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {attachments.map((file, index) => (
                                <div key={index} className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
                                    <FileIcon className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm text-gray-700 max-w-[150px] truncate">{file.name}</span>
                                    <button onClick={() => removeAttachment(index)} className="p-0.5 hover:bg-blue-100 rounded-full transition-colors">
                                        <X className="w-3.5 h-3.5 text-gray-500 hover:text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Type Selector */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500 mr-1">Loại:</span>
                        {types.map((t) => (
                            <button
                                key={t.value}
                                onClick={() => setType(t.value)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all ${type === t.value
                                    ? `${t.color} ring-2 ring-offset-1 ring-current/20`
                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                    }`}
                            >
                                {t.icon}
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer Actions */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        multiple
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        title="Đính kèm tệp"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    {attachments.length > 0 && (
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                            {attachments.length} tệp
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handlePost}
                        disabled={!content.trim() || isPosting}
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                    >
                        {isPosting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Đang đăng...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Đăng thông báo
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
