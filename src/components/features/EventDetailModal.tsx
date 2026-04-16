"use client";

import { createPortal } from "react-dom";
import { X, Calendar, Clock, MapPin, AlignLeft, GraduationCap, ClipboardList, User, Trash2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ScheduleEvent, deletePersonalEventAction } from "@/lib/actions/schedule-actions";

interface EventDetailModalProps {
    event: ScheduleEvent | null;
    onClose: () => void;
    onEventDeleted?: () => void;
}

export function EventDetailModal({ event, onClose, onEventDeleted }: EventDetailModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!event) return null;

    const handleDelete = async () => {
        if (!event.id || !window.confirm("Bạn có chắc chắn muốn xóa sự kiện này không?")) return;

        setIsDeleting(true);
        try {
            await deletePersonalEventAction(event.id);
            onEventDeleted?.();
            onClose();
        } catch (error) {
            console.error("Failed to delete event:", error);
            alert("Có lỗi xảy ra khi xóa sự kiện.");
        } finally {
            setIsDeleting(false);
        }
    };

    const getEventStyles = (type: string, color?: string) => {
        if (type === 'assignment') {
            return {
                bg: "bg-orange-50",
                text: "text-orange-900",
                border: "border-orange-100",
                iconBg: "bg-orange-100",
                iconColor: "text-orange-600",
                badge: "bg-orange-100 text-orange-700",
                label: "Bài tập"
            };
        }
        if (type === 'personal') {
            if (color === 'purple') {
                return {
                    bg: "bg-purple-50",
                    text: "text-purple-900",
                    border: "border-purple-100",
                    iconBg: "bg-purple-100",
                    iconColor: "text-purple-600",
                    badge: "bg-purple-100 text-purple-700",
                    label: "Học tập"
                };
            }
            if (color === 'pink') {
                return {
                    bg: "bg-pink-50",
                    text: "text-pink-900",
                    border: "border-pink-100",
                    iconBg: "bg-pink-100",
                    iconColor: "text-pink-600",
                    badge: "bg-pink-100 text-pink-700",
                    label: "Sức khỏe"
                };
            }
            if (color === 'orange') {
                return {
                    bg: "bg-orange-50",
                    text: "text-orange-900",
                    border: "border-orange-100",
                    iconBg: "bg-orange-100",
                    iconColor: "text-orange-600",
                    badge: "bg-orange-100 text-orange-700",
                    label: "Giải trí"
                };
            }
            if (color === 'blue') {
                return {
                    bg: "bg-blue-50",
                    text: "text-blue-900",
                    border: "border-blue-100",
                    iconBg: "bg-blue-100",
                    iconColor: "text-blue-600",
                    badge: "bg-blue-100 text-blue-700",
                    label: "Công việc"
                };
            }
            // Default Emerald (Cá nhân)
            return {
                bg: "bg-emerald-50",
                text: "text-emerald-900",
                border: "border-emerald-100",
                iconBg: "bg-emerald-100",
                iconColor: "text-emerald-600",
                badge: "bg-emerald-100 text-emerald-700",
                label: "Cá nhân"
            };
        }
        // Default / Class
        return {
            bg: "bg-indigo-50",
            text: "text-indigo-900",
            border: "border-indigo-100",
            iconBg: "bg-indigo-100",
            iconColor: "text-indigo-600",
            badge: "bg-indigo-100 text-indigo-700",
            label: "Lớp học"
        };
    };

    const styles = getEventStyles(event.type, event.color);

    const getIcon = () => {
        if (event.type === 'assignment') return ClipboardList;
        if (event.type === 'personal') return User;
        return GraduationCap;
    };

    const Icon = getIcon();

    return createPortal(
        <AnimatePresence>
            {event && (
                <div className="relative z-[99999]">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-md pointer-events-auto"
                        >
                            <div className={cn(
                                "bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/50 relative",
                                "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/80 before:to-white/40 before:pointer-events-none" // Glass effect layer
                            )}>
                                {/* Decorative Header Background */}
                                <div className={cn(
                                    "absolute top-0 inset-x-0 h-32 bg-gradient-to-br opacity-30",
                                    event.type === 'assignment' ? "from-orange-200 to-amber-100" :
                                        event.type === 'personal' ? "from-emerald-200 to-teal-100" :
                                            "from-indigo-200 to-purple-100"
                                )} />

                                {/* Content */}
                                <div className="relative p-6 pt-8">
                                    {/* Close Button */}
                                    <button
                                        onClick={onClose}
                                        className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full transition-colors shadow-sm backdrop-blur-md z-10"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>

                                    {/* Header Icon */}
                                    <div className={cn(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-6 mx-auto relative z-10",
                                        styles.bg,
                                        styles.border,
                                        "border-4 border-white"
                                    )}>
                                        <Icon className={cn("w-8 h-8", styles.iconColor)} />
                                    </div>

                                    {/* Title & Type */}
                                    <div className="text-center mb-8">
                                        <span className={cn(
                                            "inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3",
                                            styles.badge
                                        )}>
                                            {styles.label}
                                        </span>
                                        <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-2 px-4">
                                            {event.title}
                                        </h2>
                                        {event.className && (
                                            <p className="text-sm font-medium text-gray-400">
                                                {event.className}
                                            </p>
                                        )}
                                    </div>

                                    {/* Details Grid */}
                                    <div className="bg-gray-50/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm border border-gray-100/50">
                                        {/* Time */}
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-white rounded-xl shadow-sm shrink-0 text-gray-400">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Thời gian</p>
                                                <p className="font-semibold text-gray-800">
                                                    {format(new Date(event.start), "EEEE, dd/MM", { locale: vi })}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {format(new Date(event.start), "HH:mm")} - {format(new Date(event.end), "HH:mm")}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Location */}
                                        {event.location && (
                                            <div className="flex items-start gap-4">
                                                <div className="p-2 bg-white rounded-xl shadow-sm shrink-0 text-gray-400">
                                                    <MapPin className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Địa điểm</p>
                                                    <p className="font-semibold text-gray-800">{event.location}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Description */}
                                        {event.description && (
                                            <div className="flex items-start gap-4">
                                                <div className="p-2 bg-white rounded-xl shadow-sm shrink-0 text-gray-400">
                                                    <AlignLeft className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Chi tiết</p>
                                                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                                        {event.description}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-8 flex gap-3">
                                        {event.url ? (
                                            <a
                                                href={event.url}
                                                className={cn(
                                                    "flex-1 text-center py-3.5 rounded-2xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95",
                                                    event.type === 'assignment'
                                                        ? "bg-orange-500 text-white hover:bg-orange-600"
                                                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                                                )}
                                            >
                                                Xem chi tiết
                                            </a>
                                        ) : (
                                            <button
                                                onClick={onClose}
                                                className="flex-1 py-3.5 rounded-2xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all active:scale-95"
                                            >
                                                Đóng
                                            </button>
                                        )}

                                        {event.type === 'personal' && (
                                            <button
                                                onClick={handleDelete}
                                                disabled={isDeleting}
                                                className="w-14 h-[52px] flex items-center justify-center rounded-2xl font-bold bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-sm border border-rose-100/50 disabled:opacity-50"
                                            >
                                                {isDeleting ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-5 h-5" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
