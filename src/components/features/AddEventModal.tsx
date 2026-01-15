"use client";

import { useState } from "react";
import { BaseModal } from "@/components/ui/BaseModal";
import { Calendar, Clock, Type, Tag, AlignLeft } from "lucide-react";

interface AddEventModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddEventModal({ isOpen, onClose }: AddEventModalProps) {
    const [eventType, setEventType] = useState<'study' | 'personal' | 'exam'>('study');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock submission
        onClose();
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Thêm lịch mới"
            subtitle="Tạo sự kiện hoặc lịch học cá nhân"
            size="md"
            accentColor="bg-teal-500"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Event Type Selection */}
                <div className="grid grid-cols-3 gap-3">
                    <button
                        type="button"
                        onClick={() => setEventType('study')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${eventType === 'study'
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <Calendar className="w-5 h-5" />
                        <span className="text-sm font-medium">Lịch học</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setEventType('exam')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${eventType === 'exam'
                                ? 'bg-purple-50 border-purple-200 text-purple-700'
                                : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <Tag className="w-5 h-5" />
                        <span className="text-sm font-medium">Kiểm tra</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setEventType('personal')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${eventType === 'personal'
                                ? 'bg-teal-50 border-teal-200 text-teal-700'
                                : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <Type className="w-5 h-5" />
                        <span className="text-sm font-medium">Cá nhân</span>
                    </button>
                </div>

                {/* Title Input */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Tiêu đề</label>
                    <input
                        type="text"
                        placeholder="Ví dụ: Họp nhóm dự án..."
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        required
                    />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Ngày</label>
                        <div className="relative">
                            <input
                                type="date"
                                className="w-full px-4 py-2.5 pl-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                                required
                            />
                            <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Giờ (Bắt đầu - Kết thúc)</label>
                        <div className="flex gap-2 items-center">
                            <div className="relative flex-1">
                                <input
                                    type="time"
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-center"
                                />
                            </div>
                            <span className="text-gray-400">-</span>
                            <div className="relative flex-1">
                                <input
                                    type="time"
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-center"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                    <textarea
                        rows={3}
                        placeholder="Thêm chi tiết..."
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
                    />
                </div>

                {/* Footer Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                        Hủy
                    </button>
                    <button type="submit" className="px-4 py-2.5 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20 transition-all">
                        Tạo lịch
                    </button>
                </div>
            </form>
        </BaseModal>
    );
}
