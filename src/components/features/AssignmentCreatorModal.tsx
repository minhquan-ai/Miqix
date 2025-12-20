"use client";

import { useState, useEffect, Suspense } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUserAction, getAssignmentsAction, createAssignmentAction, getClassesAction } from "@/lib/actions";
import { Class, User, FileAttachment, RubricItem, AISettings } from "@/types";
import { ArrowLeft, BookOpen, Calendar, FileText, Plus, Paperclip, AlertCircle, Settings, Sparkles, CheckCircle2, Users, Clock, X, ChevronRight, Loader2, Zap } from "lucide-react";
import { FileUpload } from "@/components/ui/FileUpload";
import { AIQuizGenerator } from "@/components/features/AIQuizGenerator";
import { RubricBuilder } from "@/components/features/RubricBuilder";
import { ClassSelectionModal } from "./ClassSelectionModal";
import { QuizQuestion } from "@/lib/ai-service";
import { useToast } from "@/components/ui/Toast";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { refineAssignmentAction } from "@/lib/ai-actions";

interface AssignmentCreatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    preSelectedClassId?: string;
}

export function AssignmentCreatorModal({ isOpen, onClose, onSuccess, preSelectedClassId }: AssignmentCreatorModalProps) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAI, setShowAI] = useState(false);
    const [showClassSelection, setShowClassSelection] = useState(false);
    // AI data
    const [aiParams, setAiParams] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [isPolishing, setIsPolishing] = useState(false);
    const [step, setStep] = useState(1);
    const [mounted, setMounted] = useState(false);
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        subject: "Toán",
        type: "exercise" as "exercise" | "test" | "project",
        dueDate: "",
        maxScore: 10,
        selectedClassIds: preSelectedClassId ? [preSelectedClassId] : [] as string[],
        rubric: [] as RubricItem[],
        aiSettings: {
            enabled: true,
            model: 'llama-3.3-70b-versatile',
            tone: 'encouraging',
            language: 'vi'
        } as AISettings,
        isPhysical: false,
    });

    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [attachments, setAttachments] = useState<FileAttachment[]>([]);

    // For portal mounting
    useEffect(() => {
        setMounted(true);
    }, []);

    // Lock body scroll when popup is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        async function loadData() {
            try {
                const currentUser = await getCurrentUserAction();
                if (!currentUser || currentUser.role !== 'teacher') {
                    onClose();
                    return;
                }
                setUser(currentUser as any);
                const teacherClasses = await getClassesAction();
                setClasses(teacherClasses as unknown as Class[]);
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [isOpen, onClose]);

    const handleFileChange = async (files: File[]) => {
        setUploadedFiles(files);
        try {
            const uploadedAttachments = await Promise.all(
                files.map(async (file) => {
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', file);

                    const response = await fetch('/api/upload-resource', {
                        method: 'POST',
                        body: uploadFormData,
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error("Upload API Error:", response.status, errorText);
                        throw new Error(`Upload failed: ${response.status} ${errorText}`);
                    }
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

    const handleAIResult = (questions: QuizQuestion[]) => {
        const description = questions.map((q, i) =>
            `### Câu ${i + 1}: ${q.question}\n${q.options.map((opt, j) => `- **${String.fromCharCode(65 + j)}**. ${opt}`).join('\n')}\n`
        ).join('\n');

        setFormData(prev => ({
            ...prev,
            description: prev.description + (prev.description ? '\n\n' : '') + '--- AI GỢI Ý ---\n' + description
        }));
        setShowAI(false);
    };

    const handleRefineDescription = async () => {
        if (!formData.description.trim() || isPolishing) return;

        setIsPolishing(true);
        try {
            const refined = await refineAssignmentAction(formData.description);
            setFormData(prev => ({ ...prev, description: refined }));
            showToast("Đã tối ưu nội dung bài tập!", "success");
        } catch (error) {
            console.error("Refine error:", error);
            showToast("Có lỗi khi tối ưu nội dung", "error");
        } finally {
            setIsPolishing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (formData.selectedClassIds.length === 0) {
            showToast("Vui lòng chọn ít nhất một lớp học", "error");
            return;
        }

        if (new Date(formData.dueDate) < new Date()) {
            showToast("Hạn nộp phải ở trong tương lai", "error");
            return;
        }

        setSubmitting(true);
        try {
            await createAssignmentAction({
                title: formData.title,
                description: formData.description,
                subject: formData.subject,
                type: formData.type,
                dueDate: new Date(formData.dueDate).toISOString(),
                maxScore: formData.maxScore,
                teacherId: user.id,
                classIds: formData.selectedClassIds,
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

    const toggleClass = (classId: string) => {
        setFormData(prev => ({
            ...prev,
            selectedClassIds: prev.selectedClassIds.includes(classId)
                ? prev.selectedClassIds.filter(id => id !== classId)
                : [...prev.selectedClassIds, classId]
        }));
    };

    if (!isOpen || !mounted) return null;

    const steps = [
        { id: 1, title: "Thông tin cơ bản", icon: FileText },
        { id: 2, title: "Lớp học & Thời gian", icon: Calendar },
        { id: 3, title: "Tài liệu & Rubric", icon: Paperclip },
        { id: 4, title: "Cài đặt AI", icon: Sparkles },
    ];

    return createPortal(
        <AnimatePresence mode="wait">
            <>
                {/* Refined overlay with smoother fade */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/8 backdrop-blur-xl z-[9998]"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                {/* 3 Separate Popup Cards with gaps */}
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-6 overflow-auto"
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        className="w-full max-w-7xl grid lg:grid-cols-12 gap-5 my-4"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Card 1: Main Form (7 cols) */}
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.98 }}
                            className="lg:col-span-7 bg-white/95 backdrop-blur-sm rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] border border-white/80 overflow-hidden flex flex-col min-h-[500px]"
                            style={{ maxHeight: 'calc(100vh - 6rem)' }}
                        >

                            {loading ? (
                                <div className="p-12 flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : user ? (
                                <>
                                    {/* Scrollable Form Content */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                        {/* Progress Bar - Refined */}
                                        <div className="flex items-center justify-between max-w-2xl mx-auto pb-2">
                                            {steps.map((s, index) => {
                                                const Icon = s.icon;
                                                const isActive = step === s.id;
                                                const isCompleted = step > s.id;
                                                const isLast = index === steps.length - 1;

                                                return (
                                                    <div key={s.id} className="flex items-center flex-1 last:flex-initial">
                                                        {/* Step Circle + Label */}
                                                        <motion.button
                                                            onClick={() => s.id <= step && setStep(s.id)}
                                                            className={`flex flex-col items-center gap-2.5 group ${s.id <= step ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                                            whileHover={s.id <= step ? { scale: 1.05 } : {}}
                                                            whileTap={s.id <= step ? { scale: 0.98 } : {}}
                                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                        >
                                                            <motion.div
                                                                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-300 ${isActive
                                                                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                                                    : isCompleted
                                                                        ? 'bg-primary/10 text-primary'
                                                                        : 'bg-gray-100 text-gray-400'
                                                                    }`}
                                                                animate={{
                                                                    scale: isActive ? 1.08 : 1,
                                                                }}
                                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                            >
                                                                {isCompleted ? (
                                                                    <motion.div
                                                                        initial={{ scale: 0, rotate: -180 }}
                                                                        animate={{ scale: 1, rotate: 0 }}
                                                                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                                                    >
                                                                        <CheckCircle2 className="w-5 h-5" />
                                                                    </motion.div>
                                                                ) : (
                                                                    <Icon className="w-5 h-5" />
                                                                )}
                                                            </motion.div>
                                                            <span className={`text-xs font-medium text-center max-w-[80px] leading-tight transition-colors duration-200 ${isActive ? 'text-primary' : isCompleted ? 'text-primary/70' : 'text-gray-400'
                                                                }`}>
                                                                {s.title}
                                                            </span>
                                                        </motion.button>

                                                        {/* Connecting Line (not for last item) */}
                                                        {!isLast && (
                                                            <div className="flex-1 h-[3px] mx-4 relative rounded-full overflow-hidden">
                                                                <div className="absolute inset-0 bg-gray-100" />
                                                                <motion.div
                                                                    className="absolute inset-0 bg-primary"
                                                                    initial={{ scaleX: 0 }}
                                                                    animate={{ scaleX: isCompleted ? 1 : 0 }}
                                                                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                                                    style={{ transformOrigin: "left" }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>


                                        {/* Form Content */}
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            {/* Step 1: Basic Info */}
                                            {step === 1 && (
                                                <div className="space-y-5">
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Tiêu đề <span className="text-red-500">*</span></label>
                                                            <input
                                                                required
                                                                value={formData.title}
                                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                                placeholder="VD: Bài tập chương Đạo hàm"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Môn học <span className="text-red-500">*</span></label>
                                                            <input
                                                                required
                                                                value={formData.subject}
                                                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                                placeholder="VD: Toán"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Loại bài tập</label>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {[
                                                                { id: 'exercise', label: 'Bài tập', icon: '📝' },
                                                                { id: 'test', label: 'Kiểm tra', icon: '📋' },
                                                                { id: 'project', label: 'Dự án', icon: '🎯' }
                                                            ].map(type => (
                                                                <button
                                                                    key={type.id}
                                                                    type="button"
                                                                    onClick={() => setFormData({ ...formData, type: type.id as any })}
                                                                    className={`p-4 rounded-xl border text-center transition-all ${formData.type === type.id
                                                                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                                        : 'border-border hover:bg-muted/50'
                                                                        }`}
                                                                >
                                                                    <div className="text-2xl mb-1">{type.icon}</div>
                                                                    <div className={`text-sm font-medium ${formData.type === type.id ? 'text-primary' : ''}`}>
                                                                        {type.label}
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                                            Mô tả chi tiết <span className="text-red-500">*</span>
                                                        </label>

                                                        <textarea
                                                            required
                                                            rows={6}
                                                            value={formData.description}
                                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                            className="w-full px-4 py-3 rounded-xl border border-input bg-background resize-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                            placeholder="Nhập nội dung bài tập, hướng dẫn làm bài..."
                                                        />
                                                    </div>

                                                    {showAI && (
                                                        <AIQuizGenerator
                                                            onAccept={handleAIResult}
                                                            onCancel={() => setShowAI(false)}
                                                        />
                                                    )}
                                                </div>
                                            )}

                                            {/* Step 2: Class & Time */}
                                            {step === 2 && (
                                                <div className="space-y-5">
                                                    <div className="space-y-3">
                                                        <label className="text-sm font-medium flex items-center gap-2">
                                                            <Users className="w-4 h-4 text-muted-foreground" />
                                                            Chọn lớp học <span className="text-red-500">*</span>
                                                        </label>

                                                        <div className="space-y-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowClassSelection(true)}
                                                                className="w-full flex items-center justify-between p-4 rounded-xl border border-input bg-background hover:bg-muted/50 hover:border-primary/50 transition-all group"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                                                        <Users className="w-5 h-5 text-blue-600" />
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <div className="font-semibold text-gray-900">
                                                                            {formData.selectedClassIds.length > 0
                                                                                ? `Đã chọn ${formData.selectedClassIds.length} lớp`
                                                                                : "Chưa chọn lớp nào"
                                                                            }
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            Nhấn để mở danh sách lớp
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                                                            </button>

                                                            {/* Selected Class Chips */}
                                                            {formData.selectedClassIds.length > 0 && (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {classes
                                                                        .filter(c => formData.selectedClassIds.includes(c.id))
                                                                        .map(cls => (
                                                                            <div
                                                                                key={cls.id}
                                                                                className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-medium text-blue-700 animate-in fade-in zoom-in-95 duration-200"
                                                                            >
                                                                                <span>{cls.name}</span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        toggleClass(cls.id);
                                                                                    }}
                                                                                    className="p-0.5 hover:bg-blue-100 rounded-full transition-colors"
                                                                                >
                                                                                    <X className="w-3 h-3" />
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <ClassSelectionModal
                                                            isOpen={showClassSelection}
                                                            onClose={() => setShowClassSelection(false)}
                                                            classes={classes}
                                                            selectedClassIds={formData.selectedClassIds}
                                                            onConfirm={(ids) => setFormData({ ...formData, selectedClassIds: ids })}
                                                        />
                                                    </div>

                                                    <div className="grid md:grid-cols-2 gap-4">
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
                                                </div>
                                            )}

                                            {/* Step 3: Files & Rubric */}
                                            {step === 3 && (
                                                <div className="space-y-6">
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
                                                    </div>

                                                    <div className="space-y-3">
                                                        <label className="text-sm font-medium">📊 Tiêu chí chấm điểm (Rubric)</label>
                                                        <RubricBuilder
                                                            value={formData.rubric}
                                                            onChange={(newRubric) => setFormData({ ...formData, rubric: newRubric })}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Step 4: AI Settings */}
                                            {step === 4 && (
                                                <div className="space-y-6">
                                                    <div className="p-5 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 border border-purple-100 dark:border-purple-800 rounded-xl">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                                                    <Sparkles className="w-5 h-5 text-purple-600" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-medium">AI Chấm bài tự động</h3>
                                                                    <p className="text-sm text-muted-foreground">Sử dụng AI để hỗ trợ chấm điểm</p>
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

                                                        {formData.aiSettings.enabled && (
                                                            <div className="space-y-4 pt-4 border-t border-purple-100">
                                                                <div className="space-y-2">
                                                                    <label className="text-sm font-medium">Phong cách nhận xét</label>
                                                                    <select
                                                                        value={formData.aiSettings.tone}
                                                                        onChange={(e) => setFormData({
                                                                            ...formData,
                                                                            aiSettings: { ...formData.aiSettings, tone: e.target.value as any }
                                                                        })}
                                                                        className="w-full px-4 py-2 rounded-lg border border-purple-200 bg-white/50 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                                                                    >
                                                                        <option value="encouraging">Động viên, khích lệ</option>
                                                                        <option value="formal">Trang trọng, chuyên nghiệp</option>
                                                                        <option value="constructive">Xây dựng, chi tiết</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Summary */}
                                                    <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-5">
                                                        <h4 className="font-medium mb-4 flex items-center gap-2">
                                                            <AlertCircle className="w-4 h-4 text-blue-600" />
                                                            Tóm tắt bài tập
                                                        </h4>
                                                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                                                            <div className="flex justify-between"><span className="text-muted-foreground">Tiêu đề:</span><span className="font-medium">{formData.title || "Chưa nhập"}</span></div>
                                                            <div className="flex justify-between"><span className="text-muted-foreground">Môn học:</span><span className="font-medium">{formData.subject}</span></div>
                                                            <div className="flex justify-between"><span className="text-muted-foreground">Lớp:</span><span className="font-medium">{formData.selectedClassIds.length} lớp</span></div>
                                                            <div className="flex justify-between"><span className="text-muted-foreground">Hạn nộp:</span><span className="font-medium">{formData.dueDate ? new Date(formData.dueDate).toLocaleString('vi-VN') : "Chưa chọn"}</span></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </form>
                                    </div>

                                    {/* Footer - Fixed at bottom */}
                                    <div className="p-5 border-t border-gray-100 bg-white flex justify-between items-center">
                                        <button
                                            type="button"
                                            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                                            className="px-5 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors font-medium text-sm"
                                        >
                                            {step > 1 ? 'Quay lại' : 'Hủy'}
                                        </button>

                                        {step < 4 ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (step === 1 && (!formData.title || !formData.description)) {
                                                        showToast("Vui lòng điền đầy đủ thông tin", "error");
                                                        return;
                                                    }
                                                    if (step === 2 && (!formData.dueDate || formData.selectedClassIds.length === 0)) {
                                                        showToast("Vui lòng chọn lớp và hạn nộp", "error");
                                                        return;
                                                    }
                                                    setStep(step + 1);
                                                }}
                                                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all flex items-center gap-2"
                                            >
                                                Tiếp tục →
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
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
                                </>
                            ) : null}
                        </motion.div>

                        {/* Right Column: 2 Separate Cards */}
                        <div className="lg:col-span-5 flex flex-col gap-4">
                            {/* Card 2: Tips */}
                            <motion.div
                                initial={{ opacity: 0, y: 35, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 15, scale: 0.98 }}
                                className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] border border-white/80 p-5"
                            >
                                {/* Close button */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                                            <span className="text-base">💡</span>
                                        </div>
                                        <h3 className="font-semibold text-gray-800">Mẹo hữu ích</h3>
                                    </div>
                                    <motion.button
                                        onClick={onClose}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <X className="w-4 h-4 text-gray-400" />
                                    </motion.button>
                                </div>
                                <ul className="text-sm text-gray-500 space-y-2.5">
                                    <motion.li
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="flex items-start gap-2"
                                    >
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Tiêu đề ngắn gọn, rõ ràng giúp học sinh dễ nhận biết.</span>
                                    </motion.li>
                                    <motion.li
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="flex items-start gap-2"
                                    >
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Mô tả chi tiết yêu cầu, hướng dẫn làm bài cụ thể.</span>
                                    </motion.li>
                                    <motion.li
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="flex items-start gap-2"
                                    >
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Thử tính năng tạo bài bằng AI để tiết kiệm thời gian.</span>
                                    </motion.li>
                                </ul>
                            </motion.div>

                            {/* Card 3: Progress */}
                            <motion.div
                                initial={{ opacity: 0, y: 35, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 15, scale: 0.98 }}
                                className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] border border-white/80 p-5 flex-1"
                            >
                                <div className="flex items-center gap-2.5 mb-5">
                                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <BookOpen className="w-4 h-4 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-gray-800">Tiến trình</h3>
                                </div>
                                <div className="space-y-3">
                                    {steps.map((s, index) => (
                                        <motion.div
                                            key={s.id}
                                            className="flex items-center gap-3"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 + index * 0.08 }}
                                        >
                                            <motion.div
                                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${step > s.id
                                                    ? 'bg-green-100 text-green-600'
                                                    : step === s.id
                                                        ? 'bg-primary text-white'
                                                        : 'bg-gray-100 text-gray-400'
                                                    }`}
                                                animate={{
                                                    scale: step === s.id ? 1.1 : 1,
                                                }}
                                                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                            >
                                                {step > s.id ? (
                                                    <motion.span
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ type: "spring", stiffness: 500 }}
                                                    >
                                                        ✓
                                                    </motion.span>
                                                ) : s.id}
                                            </motion.div>
                                            <span className={`text-sm font-medium transition-colors duration-200 ${step > s.id ? 'text-green-600' : step === s.id ? 'text-primary' : 'text-gray-400'
                                                }`}>
                                                {s.title}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </>
        </AnimatePresence >,
        document.body
    );
}
