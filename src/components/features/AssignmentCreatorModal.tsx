"use client";

import { useState, useEffect, Suspense } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUserAction, getAssignmentsAction, createAssignmentAction, getClassesAction } from "@/lib/actions";
import { Class, User, FileAttachment, RubricItem, AISettings } from "@/types";
import { ArrowLeft, BookOpen, Calendar, FileText, Plus, Paperclip, AlertCircle, Settings, Sparkles, CheckCircle2, Users, Clock, X, ChevronRight, Loader2, Zap, Calculator } from "lucide-react";
import { FileUpload } from "@/components/ui/FileUpload";
import { AIQuizGenerator } from "@/components/features/AIQuizGenerator";
import { RubricBuilder } from "@/components/features/RubricBuilder";
import { ClassSelectionModal } from "./ClassSelectionModal";
import { QuizQuestion } from "@/lib/ai-service";
import { useToast } from "@/components/ui/Toast";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { refineAssignmentAction } from "@/lib/ai-actions";
import { ElegantSelect } from "@/components/ui/ElegantSelect";
import { MathHelper } from "@/components/ui/MathHelper";
import { useSubject } from "@/contexts/SubjectContext";

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
    const [showMathHelper, setShowMathHelper] = useState(false);
    // AI data
    const [aiParams, setAiParams] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [isPolishing, setIsPolishing] = useState(false);
    const [step, setStep] = useState(1);
    const [mounted, setMounted] = useState(false);
    const { showToast } = useToast();

    const { primarySubject } = useSubject();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        subject: primarySubject ? primarySubject.name : "Toán",
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
                                    {/* Header with Live Title */}
                                    <div className="px-6 pt-5 pb-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                                                <Plus className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h2 className="text-lg font-bold text-gray-900 truncate">
                                                    {formData.title || 'Tạo bài tập mới'}
                                                </h2>
                                                <p className="text-sm text-muted-foreground">
                                                    {formData.subject} • {formData.type === 'exercise' ? 'Bài tập' : formData.type === 'test' ? 'Kiểm tra' : 'Dự án'}
                                                </p>
                                            </div>
                                            {formData.dueDate && (
                                                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(formData.dueDate).toLocaleDateString('vi-VN')}
                                                </div>
                                            )}
                                        </div>
                                    </div>

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
                                                        <label className="text-sm font-medium flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                                            Mô tả chi tiết <span className="text-red-500">*</span>
                                                        </label>

                                                        <div className="border border-input rounded-xl overflow-hidden bg-background focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                                                            <textarea
                                                                required
                                                                rows={10}
                                                                value={formData.description}
                                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                                className="w-full px-4 py-3 bg-transparent resize-none transition-all focus:outline-none"
                                                                placeholder="Nhập nội dung bài tập, hướng dẫn làm bài...

💡 Sử dụng 'Công cụ hỗ trợ' ở bên phải để:
   • Chèn công thức toán học
   • Tạo đề thi tự động bằng AI
   • Làm đẹp nội dung với AI"
                                                            />
                                                            <div className="px-4 py-2 bg-muted/30 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                                                                <span>Xem công cụ hỗ trợ ở panel bên phải →</span>
                                                                <span>{formData.description.length} ký tự</span>
                                                            </div>
                                                        </div>
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
                                                            <ElegantSelect
                                                                value={formData.maxScore.toString()}
                                                                onChange={(val) => setFormData({ ...formData, maxScore: parseInt(val) })}
                                                                options={[
                                                                    { value: "10", label: "10 điểm" },
                                                                    { value: "100", label: "100 điểm" },
                                                                    { value: "4", label: "4 điểm (GPA)" }
                                                                ]}
                                                                className="w-full"
                                                            />
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

                                                    {/* Rubric - Optional with Toggle */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-100 dark:border-emerald-800 rounded-xl">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                                                                    <span className="text-lg">📊</span>
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-medium text-gray-900 dark:text-gray-100">Tiêu chí chấm điểm (Rubric)</h3>
                                                                    <p className="text-sm text-muted-foreground">Tùy chọn - AI sẽ chấm dựa trên tiêu chí này</p>
                                                                </div>
                                                            </div>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.rubric.length > 0}
                                                                    onChange={(e) => {
                                                                        if (!e.target.checked) {
                                                                            setFormData({ ...formData, rubric: [] });
                                                                        } else {
                                                                            setFormData({
                                                                                ...formData,
                                                                                rubric: [{ id: `rubric_${Date.now()}`, criteria: '', maxPoints: 10, description: '' }]
                                                                            });
                                                                        }
                                                                    }}
                                                                    className="sr-only peer"
                                                                />
                                                                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-emerald-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                                                            </label>
                                                        </div>

                                                        <AnimatePresence>
                                                            {formData.rubric.length > 0 && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    transition={{ duration: 0.2 }}
                                                                >
                                                                    <RubricBuilder
                                                                        value={formData.rubric}
                                                                        onChange={(newRubric) => setFormData({ ...formData, rubric: newRubric })}
                                                                    />
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
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
                                                                    <ElegantSelect
                                                                        value={formData.aiSettings.tone}
                                                                        onChange={(val: any) => setFormData({
                                                                            ...formData,
                                                                            aiSettings: { ...formData.aiSettings, tone: val }
                                                                        })}
                                                                        options={[
                                                                            { value: "encouraging", label: "Động viên, khích lệ" },
                                                                            { value: "formal", label: "Trang trọng, chuyên nghiệp" },
                                                                            { value: "constructive", label: "Xây dựng, chi tiết" }
                                                                        ]}
                                                                        className="w-full"
                                                                    />
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

                        {/* Right Column: Single Unified Card */}
                        <div className="lg:col-span-5">
                            <motion.div
                                initial={{ opacity: 0, y: 35, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 15, scale: 0.98 }}
                                className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] border border-white/80 overflow-hidden h-full flex flex-col"
                            >
                                {/* Header with close button */}
                                <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                            <Calculator className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">Công cụ hỗ trợ</h3>
                                            <p className="text-[10px] text-muted-foreground">Chọn mẫu hoặc chèn công thức</p>
                                        </div>
                                    </div>
                                    <motion.button
                                        onClick={onClose}
                                        className="p-2 hover:bg-white/50 rounded-xl transition-colors"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <X className="w-4 h-4 text-gray-400" />
                                    </motion.button>
                                </div>

                                {/* Tab Navigation */}
                                <div className="flex border-b border-border/50">
                                    <button
                                        type="button"
                                        onClick={() => setShowMathHelper(false)}
                                        className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all ${!showMathHelper
                                            ? 'text-primary border-b-2 border-primary bg-primary/5'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                                            }`}
                                    >
                                        📋 Mẫu & Công cụ
                                    </button>
                                    {(!primarySubject || primarySubject.features.mathHelper) && (
                                        <button
                                            type="button"
                                            onClick={() => setShowMathHelper(true)}
                                            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all ${showMathHelper
                                                ? 'text-primary border-b-2 border-primary bg-primary/5'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                                                }`}
                                        >
                                            📐 Công thức toán
                                        </button>
                                    )}
                                </div>

                                {/* Content Area */}
                                <div className="flex-1 overflow-y-auto">
                                    {!showMathHelper ? (
                                        /* Templates & Tools View */
                                        <div className="p-4 space-y-3">
                                            {/* Assignment Templates */}
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground mb-2">Chọn mẫu bài tập:</p>
                                                <div className="space-y-2">
                                                    {[
                                                        {
                                                            icon: '📝',
                                                            title: 'Bài tập về nhà',
                                                            template: {
                                                                title: 'Bài tập về nhà - ',
                                                                description: '## Mục tiêu\n- Ôn tập kiến thức đã học\n\n## Yêu cầu\n1. Hoàn thành các bài tập sau\n2. Trình bày rõ ràng, sạch đẹp\n\n## Nội dung\n\n',
                                                                type: 'exercise' as const
                                                            }
                                                        },
                                                        {
                                                            icon: '📋',
                                                            title: 'Kiểm tra 15 phút',
                                                            template: {
                                                                title: 'Kiểm tra 15 phút - ',
                                                                description: '# KIỂM TRA 15 PHÚT\n\n**Thời gian:** 15 phút\n**Điểm:** 10 điểm\n\n---\n\n## Câu 1 (3 điểm)\n\n\n## Câu 2 (3 điểm)\n\n\n## Câu 3 (4 điểm)\n\n',
                                                                type: 'test' as const,
                                                                maxScore: 10
                                                            }
                                                        },
                                                        {
                                                            icon: '🎯',
                                                            title: 'Dự án nhóm',
                                                            template: {
                                                                title: 'Dự án - ',
                                                                description: '# DỰ ÁN NHÓM\n\n## Mô tả dự án\n\n\n## Yêu cầu\n- Làm việc theo nhóm 3-5 người\n- Nộp báo cáo + sản phẩm\n\n## Tiêu chí đánh giá\n- Nội dung: 40%\n- Sáng tạo: 30%\n- Trình bày: 30%\n\n## Deadline\n',
                                                                type: 'project' as const
                                                            }
                                                        }
                                                    ].map((item, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => setFormData({
                                                                ...formData,
                                                                ...item.template
                                                            })}
                                                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${formData.type === item.template.type
                                                                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                                                                : 'border-gray-100 hover:border-primary/30 hover:bg-primary/5'
                                                                }`}
                                                        >
                                                            <span className="text-lg">{item.icon}</span>
                                                            <span className={`text-sm font-medium ${formData.type === item.template.type ? 'text-primary' : 'text-gray-700'
                                                                }`}>
                                                                {item.title}
                                                            </span>
                                                            {formData.type === item.template.type && (
                                                                <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="border-t border-border/50 my-2"></div>

                                            {/* AI Tools */}
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground mb-2">Công cụ AI:</p>
                                                <div className="space-y-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAI(true)}
                                                        className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100/70 transition-all text-left"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                                                            <Zap className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-medium text-emerald-700 block">Tạo đề thi AI</span>
                                                            <span className="text-[10px] text-emerald-600/70">Tự động sinh câu hỏi</span>
                                                        </div>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={handleRefineDescription}
                                                        disabled={!formData.description.trim() || isPolishing}
                                                        className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-100/70 transition-all text-left disabled:opacity-50"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                                                            {isPolishing ? (
                                                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                                                            ) : (
                                                                <Sparkles className="w-4 h-4 text-white" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-medium text-purple-700 block">AI làm đẹp nội dung</span>
                                                            <span className="text-[10px] text-purple-600/70">Cải thiện văn phong</span>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Quick Tip */}
                                            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 mt-2">
                                                <p className="text-xs text-amber-700">
                                                    💡 Chuyển sang tab <strong>"Công thức toán"</strong> để chèn ký hiệu!
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Math Helper View */
                                        <MathHelper
                                            onInsert={(char) => {
                                                setFormData({
                                                    ...formData,
                                                    description: formData.description + char
                                                });
                                            }}
                                            onClose={() => setShowMathHelper(false)}
                                        />
                                    )}
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
