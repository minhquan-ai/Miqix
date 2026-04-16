"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createPersonalEventAction } from "@/lib/actions/schedule-actions";
import { X, Clock, MapPin, Repeat, CheckCircle2, Type, Calendar, AlignLeft, Sparkles, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface ScheduleCreationWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialDate?: Date;
}

const CATEGORIES = [
    { id: 'emerald', color: 'bg-emerald-500', label: 'Cá nhân' },
    { id: 'purple', color: 'bg-purple-500', label: 'Học tập' },
    { id: 'pink', color: 'bg-pink-500', label: 'Sức khỏe' },
    { id: 'orange', color: 'bg-orange-500', label: 'Giải trí' },
    { id: 'blue', color: 'bg-blue-500', label: 'Công việc' },
];

export function ScheduleCreationWizard({ isOpen, onClose, onSuccess, initialDate }: ScheduleCreationWizardProps) {
    const [mounted, setMounted] = useState(false);
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        location: "",
        date: "",
        startTime: "08:00",
        endTime: "09:00",
        category: "emerald",
        isRecurring: false,
        recurrenceType: "weekly" as "daily" | "weekly",
    });

    useEffect(() => {
        setMounted(true);
        const dateStr = initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, date: dateStr }));
    }, [initialDate]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            showToast("Vui lòng nhập tiêu đề", "error");
            return;
        }

        setLoading(true);
        try {
            let occurrences = 1;
            let dayIncrement = 0;

            if (formData.isRecurring) {
                occurrences = formData.recurrenceType === 'weekly' ? 4 : 7;
                dayIncrement = formData.recurrenceType === 'weekly' ? 7 : 1;
            }

            let currentDate = new Date(formData.date);
            const eventsToCreate: any[] = [];

            for (let i = 0; i < occurrences; i++) {
                const dateStr = currentDate.toISOString().split('T')[0];
                eventsToCreate.push({
                    title: formData.title,
                    description: formData.description,
                    start: new Date(`${dateStr}T${formData.startTime}:00`).toISOString(),
                    end: new Date(`${dateStr}T${formData.endTime}:00`).toISOString(),
                    color: formData.category,
                    location: formData.location
                });
                currentDate.setDate(currentDate.getDate() + dayIncrement);
            }

            await Promise.all(eventsToCreate.map(evt => createPersonalEventAction(evt)));
            showToast(`Đã tạo ${occurrences > 1 ? `${occurrences} sự kiện` : 'sự kiện'} thành công!`, "success");
            onSuccess?.();
            onClose();

            setFormData({
                title: "",
                description: "",
                location: "",
                date: new Date().toISOString().split('T')[0],
                startTime: "08:00",
                endTime: "09:00",
                category: "emerald",
                isRecurring: false,
                recurrenceType: "weekly"
            });
        } catch (error) {
            console.error("Failed to create event", error);
            showToast("Có lỗi xảy ra", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && mounted && (
                <div key="portal-root">
                    {/* Overlay */}
                    <motion.div
                        key="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/5 backdrop-blur-[8px] z-[9998]"
                    />

                    {/* Modal */}
                    <div key="modal-wrapper" className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <motion.div
                            key="modal-content"
                            initial={{ opacity: 0, scale: 0.96, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 15 }}
                            transition={{ type: "spring", damping: 28, stiffness: 350 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/50"
                        >
                            {/* Header - Simple & Clean */}
                            <div className="flex items-center justify-between px-6 pt-6 pb-2">
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Sự kiện mới</h2>
                                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Form Content */}
                            <div className="p-6 space-y-6">
                                {/* Title Input - Big & Bold */}
                                <div>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Tên sự kiện (VD: Tập Gym)"
                                        className="w-full text-xl font-semibold placeholder:text-gray-300 text-gray-900 bg-transparent border-none focus:ring-0 focus:outline-none p-0"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                    <div className="h-0.5 bg-gray-100 mt-2 w-full" />
                                </div>

                                {/* Main Details Grid */}
                                <div className="space-y-4">
                                    {/* Category Selection - Pills */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                                            <Sparkles className="w-3 h-3" /> Danh mục
                                        </div>
                                        <div className="flex flex-wrap gap-2.5">
                                            {CATEGORIES.map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, category: cat.id })}
                                                    className={cn(
                                                        "flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all border shrink-0",
                                                        formData.category === cat.id
                                                            ? "bg-gray-900 border-gray-900 text-white shadow-md"
                                                            : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50/50"
                                                    )}
                                                >
                                                    <div className={cn("w-2 h-2 rounded-full", cat.color)} />
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Time & Date Row */}
                                    <div className="flex items-center gap-4 p-4 mt-2 bg-gray-50/80 rounded-2xl border border-gray-100 transition-all focus-within:bg-white focus-within:border-indigo-100 focus-within:shadow-sm">
                                        <div className="flex items-center gap-2.5 flex-1 group">
                                            <Calendar className="w-4.5 h-4.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                            <input
                                                type="date"
                                                className="bg-transparent border-none text-sm font-bold text-gray-800 focus:ring-0 focus:outline-none p-0 w-full"
                                                value={formData.date}
                                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            />
                                        </div>
                                        <div className="w-[1.5px] h-6 bg-gray-200/50" />
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4.5 h-4.5 text-gray-400" />
                                            <input
                                                type="time"
                                                className="bg-transparent border-none text-sm font-bold text-gray-800 focus:ring-0 focus:outline-none p-0 w-[65px] text-center"
                                                value={formData.startTime}
                                                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                            />
                                            <span className="text-gray-300 font-medium select-none">→</span>
                                            <input
                                                type="time"
                                                className="bg-transparent border-none text-sm font-bold text-gray-800 focus:ring-0 focus:outline-none p-0 w-[65px] text-center"
                                                value={formData.endTime}
                                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Location Input */}
                                    <div className="flex items-center gap-3 px-4 py-3.5 bg-gray-50/80 rounded-2xl border border-gray-100 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/5 focus-within:border-indigo-100 transition-all">
                                        <MapPin className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                                        <input
                                            type="text"
                                            placeholder="Thêm địa điểm (VD: Thư viện, Online...)"
                                            className="w-full bg-transparent border-none text-sm font-bold text-gray-800 focus:ring-0 focus:outline-none p-0 placeholder:text-gray-300"
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        />
                                    </div>

                                    {/* Description Input */}
                                    <div className="flex flex-col gap-2.5 px-4 py-3.5 bg-gray-50/80 rounded-2xl border border-gray-100 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/5 focus-within:border-indigo-100 transition-all">
                                        <div className="flex items-center gap-2">
                                            <AlignLeft className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Lưu ý thêm</span>
                                        </div>
                                        <textarea
                                            rows={2}
                                            placeholder="Bạn có ghi chú gì đặc biệt cho sự kiện này không?"
                                            className="w-full bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 focus:outline-none p-0 resize-none placeholder:text-gray-300 mt-1 leading-relaxed"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>

                                    {/* Recurrence Selection */}
                                    <div className="bg-indigo-50/30 rounded-2xl p-4 border border-indigo-100/30 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, isRecurring: !formData.isRecurring })}
                                                className={cn(
                                                    "flex items-center gap-3 text-sm font-bold transition-all",
                                                    formData.isRecurring ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-5.5 h-5.5 rounded-lg border-2 flex items-center justify-center transition-all",
                                                    formData.isRecurring ? "bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-100" : "border-gray-200 bg-white"
                                                )}>
                                                    {formData.isRecurring && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                                Lặp lại: <span className="text-gray-400 font-medium ml-1">Chu kỳ</span>
                                            </button>

                                            <AnimatePresence>
                                                {formData.isRecurring && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        className="flex bg-white/60 p-1 rounded-xl border border-indigo-100/50"
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, recurrenceType: 'daily' }); }}
                                                            className={cn(
                                                                "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all",
                                                                formData.recurrenceType === 'daily' ? "bg-indigo-600 text-white shadow-sm" : "text-indigo-400 hover:bg-indigo-50"
                                                            )}
                                                        >
                                                            Ngày
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, recurrenceType: 'weekly' }); }}
                                                            className={cn(
                                                                "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all",
                                                                formData.recurrenceType === 'weekly' ? "bg-indigo-600 text-white shadow-sm" : "text-indigo-400 hover:bg-indigo-50"
                                                            )}
                                                        >
                                                            Tuần
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer actions */}
                            <div className="p-6 pt-2 flex justify-end">
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="px-8 py-3 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl shadow-xl shadow-gray-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            Tạo sự kiện
                                            <ChevronRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
