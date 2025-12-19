"use client";

import React, { useState, useEffect } from 'react';
import {
    X, Download, Check, Camera, Clock, FileText,
    Image as ImageIcon, Loader2, ChevronLeft, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    markWorksheetCompleteAction,
    markWorksheetViewedAction,
    getStudentWorksheetProgressAction
} from '@/lib/worksheet-actions';
import { useToast } from '@/components/ui/Toast';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface WorksheetViewerProps {
    assignment: {
        id: string;
        title: string;
        worksheetCode?: string | null;
        subject?: string | null;
        description?: string | null;
        worksheetFileUrl?: string | null;
        worksheetFileType?: string | null;
        dueDate: Date | string;
        requirePhoto?: boolean;
        xpReward?: number;
    };
    onClose: () => void;
    onComplete?: () => void;
}

export function WorksheetViewer({ assignment, onClose, onComplete }: WorksheetViewerProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'not_started' | 'viewed' | 'completed'>('not_started');
    const [showPhotoUpload, setShowPhotoUpload] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const isPdf = assignment.worksheetFileType === 'pdf';
    const dueDate = new Date(assignment.dueDate);
    const isOverdue = dueDate < new Date();

    // Mark as viewed on mount
    useEffect(() => {
        markWorksheetViewedAction(assignment.id);

        // Load current progress
        getStudentWorksheetProgressAction(assignment.id).then(progress => {
            if (progress) {
                setStatus(progress.status as any);
            }
        });
    }, [assignment.id]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleMarkComplete = async () => {
        if (assignment.requirePhoto && !photoPreview) {
            setShowPhotoUpload(true);
            return;
        }

        setLoading(true);
        try {
            const result = await markWorksheetCompleteAction(assignment.id, photoPreview || undefined);

            if (result.success) {
                setStatus('completed');
                showToast(`🎉 Hoàn thành! +${assignment.xpReward || 50} XP`, 'success');
                onComplete?.();
            } else {
                showToast(result.message || 'Có lỗi xảy ra', 'error');
            }
        } catch (error) {
            showToast('Có lỗi xảy ra', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!assignment.worksheetFileUrl) return;

        // For base64 data URLs
        if (assignment.worksheetFileUrl.startsWith('data:')) {
            const link = document.createElement('a');
            link.href = assignment.worksheetFileUrl;
            link.download = `${assignment.worksheetCode || assignment.title}.${isPdf ? 'pdf' : 'jpg'}`;
            link.click();
        } else {
            window.open(assignment.worksheetFileUrl, '_blank');
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 z-50 flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-900/50 backdrop-blur-sm">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 text-white/80 hover:text-white"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span>Quay lại</span>
                    </button>
                    <div className="text-center">
                        <h2 className="text-white font-medium">
                            {assignment.worksheetCode && (
                                <span className="text-indigo-400 mr-2">{assignment.worksheetCode}</span>
                            )}
                            {assignment.title}
                        </h2>
                        <p className="text-white/60 text-sm">
                            {assignment.subject || 'Bài tập'}
                        </p>
                    </div>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 text-white/80 hover:text-white"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                </div>

                {/* Deadline Banner */}
                <div className={`px-4 py-2 text-center text-sm ${status === 'completed'
                        ? 'bg-green-600 text-white'
                        : isOverdue
                            ? 'bg-red-600 text-white'
                            : 'bg-indigo-600 text-white'
                    }`}>
                    {status === 'completed' ? (
                        <span className="flex items-center justify-center gap-2">
                            <Check className="w-4 h-4" /> Đã hoàn thành
                        </span>
                    ) : isOverdue ? (
                        <span className="flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4" /> Đã quá hạn
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4" />
                            Hạn: {format(dueDate, 'dd/MM/yyyy HH:mm')}
                            ({formatDistanceToNow(dueDate, { addSuffix: true, locale: vi })})
                        </span>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
                    {assignment.worksheetFileUrl ? (
                        isPdf ? (
                            <iframe
                                src={assignment.worksheetFileUrl}
                                className="w-full h-full max-w-4xl bg-white rounded-lg shadow-lg"
                                title="Worksheet PDF"
                            />
                        ) : (
                            <img
                                src={assignment.worksheetFileUrl}
                                alt={assignment.title}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                            />
                        )
                    ) : (
                        <div className="text-center text-gray-500">
                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>Không có file đính kèm</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {status !== 'completed' && (
                    <div className="p-4 bg-white border-t">
                        {showPhotoUpload ? (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 text-center">
                                    Giáo viên yêu cầu chụp ảnh bài làm
                                </p>

                                {photoPreview ? (
                                    <div className="relative">
                                        <img
                                            src={photoPreview}
                                            alt="Bài làm"
                                            className="w-full h-40 object-cover rounded-lg"
                                        />
                                        <button
                                            onClick={() => setPhotoPreview(null)}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                        <Camera className="w-8 h-8 text-gray-400" />
                                        <span className="text-sm text-gray-500">Chụp hoặc chọn ảnh</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={handlePhotoChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowPhotoUpload(false)}
                                        className="flex-1 px-4 py-3 text-gray-600 border rounded-lg"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleMarkComplete}
                                        disabled={!photoPreview || loading}
                                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Check className="w-5 h-5" />
                                                Xác nhận
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleMarkComplete}
                                    disabled={loading}
                                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Check className="w-5 h-5" />
                                            Tôi đã hoàn thành
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => {/* TODO: AI Hints */ }}
                                    className="px-4 py-3 bg-indigo-100 text-indigo-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-200 transition-colors"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    Gợi ý
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
