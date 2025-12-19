"use client";

import { useState } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { createAnnouncementAction } from "@/lib/announcement-actions";

interface CreateAnnouncementFormProps {
    classId: string;
    teacherId: string;
    onSuccess?: () => void;
}

export default function CreateAnnouncementForm({ classId, teacherId, onSuccess }: CreateAnnouncementFormProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [type, setType] = useState<'NORMAL' | 'IMPORTANT' | 'URGENT' | 'EVENT'>('NORMAL');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim()) return;

        setIsSubmitting(true);

        const result = await createAnnouncementAction(classId, teacherId, {
            title: title.trim() || undefined,
            content: content.trim(),
            type,
            attachments: [] // V1: No file upload yet
        });

        if (result.success) {
            // Reset form
            setTitle("");
            setContent("");
            setType('NORMAL');
            setIsExpanded(false);

            if (onSuccess) onSuccess();
        }

        setIsSubmitting(false);
    };

    return (
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-start gap-3">
                {/* Teacher avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {teacherId.charAt(0).toUpperCase()}
                </div>

                {/* Form content */}
                <div className="flex-1">
                    {!isExpanded ? (
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="w-full text-left px-4 py-3 rounded-lg border border-input bg-background hover:bg-muted transition-colors text-muted-foreground"
                        >
                            Thông báo gì đó với lớp học...
                        </button>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-3">
                            {/* Title input */}
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Tiêu đề (tùy chọn)"
                                className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                            />

                            {/* Content textarea */}
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Nhập nội dung thông báo..."
                                className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm min-h-[120px] resize-none"
                                autoFocus
                            />

                            {/* Type selector */}
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-muted-foreground">Loại:</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as any)}
                                    className="px-3 py-1.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                >
                                    <option value="NORMAL">Thông báo thường</option>
                                    <option value="IMPORTANT">Quan trọng</option>
                                    <option value="URGENT">Khẩn cấp</option>
                                    <option value="EVENT">Sự kiện</option>
                                </select>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-2">
                                <button
                                    type="button"
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                                    title="Đính kèm file (sắp có)"
                                    disabled
                                >
                                    <Paperclip className="w-4 h-4" />
                                    <span>Đính kèm</span>
                                </button>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsExpanded(false);
                                            setTitle("");
                                            setContent("");
                                            setType('NORMAL');
                                        }}
                                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!content.trim() || isSubmitting}
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm flex items-center gap-2"
                                    >
                                        <Send className="w-4 h-4" />
                                        {isSubmitting ? 'Đang đăng...' : 'Đăng bài'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
