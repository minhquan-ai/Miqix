"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, TrendingUp, TrendingDown, AlertTriangle,
    CheckCircle2, ChevronRight, Send, RefreshCw,
    BookOpen, Users, LightbulbIcon, MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIInsightsWidgetProps {
    classData: any;
    students: any[];
    assignments: any[];
    submissions: any[];
}

// Mocked AI insights data
const getMockInsights = (students: any[], assignments: any[], submissions: any[]) => {
    const totalStudents = students.length;
    const submittedCount = submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length;
    const gradedSubmissions = submissions.filter(s => s.status === 'graded');

    // Generate dynamic mock insights based on actual data
    const insights = {
        pulse: totalStudents > 0
            ? `Lớp học đang hoạt động tích cực. ${submittedCount} bài nộp trong tuần qua từ ${totalStudents} học sinh.`
            : 'Chưa có dữ liệu để phân tích.',

        atRiskStudents: [
            { name: 'Nguyễn Văn A', reason: 'Nộp bài muộn 3 lần liên tiếp', trend: 'down' },
            { name: 'Trần Thị B', reason: 'Điểm giảm 20% trong 2 tuần qua', trend: 'down' },
        ],

        improvingStudents: [
            { name: 'Lê Văn C', reason: 'Điểm tăng 15% so với tháng trước', trend: 'up' },
        ],

        suggestedActions: [
            { id: '1', label: 'Gửi nhắc nhở đến học sinh chậm nộp bài', type: 'remind' },
            { id: '2', label: 'Tạo bài quiz ôn tập cho phần học sinh hay sai', type: 'quiz' },
            { id: '3', label: 'Khen thưởng học sinh tiến bộ', type: 'praise' },
        ]
    };

    return insights;
};

export default function AIInsightsWidget({
    classData,
    students,
    assignments,
    submissions
}: AIInsightsWidgetProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const insights = getMockInsights(students, assignments, submissions);

    const handleRefresh = () => {
        setIsGenerating(true);
        // Simulate AI thinking
        setTimeout(() => {
            setIsGenerating(false);
        }, 1500);
    };

    const handleAction = (actionId: string) => {
        // Mock action - in real app, this would trigger actual functionality
        alert(`Thực hiện hành động: ${insights.suggestedActions.find(a => a.id === actionId)?.label}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20"
        >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-8 -mb-8" />

            <div className="relative p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Trợ lý AI</h3>
                            <p className="text-[10px] text-purple-200">Phân tích thông minh</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className={cn(
                            "p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors",
                            isGenerating && "animate-spin"
                        )}
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {/* Daily Pulse */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <LightbulbIcon className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                        <p className="text-sm leading-relaxed">
                            {isGenerating ? (
                                <span className="animate-pulse">Đang phân tích dữ liệu lớp học...</span>
                            ) : (
                                insights.pulse
                            )}
                        </p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-amber-300" />
                            <span className="text-xs font-medium text-amber-200">Cần chú ý</span>
                        </div>
                        <div className="text-2xl font-bold">{insights.atRiskStudents.length}</div>
                        <div className="text-[10px] text-purple-200">học sinh</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-emerald-300" />
                            <span className="text-xs font-medium text-emerald-200">Tiến bộ</span>
                        </div>
                        <div className="text-2xl font-bold">{insights.improvingStudents.length}</div>
                        <div className="text-[10px] text-purple-200">học sinh</div>
                    </div>
                </div>

                {/* Expandable Details */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            {/* At Risk Students */}
                            {insights.atRiskStudents.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider mb-2">Học sinh cần chú ý</h4>
                                    <div className="space-y-2">
                                        {insights.atRiskStudents.map((student, idx) => (
                                            <div key={idx} className="bg-white/10 rounded-lg p-3 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-amber-500/30 flex items-center justify-center text-xs font-bold">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate">{student.name}</div>
                                                    <div className="text-[10px] text-purple-200 truncate">{student.reason}</div>
                                                </div>
                                                <TrendingDown className="w-4 h-4 text-red-300" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Suggested Actions */}
                            <div>
                                <h4 className="text-xs font-bold text-purple-200 uppercase tracking-wider mb-2">Hành động đề xuất</h4>
                                <div className="space-y-2">
                                    {insights.suggestedActions.map((action) => (
                                        <button
                                            key={action.id}
                                            onClick={() => handleAction(action.id)}
                                            className="w-full bg-white/10 hover:bg-white/20 rounded-lg p-3 flex items-center justify-between text-left transition-colors group"
                                        >
                                            <span className="text-sm">{action.label}</span>
                                            <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Expand/Collapse Toggle */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full mt-3 py-2 text-xs font-medium text-purple-200 hover:text-white transition-colors flex items-center justify-center gap-1"
                >
                    {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                    <ChevronRight className={cn("w-3 h-3 transition-transform", isExpanded && "rotate-90")} />
                </button>
            </div>
        </motion.div>
    );
}
