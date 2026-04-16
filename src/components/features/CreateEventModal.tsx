"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createPersonalEventAction } from "@/lib/actions/schedule-actions";
import { X, Calendar, Clock, AlignLeft, CheckCircle2, Type, Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/Toast";

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialDate?: Date;
}

export function CreateEventModal({ isOpen, onClose, onSuccess, initialDate }: CreateEventModalProps) {
    const [mounted, setMounted] = useState(false);
    const { showToast } = useToast();
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        location: "",
        date: "",
        startTime: "08:00",
        endTime: "09:00",
        color: "emerald" as "emerald" | "purple" | "pink" | "orange",
        isRecurring: false
    });

    useEffect(() => {
        setMounted(true);
        if (initialDate) {
            setFormData(prev => ({
                ...prev,
                date: initialDate.toISOString().split('T')[0]
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                date: new Date().toISOString().split('T')[0]
            }));
        }
    }, [initialDate]);

    // Lock body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.date || !formData.startTime || !formData.endTime) {
            showToast("Vui lòng điền đầy đủ thông tin", "error");
            return;
        }

        if (formData.startTime >= formData.endTime) {
            showToast("Thời gian kết thúc phải sau thời gian bắt đầu", "error");
            return;
        }

        setSubmitting(true);
        try {
            const eventsToCreate: any[] = [];
            let currentDate = new Date(formData.date);

            // Determine number of occurrences
            const occurrences = formData.isRecurring ? 4 : 1;

            for (let i = 0; i < occurrences; i++) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const startDateTime = new Date(`${dateStr}T${formData.startTime}:00`).toISOString();
                const endDateTime = new Date(`${dateStr}T${formData.endTime}:00`).toISOString();

                eventsToCreate.push({
                    title: formData.title,
                    description: formData.description,
                    start: startDateTime,
                    end: endDateTime,
                    color: formData.color,
                    location: formData.location
                });

                // Add 7 days for next iteration
                currentDate.setDate(currentDate.getDate() + 7);
            }

            // Execute creation in parallel
            await Promise.all(eventsToCreate.map(evt => createPersonalEventAction(evt)));

            showToast(`Đã tạo ${occurrences > 1 ? `${occurrences} sự kiện` : 'sự kiện'} thành công!`, "success");
            onSuccess?.();
            onClose();

            // Reset form
            setFormData({
                title: "",
                description: "",
                location: "",
                date: new Date().toISOString().split('T')[0],
                startTime: "08:00",
                endTime: "09:00",
                color: "emerald",
                isRecurring: false
            });
        } catch (error) {
            console.error("Failed to create event", error);
            showToast("Có lỗi xảy ra khi tạo sự kiện", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <AnimatePresence mode="wait">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998]"
            />
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden pointer-events-auto border border-gray-100"
                >
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-600">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg text-gray-800">Tạo sự kiện mới</h2>
                                <p className="text-xs text-gray-500">Thêm lịch cá nhân vào thời khóa biểu</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Type className="w-4 h-4 text-gray-400" />
                                Tiêu đề <span className="text-red-500">*</span>
                            </label>
                            <input
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="VD: Học thêm Toán, Tập Gym..."
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    Ngày <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    Bắt đầu <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    Kết thúc <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Palette className="w-4 h-4 text-gray-400" />
                                Màu sắc
                            </label>
                            <div className="flex gap-3">
                                {[
                                    { id: 'emerald', bg: 'bg-emerald-500' },
                                    { id: 'purple', bg: 'bg-purple-500' },
                                    { id: 'pink', bg: 'bg-pink-500' },
                                    { id: 'orange', bg: 'bg-orange-500' }
                                ].map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color: c.id as any })}
                                        className={`w-8 h-8 rounded-full ${c.bg} transition-transform ${formData.color === c.id ? 'ring-2 ring-offset-2 ring-gray-300 scale-110' : 'hover:scale-105'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <AlignLeft className="w-4 h-4 text-gray-400" />
                                Địa điểm
                            </label>
                            <input
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="VD: Phòng 302, Sân bóng..."
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <AlignLeft className="w-4 h-4 text-gray-400" />
                                Mô tả
                            </label>
                            <textarea
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Ghi chú thêm..."
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none resize-none"
                            />
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                            <input
                                type="checkbox"
                                checked={formData.isRecurring}
                                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                                className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                            />
                            <div>
                                <span className="font-medium text-sm text-gray-800 block">Lặp lại hàng tuần</span>
                                <span className="text-xs text-gray-500">Tự động tạo sự kiện này cho 4 tuần tới</span>
                            </div>
                        </label>

                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2.5 rounded-xl font-medium text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all disabled:opacity-70 flex items-center gap-2"
                            >
                                {submitting ? "Đang tạo..." : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Tạo sự kiện
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
