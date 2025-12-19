"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, FileText, Calendar, Paperclip, Sparkles, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { DataService } from "@/lib/data";
import { getCurrentUserAction } from "@/lib/actions";
import { User, FileAttachment, RubricItem, AISettings, Class } from "@/types";
import { FileUpload } from "@/components/ui/FileUpload";
import { RubricBuilder } from "@/components/features/RubricBuilder";
import { useToast } from "@/components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";

interface InClassAssignmentCreatorProps {
    classData: Class;
    onClose: () => void;
    onSuccess?: () => void;
}

export function InClassAssignmentCreator({ classData, onClose, onSuccess }: InClassAssignmentCreatorProps) {

    const router = useRouter();
    const { showToast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(1);
    const [mounted, setMounted] = useState(false);

    // For portal mounting
    useEffect(() => {
        setMounted(true);
    }, []);

    // Lock body scroll when popup is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);


    // Determine if this is an EXTRA class (fixed subject) or NORMAL class (multi-subject)
    const isExtraClass = classData.classType === 'EXTRA';
    const classSubject = classData.subject;

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        // For EXTRA class: use class subject. For NORMAL: use teacher's subject or let them choose
        subject: isExtraClass ? classSubject : "",
        type: "exercise" as "exercise" | "test" | "project",
        dueDate: "",
        maxScore: 10,
        rubric: [] as RubricItem[],
        aiSettings: {
            enabled: true,
            model: 'gemini-pro',
            tone: 'encouraging',
            language: 'vi'
        } as AISettings,
        isPhysical: false,
    });

    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [attachments, setAttachments] = useState<FileAttachment[]>([]);

    useEffect(() => {
        async function loadUser() {
            try {
                const currentUser = await getCurrentUserAction();
                if (!currentUser || currentUser.role !== 'teacher') {
                    onClose();
                    return;
                }
                setUser(currentUser as any);

                // For NORMAL class, set subject based on teacher's subjects
                if (!isExtraClass && currentUser.subjects && currentUser.subjects.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        subject: currentUser.subjects![0] // Default to first subject
                    }));
                }
            } catch (error) {
                console.error("Failed to load user", error);
            } finally {
                setLoading(false);
            }
        }
        loadUser();
    }, [isExtraClass, onClose]);

    const handleFileChange = async (files: File[]) => {
        setUploadedFiles(files);
        try {
            const uploadedAttachments = await Promise.all(
                files.map(async (file) => {
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', file);
                    uploadFormData.append('classId', classData.id);

                    const response = await fetch('/api/upload-resource', {
                        method: 'POST',
                        body: uploadFormData,
                    });

                    if (!response.ok) throw new Error('Upload failed');
                    const data = await response.json();

                    return {
                        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        name: file.name,
                        url: data.fileUrl,
                        type: file.type,
                        size: file.size,
                        uploadedAt: new Date().toISOString()
                    };
                })
            );
            setAttachments(uploadedAttachments);
            showToast("Tải lên file thành công!", "success");
        } catch (error) {
            console.error("Failed to upload files", error);
            showToast("Có lỗi khi tải lên tệp", "error");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (new Date(formData.dueDate) < new Date()) {
            showToast("Hạn nộp phải ở trong tương lai", "error");
            return;
        }

        setSubmitting(true);
        try {
            await DataService.createAssignment({
                title: formData.title,
                description: formData.description,
                subject: formData.subject,
                type: formData.type,
                dueDate: new Date(formData.dueDate).toISOString(),
                maxScore: formData.maxScore,
                teacherId: user.id,
                classIds: [classData.id], // Only this class
                status: "open",
                attachments: attachments.length > 0 ? attachments : undefined,
                rubric: formData.rubric,
                aiSettings: formData.aiSettings,
                isPhysical: formData.isPhysical,
            });

            showToast("Tạo bài tập thành công!", "success");
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error("Failed to create assignment", error);
            showToast("Có lỗi xảy ra khi tạo bài tập", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        if (!mounted) return null;
        return createPortal(
            <div className="fixed inset-0 z-[9998] bg-black/5 backdrop-blur-md flex items-center justify-center">
                <div className="bg-white rounded-2xl p-8 shadow-2xl">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </div>,
            document.body
        );
    }

    if (!user) return null;
    if (!mounted) return null;

    const totalSteps = 3;

    return createPortal(
        <AnimatePresence>
            <>
                {/* Dark overlay - fixed full screen with backdrop blur */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/5 backdrop-blur-md z-[9998]"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                {/* Popup card container - centered with flexbox */}
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.96 }}
                        transition={{ type: "spring", damping: 28, stiffness: 350 }}
                        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200/60 overflow-hidden flex flex-col"
                        style={{ maxHeight: '85vh' }}
                        onClick={(e) => e.stopPropagation()}
                    >

                        {/* Header */}
                        <div className="p-6 border-b border-border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold">Giao bài tập mới</h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {classData.name} • {isExtraClass ? classSubject : 'Chọn môn học'}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-muted rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Progress */}
                            <div className="flex items-center gap-2 mt-4">
                                {[1, 2, 3].map((s) => (
                                    <div
                                        key={s}
                                        className={`flex-1 h-1.5 rounded-full transition-colors ${step >= s ? 'bg-primary' : 'bg-muted'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                            <AnimatePresence mode="wait">
                                {/* Step 1: Basic Info */}
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-5"
                                    >
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                Tiêu đề <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                required
                                                autoFocus
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                placeholder="VD: Bài tập chương Đạo hàm"
                                            />
                                        </div>

                                        {/* Subject - only show for NORMAL class or if teacher has multiple subjects */}
                                        {!isExtraClass && (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">
                                                    Môn học <span className="text-red-500">*</span>
                                                </label>
                                                {user.subjects && user.subjects.length > 1 ? (
                                                    <select
                                                        value={formData.subject}
                                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                        className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    >
                                                        {user.subjects.map(subj => (
                                                            <option key={subj} value={subj}>{subj}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <div className="px-4 py-3 rounded-xl border border-input bg-muted text-muted-foreground">
                                                        {formData.subject || 'Chưa xác định môn'}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Assignment type */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Loại bài tập</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { id: 'exercise', label: 'Bài tập', icon: '📝' },
                                                    { id: 'test', label: 'Kiểm tra', icon: '📋' },
                                                    { id: 'project', label: 'Dự án', icon: '🎯' }
                                                ].map(type => (
                                                    <button
                                                        key={type.id}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, type: type.id as any })}
                                                        className={`p-3 rounded-xl border text-center transition-all ${formData.type === type.id
                                                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                            : 'border-border hover:bg-muted/50'
                                                            }`}
                                                    >
                                                        <div className="text-xl mb-1">{type.icon}</div>
                                                        <div className={`text-sm font-medium ${formData.type === type.id ? 'text-primary' : ''}`}>
                                                            {type.label}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                Mô tả chi tiết <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                required
                                                rows={5}
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-input bg-background resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                placeholder="Nhập nội dung bài tập, hướng dẫn làm bài..."
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 2: Timing & Settings */}
                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-5"
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                                    Hạn nộp <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    required
                                                    value={formData.dueDate}
                                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Thang điểm</label>
                                                <select
                                                    value={formData.maxScore}
                                                    onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                >
                                                    <option value="10">10 điểm</option>
                                                    <option value="100">100 điểm</option>
                                                    <option value="4">4 điểm (GPA)</option>
                                                </select>
                                            </div>
                                        </div>


                                        <label className="flex items-center gap-3 cursor-pointer p-4 border border-border rounded-xl hover:bg-muted/50 transition-all">
                                            <input
                                                type="checkbox"
                                                checked={formData.isPhysical}
                                                onChange={(e) => setFormData({ ...formData, isPhysical: e.target.checked })}
                                                className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                                            />
                                            <div>
                                                <span className="font-medium text-sm block">Nộp bài giấy</span>
                                                <span className="text-xs text-muted-foreground">Học sinh nộp ảnh chụp bài làm trên giấy</span>
                                            </div>
                                        </label>

                                        {/* AI Settings Card */}
                                        <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Sparkles className="w-5 h-5 text-purple-600" />
                                                    <div>
                                                        <p className="font-medium text-sm">AI Chấm bài tự động</p>
                                                        <p className="text-xs text-muted-foreground">Tiết kiệm thời gian chấm bài</p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.aiSettings.enabled}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            aiSettings: { ...formData.aiSettings, enabled: e.target.checked }
                                                        })}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-purple-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
                                                </label>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 3: Files & Rubric */}
                                {step === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-5"
                                    >
                                        <div className="space-y-3">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                <Paperclip className="w-4 h-4 text-muted-foreground" />
                                                Tài liệu đính kèm
                                            </label>
                                            <FileUpload
                                                onFilesSelected={handleFileChange}
                                                maxFiles={5}
                                                maxSizeMB={10}
                                                existingFiles={uploadedFiles}
                                            />
                                            <p className="text-xs text-muted-foreground">Tối đa 5 file, mỗi file không quá 10MB</p>
                                        </div>

                                        <div className="space-y-3 pt-4 border-t border-border">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                📊 Tiêu chí chấm điểm (Rubric)
                                            </label>
                                            <RubricBuilder
                                                value={formData.rubric}
                                                onChange={(newRubric) => setFormData({ ...formData, rubric: newRubric })}
                                            />
                                        </div>

                                        {/* Summary */}
                                        <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                                            <h4 className="font-medium mb-3 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 text-blue-600" />
                                                Tóm tắt
                                            </h4>
                                            <div className="space-y-1.5 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Tiêu đề:</span>
                                                    <span className="font-medium">{formData.title || "Chưa nhập"}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Môn học:</span>
                                                    <span className="font-medium">{formData.subject}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Lớp:</span>
                                                    <span className="font-medium">{classData.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Hạn nộp:</span>
                                                    <span className="font-medium">
                                                        {formData.dueDate ? new Date(formData.dueDate).toLocaleString('vi-VN') : "Chưa chọn"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>

                        {/* Footer */}
                        <div className="p-6 border-t border-border bg-muted/30 flex justify-between">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={() => setStep(step - 1)}
                                    className="px-5 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors font-medium text-sm"
                                >
                                    Quay lại
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors font-medium text-sm"
                                >
                                    Hủy
                                </button>
                            )}

                            {step < totalSteps ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (step === 1 && (!formData.title || !formData.description)) {
                                            showToast("Vui lòng điền đầy đủ thông tin", "error");
                                            return;
                                        }
                                        if (step === 2 && !formData.dueDate) {
                                            showToast("Vui lòng chọn hạn nộp", "error");
                                            return;
                                        }
                                        setStep(step + 1);
                                    }}
                                    className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all"
                                >
                                    Tiếp tục
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    onClick={handleSubmit}
                                    className="bg-primary text-primary-foreground px-8 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Đang tạo...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Tạo bài tập
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            </>
        </AnimatePresence>,
        document.body
    );
}
