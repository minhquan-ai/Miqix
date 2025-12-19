"use client";

import { useState } from "react";
import { X, Check, ChevronRight, ChevronLeft, School, GraduationCap, Palette, Layout, Users, BookOpen, Sparkles, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { createClassAction } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CreateClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type ClassType = 'NORMAL' | 'EXTRA';
type Step = 1 | 2 | 3;

const CLASS_THEMES = [
    { id: 'blue', color: 'bg-blue-500', gradient: 'from-blue-500 to-indigo-600', label: 'Xanh dương' },
    { id: 'emerald', color: 'bg-emerald-500', gradient: 'from-emerald-500 to-teal-600', label: 'Xanh ngọc' },
    { id: 'violet', color: 'bg-violet-500', gradient: 'from-violet-500 to-purple-600', label: 'Tím' },
    { id: 'rose', color: 'bg-rose-500', gradient: 'from-rose-500 to-pink-600', label: 'Hồng' },
    { id: 'amber', color: 'bg-amber-500', gradient: 'from-amber-500 to-orange-600', label: 'Cam' },
    { id: 'cyan', color: 'bg-cyan-500', gradient: 'from-cyan-500 to-sky-600', label: 'Xanh trời' },
];

export function CreateClassModal({ isOpen, onClose, onSuccess }: CreateClassModalProps) {
    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        subject: "",
        room: "",
        description: "",
        classType: "NORMAL" as ClassType,
        color: "blue"
    });
    const { showToast } = useToast();

    if (!isOpen) return null;

    const handleNext = () => {
        if (step === 1) {
            // Auto-set subject for NORMAL classes
            if (formData.classType === 'NORMAL') {
                setFormData(prev => ({ ...prev, subject: "General" }));
            } else {
                setFormData(prev => ({ ...prev, subject: "" })); // Reset for EXTRA
            }
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

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const finalData = {
                ...formData,
                subject: formData.classType === 'NORMAL' ? 'Tổng hợp' : formData.subject
            };

            const result = await createClassAction(finalData);
            if (result?.success) {
                showToast("Tạo lớp học thành công!", "success");
                onSuccess();
                onClose();
            } else {
                showToast(result?.message || "Có lỗi xảy ra khi tạo lớp", "error");
            }
        } catch (error) {
            showToast("Có lỗi xảy ra khi tạo lớp", "error");
        } finally {
            setLoading(false);
        }
    };

    const selectedTheme = CLASS_THEMES.find(t => t.id === formData.color) || CLASS_THEMES[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className={`relative px-8 py-6 text-white overflow-hidden bg-gradient-to-r ${selectedTheme.gradient} transition-colors duration-500`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles className="w-32 h-32 transform translate-x-8 -translate-y-8" />
                    </div>

                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-2 opacity-90">
                                <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium backdrop-blur-sm">
                                    Bước {step}/3
                                </span>
                                <span className="text-xs font-medium">
                                    {step === 1 ? "Chọn loại lớp" : step === 2 ? "Thông tin chi tiết" : "Giao diện & Cài đặt"}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold">
                                {step === 1 ? "Bắt đầu hành trình mới" : step === 2 ? "Thiết lập thông tin" : "Hoàn tất lớp học"}
                            </h2>
                            <p className="text-white/90 text-sm mt-1 max-w-md">
                                {step === 1 ? "Chọn mô hình lớp học phù hợp nhất với nhu cầu giảng dạy của bạn." :
                                    step === 2 ? "Cung cấp các thông tin cơ bản để học sinh dễ dàng nhận diện." :
                                        "Tùy chỉnh giao diện để tạo không gian học tập đầy cảm hứng."}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-gray-100">
                    <div
                        className={`h-full bg-gradient-to-r ${selectedTheme.gradient} transition-all duration-500 ease-out`}
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 relative min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid md:grid-cols-2 gap-6 h-full"
                            >
                                <button
                                    onClick={() => setFormData({ ...formData, classType: 'NORMAL' })}
                                    className={cn(
                                        "relative group flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1",
                                        formData.classType === 'NORMAL'
                                            ? `border-${formData.color}-500 bg-${formData.color}-50`
                                            : "border-gray-100 hover:border-blue-200 hover:bg-blue-50/30"
                                    )}
                                >
                                    <div className={cn(
                                        "w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors",
                                        formData.classType === 'NORMAL' ? "bg-white shadow-md text-blue-600" : "bg-blue-100 text-blue-500 group-hover:bg-blue-200"
                                    )}>
                                        <School className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">Lớp Chính Khóa</h3>
                                    <p className="text-sm text-gray-500 text-center leading-relaxed">
                                        Dành cho các lớp chủ nhiệm hoặc lớp học theo chương trình chính quy.
                                        Học sinh sẽ học nhiều môn học trong cùng một lớp.
                                    </p>

                                    {formData.classType === 'NORMAL' && (
                                        <div className="absolute top-4 right-4 text-blue-500">
                                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                    )}
                                </button>

                                <button
                                    onClick={() => setFormData({ ...formData, classType: 'EXTRA' })}
                                    className={cn(
                                        "relative group flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1",
                                        formData.classType === 'EXTRA'
                                            ? `border-${formData.color}-500 bg-${formData.color}-50`
                                            : "border-gray-100 hover:border-purple-200 hover:bg-purple-50/30"
                                    )}
                                >
                                    <div className={cn(
                                        "w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors",
                                        formData.classType === 'EXTRA' ? "bg-white shadow-md text-purple-600" : "bg-purple-100 text-purple-500 group-hover:bg-purple-200"
                                    )}>
                                        <GraduationCap className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">Lớp Học Thêm / CLB</h3>
                                    <p className="text-sm text-gray-500 text-center leading-relaxed">
                                        Dành cho các lớp học thêm, lớp bồi dưỡng hoặc câu lạc bộ.
                                        Thường tập trung vào một môn học hoặc chủ đề cụ thể.
                                    </p>

                                    {formData.classType === 'EXTRA' && (
                                        <div className="absolute top-4 right-4 text-purple-500">
                                            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                    )}
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        {formData.classType === 'NORMAL' ? <School className="w-5 h-5 text-blue-600" /> : <GraduationCap className="w-5 h-5 text-purple-600" />}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 text-sm">
                                            Đang tạo: {formData.classType === 'NORMAL' ? "Lớp Chính Khóa" : "Lớp Học Thêm / CLB"}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1">Điền thông tin cơ bản để tiếp tục.</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Tên lớp học <span className="text-red-500">*</span></label>
                                    <input
                                        autoFocus
                                        required
                                        type="text"
                                        placeholder={formData.classType === 'NORMAL' ? "Ví dụ: 12A1 - K45" : "Ví dụ: Luyện thi Toán 12"}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        onKeyDown={e => e.key === 'Enter' && handleNext()}
                                    />
                                </div>

                                {formData.classType === 'EXTRA' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-sm font-semibold text-gray-700">Môn học <span className="text-red-500">*</span></label>
                                        <select
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
                                            value={formData.subject}
                                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                        >
                                            <option value="">Chọn môn học...</option>
                                            <option value="Toán học">Toán học</option>
                                            <option value="Vật Lý">Vật Lý</option>
                                            <option value="Hóa Học">Hóa Học</option>
                                            <option value="Sinh Học">Sinh Học</option>
                                            <option value="Tiếng Anh">Tiếng Anh</option>
                                            <option value="Ngữ Văn">Ngữ Văn</option>
                                            <option value="Lịch Sử">Lịch Sử</option>
                                            <option value="Địa Lý">Địa Lý</option>
                                            <option value="Tin Học">Tin Học</option>
                                            <option value="GDCD">GDCD</option>
                                            <option value="Công Nghệ">Công Nghệ</option>
                                            <option value="Khác">Khác</option>
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Phòng học <span className="text-gray-400 font-normal">(Tùy chọn)</span></label>
                                    <input
                                        type="text"
                                        placeholder="Ví dụ: P.302, Tòa nhà A"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        value={formData.room}
                                        onChange={e => setFormData({ ...formData, room: e.target.value })}
                                        onKeyDown={e => e.key === 'Enter' && handleNext()}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-700">Màu chủ đề</label>
                                    <div className="grid grid-cols-6 gap-3">
                                        {CLASS_THEMES.map((theme) => (
                                            <button
                                                key={theme.id}
                                                onClick={() => setFormData({ ...formData, color: theme.id })}
                                                className={cn(
                                                    "w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-200 relative",
                                                    `bg-gradient-to-br ${theme.gradient}`,
                                                    formData.color === theme.id ? "ring-2 ring-offset-2 ring-gray-400 scale-105 shadow-md" : "hover:scale-105 hover:shadow-sm opacity-80 hover:opacity-100"
                                                )}
                                                title={theme.label}
                                            >
                                                {formData.color === theme.id && <Check className="w-5 h-5 text-white" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Mô tả lớp học</label>
                                    <textarea
                                        placeholder="Giới thiệu về lớp học, mục tiêu, hoặc lời chào mừng..."
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none min-h-[120px] resize-none transition-all"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                    {step > 1 ? (
                        <button
                            onClick={handleBack}
                            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-white hover:shadow-sm rounded-xl transition-all flex items-center gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Quay lại
                        </button>
                    ) : (
                        <div /> // Spacer
                    )}

                    {step < 3 ? (
                        <button
                            onClick={handleNext}
                            className={`px-6 py-2.5 bg-gradient-to-r ${selectedTheme.gradient} text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center gap-2`}
                        >
                            Tiếp tục
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`px-8 py-2.5 bg-gradient-to-r ${selectedTheme.gradient} text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            Hoàn tất tạo lớp
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
