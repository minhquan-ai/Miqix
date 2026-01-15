"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, TrendingUp, TrendingDown, Minus, Flame, BookOpen, Target, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { getWeeklyFocusSessionsAction, getFocusComparisonAction, getFocusStreakAction } from "@/lib/focus-actions";
import { cn } from "@/lib/utils";

interface FocusStats {
    totalMinutes: number;
    totalHours: number;
    sessionCount: number;
    averageSessionMinutes: number;
    bySubject: Record<string, number>;
    byType: Record<string, number>;
}

interface FocusComparison {
    thisWeekMinutes: number;
    lastWeekMinutes: number;
    difference: number;
    percentChange: number;
    trend: "up" | "down" | "same";
}

const TYPE_LABELS: Record<string, string> = {
    review: "Ôn bài",
    homework: "Bài tập",
    reading: "Đọc sách",
    notes: "Ghi chép",
};

const TYPE_COLORS: Record<string, string> = {
    review: "bg-blue-500",
    homework: "bg-orange-500",
    reading: "bg-emerald-500",
    notes: "bg-purple-500",
};

export function FocusAnalyticsWidget() {
    const [stats, setStats] = useState<FocusStats | null>(null);
    const [comparison, setComparison] = useState<FocusComparison | null>(null);
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const [weeklyData, compData, streakData] = await Promise.all([
                    getWeeklyFocusSessionsAction(),
                    getFocusComparisonAction(),
                    getFocusStreakAction(),
                ]);

                if (weeklyData.stats) {
                    setStats(weeklyData.stats);
                }
                if (compData) {
                    setComparison(compData as FocusComparison);
                }
                setStreak(streakData);
            } catch (error) {
                console.error("Error loading focus stats:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm">
                <div className="animate-pulse flex items-center gap-4">
                    <div className="h-8 w-8 bg-gray-100 rounded-xl" />
                    <div className="h-4 bg-gray-100 rounded w-24" />
                    <div className="h-4 bg-gray-100 rounded w-16 ml-auto" />
                </div>
            </div>
        );
    }

    const totalHours = stats ? Math.floor(stats.totalMinutes / 60) : 0;
    const remainingMinutes = stats ? stats.totalMinutes % 60 : 0;
    const timeDisplay = totalHours > 0 ? `${totalHours}h ${remainingMinutes}p` : `${remainingMinutes}p`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
            {/* Compact Header - Always Visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-xl">
                        <BarChart3 className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="text-left">
                        <span className="font-bold text-gray-800 text-sm">Thống kê Tập trung</span>
                        <span className="text-xs text-gray-400 ml-2">Tuần này</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Quick Stats Pills */}
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 rounded-full">
                            <Clock className="w-3 h-3 text-indigo-500" />
                            <span className="text-xs font-bold text-indigo-700">{timeDisplay}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full">
                            <Target className="w-3 h-3 text-emerald-500" />
                            <span className="text-xs font-bold text-emerald-700">{stats?.sessionCount || 0} phiên</span>
                        </div>
                    </div>

                    {/* Streak Badge */}
                    {streak > 0 && (
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white">
                            <Flame className="w-3 h-3" />
                            <span className="text-xs font-bold">{streak}d</span>
                        </div>
                    )}

                    {/* Trend Indicator */}
                    {comparison && (
                        <div className={cn(
                            "flex items-center gap-1 text-xs font-semibold",
                            comparison.trend === "up" ? "text-emerald-600" :
                                comparison.trend === "down" ? "text-red-500" : "text-gray-400"
                        )}>
                            {comparison.trend === "up" ? <TrendingUp className="w-3.5 h-3.5" /> :
                                comparison.trend === "down" ? <TrendingDown className="w-3.5 h-3.5" /> :
                                    <Minus className="w-3.5 h-3.5" />}
                        </div>
                    )}

                    {/* Expand/Collapse Icon */}
                    <div className="p-1 rounded-lg text-gray-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-0 border-t border-gray-100">
                            {/* Main Stats Grid */}
                            <div className="grid grid-cols-3 gap-3 mt-4">
                                {/* Total Time */}
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-100/50">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                        <span className="text-[10px] font-semibold text-indigo-600 uppercase">Tổng</span>
                                    </div>
                                    <p className="text-xl font-black text-gray-800">{timeDisplay}</p>
                                    {comparison && (
                                        <div className={cn(
                                            "flex items-center gap-1 mt-0.5 text-[10px] font-semibold",
                                            comparison.trend === "up" ? "text-emerald-600" :
                                                comparison.trend === "down" ? "text-red-500" : "text-gray-500"
                                        )}>
                                            {comparison.trend === "up" ? "+" : ""}{comparison.difference}p vs tuần trước
                                        </div>
                                    )}
                                </div>

                                {/* Sessions */}
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-100/50">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Target className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="text-[10px] font-semibold text-emerald-600 uppercase">Phiên</span>
                                    </div>
                                    <p className="text-xl font-black text-gray-800">{stats?.sessionCount || 0}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">buổi học</p>
                                </div>

                                {/* Average */}
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-100/50">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                                        <span className="text-[10px] font-semibold text-amber-600 uppercase">TB</span>
                                    </div>
                                    <p className="text-xl font-black text-gray-800">{stats?.averageSessionMinutes || 0}p</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">/buổi</p>
                                </div>
                            </div>

                            {/* Type Breakdown */}
                            {stats && Object.keys(stats.byType).length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Phân loại</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Object.entries(stats.byType).map(([type, seconds]) => {
                                            const minutes = Math.floor(seconds / 60);
                                            return (
                                                <div
                                                    key={type}
                                                    className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-full border border-gray-100"
                                                >
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", TYPE_COLORS[type] || "bg-gray-400")} />
                                                    <span className="text-[10px] font-semibold text-gray-700">
                                                        {TYPE_LABELS[type] || type}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500">{minutes}p</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Subject Breakdown */}
                            {stats && Object.keys(stats.bySubject).length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Theo môn</p>
                                    <div className="space-y-1.5">
                                        {Object.entries(stats.bySubject)
                                            .filter(([subject]) => subject !== "Không xác định")
                                            .slice(0, 3)
                                            .map(([subject, seconds]) => {
                                                const minutes = Math.floor(seconds / 60);
                                                const maxMinutes = Math.max(...Object.values(stats.bySubject).map(s => Math.floor(s / 60)));
                                                const percentage = maxMinutes > 0 ? (minutes / maxMinutes) * 100 : 0;

                                                return (
                                                    <div key={subject} className="space-y-0.5">
                                                        <div className="flex justify-between text-[10px]">
                                                            <span className="font-semibold text-gray-700">{subject}</span>
                                                            <span className="text-gray-500">{minutes}p</span>
                                                        </div>
                                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${percentage}%` }}
                                                                transition={{ duration: 0.4, delay: 0.1 }}
                                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {(!stats || stats.sessionCount === 0) && (
                                <div className="text-center py-4 mt-2">
                                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Clock className="w-5 h-5 text-gray-300" />
                                    </div>
                                    <p className="text-xs font-semibold text-gray-500">Chưa có phiên tập trung</p>
                                    <p className="text-[10px] text-gray-400">Bắt đầu học ngay!</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
