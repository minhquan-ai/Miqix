"use client";

import { X, Search, Check, Users, GraduationCap, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { Class } from "@/types";
import { createPortal } from "react-dom";

interface ClassSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    classes: Class[];
    selectedClassIds: string[];
    onConfirm: (selectedIds: string[]) => void;
}

export function ClassSelectionModal({ isOpen, onClose, classes, selectedClassIds, onConfirm }: ClassSelectionModalProps) {
    const [localSelected, setLocalSelected] = useState<string[]>(selectedClassIds);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState<'all' | 'main' | 'extra'>('all');

    // Reset local state when modal opens
    useEffect(() => {
        if (isOpen) {
            setLocalSelected(selectedClassIds);
            setSearchQuery("");
        }
    }, [isOpen, selectedClassIds]);

    // Don't render if not open (but keep AnimatePresence working by conditional rendering in parent or here)
    // Here we use Portal, so we handle it slightly differently via AnimatePresence wrapping the whole portal content usually.
    // But for simplicity in this codebase structure, we often render content conditionally.

    const filteredClasses = useMemo(() => {
        return classes.filter(cls => {
            const matchesSearch = cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cls.subject.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = filterRole === 'all' || cls.role === filterRole; // Assuming role property exists/mapped
            return matchesSearch && matchesRole;
        });
    }, [classes, searchQuery, filterRole]);

    const toggleClass = (id: string) => {
        setLocalSelected(prev =>
            prev.includes(id)
                ? prev.filter(c => c !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (localSelected.length === filteredClasses.length) {
            // Deselect all visible
            const visibleIds = filteredClasses.map(c => c.id);
            setLocalSelected(prev => prev.filter(id => !visibleIds.includes(id)));
        } else {
            // Select all visible
            const visibleIds = filteredClasses.map(c => c.id);
            setLocalSelected(prev => Array.from(new Set([...prev, ...visibleIds])));
        }
    };

    const handleConfirm = () => {
        onConfirm(localSelected);
        onClose();
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/5 backdrop-blur-xl"
            />

            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{
                    type: "spring",
                    damping: 26,
                    stiffness: 320,
                    mass: 0.8
                }}
                className="relative w-full max-w-2xl bg-white/80 backdrop-blur-xl rounded-[32px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15),0_0_0_1px_rgba(255,255,255,0.5)_inset] border border-white/40 overflow-hidden flex flex-col max-h-[85vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            Chọn lớp học
                        </h2>
                        <p className="text-sm text-gray-500">Đã chọn {localSelected.length} lớp</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Filter & Search Bar */}
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên lớp hoặc môn học..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                            autoFocus
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {[
                                { id: 'all', label: 'Tất cả' },
                                { id: 'main', label: 'Lớp chính' },
                                { id: 'extra', label: 'Lớp thêm' }
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setFilterRole(filter.id as any)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterRole === filter.id
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleSelectAll}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                            {localSelected.length > 0 && localSelected.length === filteredClasses.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </button>
                    </div>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-6 min-h-[300px]">
                    {filteredClasses.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {filteredClasses.map(cls => {
                                const isSelected = localSelected.includes(cls.id);
                                return (
                                    <div
                                        key={cls.id}
                                        onClick={() => toggleClass(cls.id)}
                                        className={`relative group cursor-pointer p-4 rounded-xl border transition-all duration-200 flex items-start gap-3 ${isSelected
                                            ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-500/20'
                                            : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                                            }`}
                                    >
                                        {/* Checkbox indicator */}
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors mt-0.5 ${isSelected
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : 'border-gray-300 bg-white group-hover:border-gray-400'
                                            }`}>
                                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className={`font-bold text-sm mb-0.5 truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                                {cls.name}
                                            </h4>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {cls.subject}
                                                </span>
                                            </div>
                                            {/* Optional: Add more info here like student count */}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-10">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Search className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="font-medium">Không tìm thấy lớp học nào</p>
                            <p className="text-sm">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex items-center justify-end gap-3 z-10">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={localSelected.length === 0}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                    >
                        Xác nhận ({localSelected.length})
                    </button>
                </div>
            </motion.div>
        </div>
    );

    // Use Portal to render at document body level to avoid z-index issues
    if (typeof document === 'undefined') return null;
    return createPortal(
        <AnimatePresence>
            {isOpen && modalContent}
        </AnimatePresence>,
        document.body
    );
}
