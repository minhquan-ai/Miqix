"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { BookOpen, CheckCircle2, ChevronRight, School, GraduationCap, Sparkles, ChevronLeft, Plus, X, Clock, Users } from "lucide-react";
import { createClassAction } from "@/lib/actions";
import { ClassCardTeacher } from "@/components/classes/ClassCardTeacher";
import { Class } from "@/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useToast } from "@/components/ui/Toast";

type ClassType = 'NORMAL' | 'EXTRA';
type Step = 1 | 2 | 3;

interface ScheduleSlot {
    day: string;
    startTime: string;
    endTime: string;
}

interface ClassCreatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const CLASS_THEMES = [
    { id: 'blue', gradient: 'from-blue-500 to-indigo-600', label: 'Xanh dương' },
    { id: 'emerald', gradient: 'from-emerald-500 to-teal-600', label: 'Xanh ngọc' },
    { id: 'violet', gradient: 'from-violet-500 to-purple-600', label: 'Tím' },
    { id: 'rose', gradient: 'from-rose-500 to-pink-600', label: 'Hồng' },
    { id: 'amber', gradient: 'from-amber-500 to-orange-600', label: 'Cam' },
    { id: 'cyan', gradient: 'from-cyan-500 to-sky-600', label: 'Xanh trời' },
];

const GRADES = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

const CLASS_ICONS = [
    { id: '📚', label: 'Sách' },
    { id: '📖', label: 'Sách mở' },
    { id: '✏️', label: 'Bút chì' },
    { id: '🎓', label: 'Mũ tốt nghiệp' },
    { id: '🏫', label: 'Trường học' },
    { id: '🔬', label: 'Khoa học' },
    { id: '🧪', label: 'Hóa học' },
    { id: '📐', label: 'Toán học' },
    { id: '🌍', label: 'Địa lý' },
    { id: '📜', label: 'Lịch sử' },
    { id: '💻', label: 'Tin học' },
    { id: '🎨', label: 'Mỹ thuật' },
];

export function ClassCreatorModal({ isOpen, onClose, onSuccess }: ClassCreatorModalProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<Step>(1);
    const [mounted, setMounted] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        subject: "",
        room: "",
        description: "",
        classType: "NORMAL" as ClassType,
        color: "blue",
        avatar: "📚",
        grade: "10",
        academicYear: "2025-2026",
        scheduleSlots: [] as ScheduleSlot[],
        tuitionFee: "" as string | number,
        startDate: new Date().toISOString().split('T')[0],
        stream: "",
        codeEnabled: true,
        requireApproval: false
    });

    useEffect(() => {
        setMounted(true);
    }, []);

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

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setFormData({
                name: "",
                subject: "",
                room: "",
                description: "",
                classType: "NORMAL" as ClassType,
                color: "blue",
                avatar: "📚",
                grade: "10",
                academicYear: "2025-2026",
                scheduleSlots: [] as ScheduleSlot[],
                tuitionFee: "" as string | number,
                startDate: new Date().toISOString().split('T')[0],
                stream: "",
                codeEnabled: true,
                requireApproval: false
            });
        }
    }, [isOpen]);

    const handleNext = () => {
        if (step === 1) {
            setStep(2);
        } else if (step === 2) {
            if (!formData.name) {
                showToast("Vui lòng nhập tên lớp học", "error");
                return;
            }
            if (formData.classType === 'EXTRA' && !formData.subject) {
                showToast("Vui lòng chọn môn học", "error");
                return;
            }
            setStep(3);
        }
    };

    const handleBack = () => {
        setStep(prev => Math.max(1, prev - 1) as Step);
    };

    const addScheduleSlot = () => {
        setFormData(prev => ({
            ...prev,
            scheduleSlots: [...prev.scheduleSlots, { day: "Thứ 2", startTime: "18:00", endTime: "20:00" }]
        }));
    };

    const removeScheduleSlot = (index: number) => {
        setFormData(prev => ({
            ...prev,
            scheduleSlots: prev.scheduleSlots.filter((_, i) => i !== index)
        }));
    };

    const updateScheduleSlot = (index: number, field: keyof ScheduleSlot, value: string) => {
        setFormData(prev => ({
            ...prev,
            scheduleSlots: prev.scheduleSlots.map((slot, i) =>
                i === index ? { ...slot, [field]: value } : slot
            )
        }));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setLoading(true);

        try {
            const scheduleString = formData.scheduleSlots
                .map(s => `${s.day} ${s.startTime}-${s.endTime}`)
                .join(", ");

            const finalData = {
                name: formData.name,
                subject: formData.classType === 'NORMAL' ? 'Tổng hợp' : formData.subject,
                description: formData.description,
                grade: formData.grade,
                schedule: scheduleString,
                maxStudents: 45,
                codeEnabled: formData.codeEnabled,
                avatar: formData.avatar,
                color: formData.color,
                classType: formData.classType,
                tuitionFee: formData.tuitionFee ? Number(formData.tuitionFee.toString().replace(/\D/g, '')) : undefined,
                startDate: formData.startDate,
                stream: formData.stream || undefined,
                requireApproval: formData.requireApproval
            };

            const result = await createClassAction(finalData);

            if (result?.success) {
                showToast("Tạo lớp học thành công!", "success");
                onSuccess?.();
                onClose();
            } else {
                showToast(result?.message || "Không thể tạo lớp học.", "error");
            }
        } catch (error) {
            console.error("Failed to create class", error);
            showToast("Có lỗi xảy ra khi tạo lớp", "error");
        } finally {
            setLoading(false);
        }
    };

    const selectedTheme = CLASS_THEMES.find(t => t.id === formData.color) || CLASS_THEMES[0];

    const mockClass: Class = {
        id: "preview",
        name: formData.name || "Tên lớp học",
        subject: formData.classType === 'NORMAL' ? 'Tổng hợp' : (formData.subject || "Môn học"),
        description: formData.description || "Mô tả lớp học...",
        code: "ABC123",
        teacherId: "teacher",
        schedule: formData.scheduleSlots.map(s => `${s.day} ${s.startTime}-${s.endTime}`).join(", "),
        avatar: formData.avatar,
        stream: formData.stream,
        // @ts-ignore
        color: formData.color,
        // @ts-ignore
        classType: formData.classType,
        // Set role based on classType for correct preview display
        role: formData.classType === 'NORMAL' ? 'main' : 'extra',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const steps = [
        { id: 1, title: "Loại lớp", icon: School },
        { id: 2, title: "Thông tin", icon: BookOpen },
        { id: 3, title: "Giao diện", icon: Sparkles },
    ];

    if (!isOpen || !mounted) return null;

    return createPortal(
        <AnimatePresence mode="wait">
            <>
                {/* Refined overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/8 backdrop-blur-xl z-[9998]"
                />

                {/* 3 Card Layout */}
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
                            layout
                            layoutId="main-form-card"
                            initial={{ opacity: 0, y: 40, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.98 }}
                            transition={{
                                layout: { type: "spring", damping: 25, stiffness: 200 },
                                type: "spring",
                                damping: 30,
                                stiffness: 300,
                                mass: 0.8
                            }}
                            className="lg:col-span-7 bg-white/95 backdrop-blur-sm rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] border border-white/80 overflow-hidden flex flex-col min-h-[500px]"
                            style={{ maxHeight: 'calc(100vh - 6rem)' }}
                        >
                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Progress Bar */}
                                <div className="flex items-center justify-between max-w-md mx-auto pb-2">
                                    {steps.map((s, index) => {
                                        const Icon = s.icon;
                                        const isActive = step === s.id;
                                        const isCompleted = step > s.id;
                                        const isLast = index === steps.length - 1;

                                        return (
                                            <div key={s.id} className="flex items-center flex-1 last:flex-initial">
                                                <motion.button
                                                    onClick={() => s.id <= step && setStep(s.id as Step)}
                                                    className={`flex flex-col items-center gap-2.5 group ${s.id <= step ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                                    whileHover={s.id <= step ? { scale: 1.05 } : {}}
                                                    whileTap={s.id <= step ? { scale: 0.98 } : {}}
                                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                >
                                                    <motion.div
                                                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-300 ${isActive
                                                            ? `bg-gradient-to-br ${selectedTheme.gradient} text-white shadow-lg`
                                                            : isCompleted
                                                                ? 'bg-green-100 text-green-600'
                                                                : 'bg-gray-100 text-gray-400'
                                                            }`}
                                                        animate={{ scale: isActive ? 1.08 : 1 }}
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
                                                    <span className={`text-xs font-medium whitespace-nowrap transition-colors duration-200 ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                                                        }`}>
                                                        {s.title}
                                                    </span>
                                                </motion.button>

                                                {!isLast && (
                                                    <div className="flex-1 h-[3px] mx-4 relative rounded-full overflow-hidden">
                                                        <div className="absolute inset-0 bg-gray-100" />
                                                        <motion.div
                                                            className={`absolute inset-0 bg-gradient-to-r ${selectedTheme.gradient}`}
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

                                {/* Step Content */}
                                <AnimatePresence mode="popLayout">
                                    {/* Step 1: Class Type */}
                                    {step === 1 && (
                                        <motion.div
                                            key="step1"
                                            layout
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{
                                                layout: { type: "spring", damping: 20, stiffness: 150 },
                                                duration: 0.25
                                            }}
                                        >
                                            <div className="text-center mb-8">
                                                <h2 className="text-xl font-bold text-gray-900">Chọn mô hình lớp học</h2>
                                                <p className="text-gray-500 mt-2 text-sm">Mô hình nào phù hợp với lớp học của bạn?</p>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-5 max-w-xl mx-auto">
                                                <motion.button
                                                    onClick={() => setFormData({ ...formData, classType: 'NORMAL' })}
                                                    className={cn(
                                                        "relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all",
                                                        formData.classType === 'NORMAL'
                                                            ? "border-blue-500 bg-blue-50/50 shadow-lg"
                                                            : "border-gray-200 hover:border-blue-200 hover:bg-blue-50/30"
                                                    )}
                                                    whileHover={{ y: -4 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <div className={cn(
                                                        "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all",
                                                        formData.classType === 'NORMAL'
                                                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                                                            : "bg-blue-100 text-blue-500"
                                                    )}>
                                                        <School className="w-7 h-7" />
                                                    </div>
                                                    <h3 className="text-base font-bold text-gray-800">Lớp Chính Khóa</h3>
                                                    <p className="text-xs text-gray-500 text-center mt-2">Lớp chủ nhiệm, học nhiều môn</p>
                                                    {formData.classType === 'NORMAL' && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="absolute top-3 right-3"
                                                        >
                                                            <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                                        </motion.div>
                                                    )}
                                                </motion.button>

                                                <motion.button
                                                    onClick={() => setFormData({ ...formData, classType: 'EXTRA' })}
                                                    className={cn(
                                                        "relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all",
                                                        formData.classType === 'EXTRA'
                                                            ? "border-purple-500 bg-purple-50/50 shadow-lg"
                                                            : "border-gray-200 hover:border-purple-200 hover:bg-purple-50/30"
                                                    )}
                                                    whileHover={{ y: -4 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <div className={cn(
                                                        "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all",
                                                        formData.classType === 'EXTRA'
                                                            ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                                                            : "bg-purple-100 text-purple-500"
                                                    )}>
                                                        <GraduationCap className="w-7 h-7" />
                                                    </div>
                                                    <h3 className="text-base font-bold text-gray-800">Lớp Học Thêm / CLB</h3>
                                                    <p className="text-xs text-gray-500 text-center mt-2">Dạy thêm, bồi dưỡng 1 môn</p>
                                                    {formData.classType === 'EXTRA' && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="absolute top-3 right-3"
                                                        >
                                                            <CheckCircle2 className="w-5 h-5 text-purple-500" />
                                                        </motion.div>
                                                    )}
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Step 2: Info */}
                                    {step === 2 && (
                                        <motion.div
                                            key="step2"
                                            layout
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{
                                                layout: { type: "spring", damping: 20, stiffness: 150 },
                                                duration: 0.25
                                            }}
                                            className="max-w-lg mx-auto space-y-5"
                                        >
                                            <div className="mb-4">
                                                <h2 className="text-lg font-bold text-gray-900">
                                                    {formData.classType === 'NORMAL' ? 'Thông tin Lớp Chính Khóa' : 'Thông tin Lớp Học Thêm'}
                                                </h2>
                                            </div>

                                            {/* Class Name */}
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-gray-700">Tên lớp <span className="text-red-500">*</span></label>
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder={formData.classType === 'NORMAL' ? "VD: 12A1" : "VD: Luyện thi Toán 12"}
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>

                                            {/* Homeroom fields */}
                                            {formData.classType === 'NORMAL' && (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-sm font-medium text-gray-700">Khối lớp</label>
                                                            <select
                                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none"
                                                                value={formData.grade}
                                                                onChange={e => setFormData({ ...formData, grade: e.target.value })}
                                                            >
                                                                {GRADES.map(g => <option key={g} value={g}>Khối {g}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-sm font-medium text-gray-700">Năm học</label>
                                                            <input
                                                                type="text"
                                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600"
                                                                value={formData.academicYear}
                                                                readOnly
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Division Field */}
                                                    {/* Division Field */}
                                                    {parseInt(formData.grade) >= 10 && (
                                                        <div className="space-y-1.5">
                                                            <label className="text-sm font-medium text-gray-700">Phân ban <span className="text-gray-400 font-normal">(Lớp 10-12)</span></label>
                                                            <select
                                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none"
                                                                value={formData.stream}
                                                                onChange={e => setFormData({ ...formData, stream: e.target.value })}
                                                            >
                                                                <option value="">Không phân ban</option>
                                                                <option value="KHTN">Khoa học Tự nhiên (A, B)</option>
                                                                <option value="KHXH">Khoa học Xã hội (C, D)</option>
                                                                <option value="COBAN">Cơ bản</option>
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Extra class fields */}
                                            {formData.classType === 'EXTRA' && (
                                                <>
                                                    <div className="space-y-1.5">
                                                        <label className="text-sm font-medium text-gray-700">Môn học <span className="text-red-500">*</span></label>
                                                        <select
                                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none"
                                                            value={formData.subject}
                                                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                                        >
                                                            <option value="">Chọn môn học...</option>
                                                            <option value="Toán học">Toán học</option>
                                                            <option value="Vật Lý">Vật Lý</option>
                                                            <option value="Hóa Học">Hóa Học</option>
                                                            <option value="Tiếng Anh">Tiếng Anh</option>
                                                            <option value="Ngữ Văn">Ngữ Văn</option>
                                                            <option value="Khác">Khác</option>
                                                        </select>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-sm font-medium text-gray-700">Học phí <span className="text-gray-400 font-normal">(VND)</span></label>
                                                            <input
                                                                type="text"
                                                                placeholder="0 ₫"
                                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                                value={formData.tuitionFee ? new Intl.NumberFormat('vi-VN').format(Number(formData.tuitionFee.toString().replace(/\D/g, ''))) : ''}
                                                                onChange={e => {
                                                                    const raw = e.target.value.replace(/\D/g, '');
                                                                    setFormData({ ...formData, tuitionFee: raw });
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-sm font-medium text-gray-700">Ngày bắt đầu</label>
                                                            <input
                                                                type="date"
                                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                                value={formData.startDate}
                                                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Schedule */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                                <Clock className="w-4 h-4 text-gray-400" />
                                                                Lịch học
                                                            </label>
                                                            <button
                                                                type="button"
                                                                onClick={addScheduleSlot}
                                                                className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:underline"
                                                            >
                                                                <Plus className="w-3 h-3" /> Thêm
                                                            </button>
                                                        </div>
                                                        {formData.scheduleSlots.length === 0 && (
                                                            <p className="text-xs text-gray-400 italic">Nhấn "Thêm" để thêm lịch học.</p>
                                                        )}
                                                        {formData.scheduleSlots.map((slot, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                                                                <select
                                                                    className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
                                                                    value={slot.day}
                                                                    onChange={e => updateScheduleSlot(idx, 'day', e.target.value)}
                                                                >
                                                                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                                                </select>
                                                                <input
                                                                    type="time"
                                                                    className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
                                                                    value={slot.startTime}
                                                                    onChange={e => updateScheduleSlot(idx, 'startTime', e.target.value)}
                                                                />
                                                                <span className="text-gray-400">-</span>
                                                                <input
                                                                    type="time"
                                                                    className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
                                                                    value={slot.endTime}
                                                                    onChange={e => updateScheduleSlot(idx, 'endTime', e.target.value)}
                                                                />
                                                                <button type="button" onClick={() => removeScheduleSlot(idx)} className="p-1 text-gray-400 hover:text-red-500">
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Room Field */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-sm font-medium text-gray-700">Phòng học <span className="text-gray-400 font-normal">(tùy chọn)</span></label>
                                                        <input
                                                            type="text"
                                                            placeholder="VD: P.302"
                                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                            value={formData.room}
                                                            onChange={e => setFormData({ ...formData, room: e.target.value })}
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            {/* Description */}
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-gray-700">Mô tả <span className="text-gray-400 font-normal">(tùy chọn)</span></label>
                                                <textarea
                                                    placeholder="Giới thiệu, mục tiêu..."
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none min-h-[70px] resize-none"
                                                    value={formData.description}
                                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Step 3: Appearance */}
                                    {step === 3 && (
                                        <motion.div
                                            key="step3"
                                            layout
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{
                                                layout: { type: "spring", damping: 20, stiffness: 150 },
                                                duration: 0.25
                                            }}
                                            className="max-w-lg mx-auto space-y-6"
                                        >
                                            <div className="mb-4">
                                                <h2 className="text-lg font-bold text-gray-900">Giao diện & Cài đặt</h2>
                                                <p className="text-sm text-gray-500 mt-1">Tùy chỉnh giao diện và quyền truy cập</p>
                                            </div>

                                            {/* Color themes - Improved */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-sm font-medium text-gray-700">Màu chủ đề</label>
                                                    <span className="text-xs text-gray-500 font-medium">
                                                        {CLASS_THEMES.find(t => t.id === formData.color)?.label || 'Chọn màu'}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-6 gap-3">
                                                    {CLASS_THEMES.map((theme) => (
                                                        <motion.button
                                                            key={theme.id}
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, color: theme.id })}
                                                            className={cn(
                                                                "relative w-full aspect-square rounded-full transition-all group",
                                                                `bg-gradient-to-br ${theme.gradient}`,
                                                                formData.color === theme.id
                                                                    ? "ring-4 ring-offset-2 ring-blue-400 shadow-lg scale-110"
                                                                    : "hover:scale-105 shadow-md"
                                                            )}
                                                            whileHover={{ scale: formData.color === theme.id ? 1.1 : 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            title={theme.label}
                                                        >
                                                            {formData.color === theme.id && (
                                                                <motion.div
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    className="absolute inset-0 flex items-center justify-center"
                                                                >
                                                                    <CheckCircle2 className="w-5 h-5 text-white drop-shadow-lg" />
                                                                </motion.div>
                                                            )}
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </div>


                                            {/* Toggles - Improved with icons */}
                                            <div className="space-y-3 pt-4 border-t border-gray-200">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cài đặt quyền truy cập</p>

                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-lg">🔑</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-800">Tham gia bằng mã</p>
                                                            <p className="text-xs text-gray-500 mt-0.5">Học sinh nhập mã lớp để tham gia</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, codeEnabled: !formData.codeEnabled })}
                                                        className={cn(
                                                            "w-11 h-6 rounded-full transition-all flex items-center p-0.5 flex-shrink-0",
                                                            formData.codeEnabled ? "bg-blue-500" : "bg-gray-300"
                                                        )}
                                                    >
                                                        <motion.div
                                                            className="w-5 h-5 bg-white rounded-full shadow-sm"
                                                            animate={{ x: formData.codeEnabled ? 20 : 0 }}
                                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                        />
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-lg">✋</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-800">Yêu cầu phê duyệt</p>
                                                            <p className="text-xs text-gray-500 mt-0.5">Giáo viên duyệt yêu cầu tham gia</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, requireApproval: !formData.requireApproval })}
                                                        className={cn(
                                                            "w-11 h-6 rounded-full transition-all flex items-center p-0.5 flex-shrink-0",
                                                            formData.requireApproval ? "bg-blue-500" : "bg-gray-300"
                                                        )}
                                                    >
                                                        <motion.div
                                                            className="w-5 h-5 bg-white rounded-full shadow-sm"
                                                            animate={{ x: formData.requireApproval ? 20 : 0 }}
                                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Footer */}
                            <div className="p-5 border-t border-gray-100 bg-white flex justify-between items-center">
                                <motion.button
                                    type="button"
                                    onClick={() => step > 1 ? handleBack() : onClose()}
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-medium text-sm flex items-center gap-2"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    {step > 1 ? 'Quay lại' : 'Hủy'}
                                </motion.button>

                                {step < 3 ? (
                                    <motion.button
                                        type="button"
                                        onClick={handleNext}
                                        className={`px-6 py-2.5 bg-gradient-to-r ${selectedTheme.gradient} text-white font-medium rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/25`}
                                        whileHover={{ scale: 1.02, y: -1 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Tiếp tục <ChevronRight className="w-4 h-4" />
                                    </motion.button>
                                ) : (
                                    <motion.button
                                        type="button"
                                        onClick={() => handleSubmit()}
                                        disabled={loading}
                                        className={`px-8 py-2.5 bg-gradient-to-r ${selectedTheme.gradient} text-white font-medium rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/25 disabled:opacity-70`}
                                        whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
                                        whileTap={!loading ? { scale: 0.98 } : {}}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Đang tạo...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" />
                                                Tạo lớp học
                                            </>
                                        )}
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>

                        {/* Right Column: 2 Cards */}
                        <div className="lg:col-span-5 flex flex-col gap-4">
                            {/* Card 2: Preview */}
                            <motion.div
                                layout
                                layoutId="preview-card"
                                initial={{ opacity: 0, y: 35, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 15, scale: 0.98 }}
                                transition={{
                                    layout: { type: "spring", damping: 25, stiffness: 200 },
                                    type: "spring",
                                    damping: 28,
                                    stiffness: 280,
                                    delay: 0.08
                                }}
                                className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] border border-white/80 p-5 overflow-hidden"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        </div>
                                        <h3 className="font-semibold text-gray-800">Xem trước</h3>
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
                                <div className="transform scale-[0.92] origin-top">
                                    <ClassCardTeacher classData={mockClass} stats={{ studentCount: 0 }} />
                                </div>
                            </motion.div>

                            {/* Card 3: Tips */}
                            <motion.div
                                layout
                                layoutId="tips-card"
                                initial={{ opacity: 0, y: 35, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 15, scale: 0.98 }}
                                transition={{
                                    layout: { type: "spring", damping: 25, stiffness: 200 },
                                    type: "spring",
                                    damping: 28,
                                    stiffness: 280,
                                    delay: 0.15
                                }}
                                className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] border border-white/80 p-5 flex-1"
                            >
                                <div className="flex items-center gap-2.5 mb-4">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <Users className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <h3 className="font-semibold text-gray-800">Hướng dẫn</h3>
                                </div>
                                <div className="text-sm text-gray-500 space-y-2">
                                    <motion.p
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        {step === 1 && "Chọn loại lớp phù hợp: Lớp chính khóa cho nhiều môn, Lớp học thêm cho 1 môn."}
                                        {step === 2 && (formData.classType === 'NORMAL'
                                            ? "Lớp Chính Khóa sẽ học nhiều môn. GVBM sẽ được mời sau."
                                            : "Nhập đầy đủ môn học, học phí và lịch học.")}
                                        {step === 3 && "Chọn màu và biểu tượng để phân biệt lớp trong danh sách."}
                                    </motion.p>
                                </div>

                                {/* Progress indicator */}
                                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                                    {steps.map((s, index) => (
                                        <motion.div
                                            key={s.id}
                                            className="flex items-center gap-3"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.25 + index * 0.08 }}
                                        >
                                            <motion.div
                                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step > s.id
                                                    ? 'bg-green-100 text-green-600'
                                                    : step === s.id
                                                        ? `bg-gradient-to-br ${selectedTheme.gradient} text-white`
                                                        : 'bg-gray-100 text-gray-400'
                                                    }`}
                                                animate={{ scale: step === s.id ? 1.1 : 1 }}
                                            >
                                                {step > s.id ? '✓' : s.id}
                                            </motion.div>
                                            <span className={`text-xs font-medium ${step > s.id ? 'text-green-600' : step === s.id ? 'text-blue-600' : 'text-gray-400'
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
        </AnimatePresence>,
        document.body
    );
}
