"use client";

import { BookOpen, Clock, Star, Users, Bell, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Class } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface StudentClassCardProps {
    classData: Class;
    progress?: {
        nextDeadline?: { title: string; dueDate: Date };
        unreadCount?: number;
        pendingAssignments?: number;
    };
}

export function ClassCardStudent({ classData, progress }: StudentClassCardProps) {
    const isMain = classData.role === "main";

    // Color themes matching the assignment cards style
    const theme = isMain
        ? {
            iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
            badge: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
            accent: "text-blue-600",
            progressBar: "bg-blue-500"
        }
        : {
            iconBg: "bg-gradient-to-br from-indigo-500 to-purple-600",
            badge: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",
            accent: "text-indigo-600",
            progressBar: "bg-indigo-500"
        };

    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        // eslint-disable-next-line
        setCurrentTime(Date.now());
    }, []);

    const hasDeadline = progress?.nextDeadline;
    const isUrgent = hasDeadline && currentTime > 0
        ? new Date(progress.nextDeadline!.dueDate).getTime() - currentTime < 24 * 60 * 60 * 1000
        : false;

    // Status badge logic
    const getStatusBadge = () => {
        if (progress?.pendingAssignments && progress.pendingAssignments > 0) {
            return { text: `${progress.pendingAssignments} bài chưa nộp`, style: "bg-amber-100 text-amber-700 ring-1 ring-amber-200" };
        }
        return { text: "Đang học", style: "bg-green-100 text-green-700 ring-1 ring-green-200" };
    };

    const statusBadge = getStatusBadge();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.15)" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="h-full"
        >
            <Link href={`/dashboard/classes/${classData.id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 transition-all duration-300 shadow-sm hover:shadow-xl overflow-hidden flex flex-col h-full group">
                    <div className="p-5 flex flex-col h-full">

                        {/* Header Row: Icon + Status Badge */}
                        <div className="flex items-start justify-between mb-4">
                            {/* Class Icon */}
                            <div className={`w-12 h-12 ${theme.iconBg} rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20`}>
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>

                            {/* Status Badge */}
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${statusBadge.style}`}>
                                {statusBadge.text}
                            </span>
                        </div>

                        {/* Class Name & Subject */}
                        <div className="mb-4 flex-1">
                            <h3 className="font-bold text-base text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors mb-1.5">
                                {classData.name}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-1">
                                {classData.description || `Môn ${classData.subject}`}
                            </p>
                        </div>

                        {/* Progress Stats Row */}
                        <div className="flex items-center gap-3 mb-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" />
                                <span>{classData.studentCount || 0} học sinh</span>
                            </div>
                            <div className="w-px h-3 bg-gray-200" />
                            <div className="flex items-center gap-1.5 capitalize">
                                <span>{classData.subject}</span>
                            </div>
                        </div>

                        {/* Footer: Deadline or Status */}
                        <div className="pt-3 border-t border-gray-100 mt-auto">
                            {hasDeadline ? (
                                <div className={`flex items-center justify-between ${isUrgent ? 'text-red-600' : 'text-gray-500'}`}>
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <Clock className={`w-4 h-4 flex-shrink-0 ${isUrgent ? 'text-red-500' : 'text-gray-400'}`} />
                                        <span className="text-xs font-medium truncate">
                                            {progress?.nextDeadline?.title}
                                        </span>
                                    </div>
                                    <span className={`text-xs font-semibold whitespace-nowrap ml-2 ${isUrgent ? 'text-red-600' : theme.accent}`}>
                                        {formatDistanceToNow(new Date(progress?.nextDeadline!.dueDate), { locale: vi, addSuffix: true })}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <span className="text-xs font-medium">
                                            {classData.studentCount || 0} học sinh
                                        </span>
                                    </div>
                                    <span className={`text-xs font-semibold ${theme.accent}`}>
                                        {classData.subject}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Notification indicator */}
                        {progress?.unreadCount && progress.unreadCount > 0 && (
                            <div className="absolute top-3 right-3">
                                <div className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                    {progress.unreadCount > 9 ? '9+' : progress.unreadCount}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
