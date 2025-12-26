"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { LogOut, Plus, Target, Clock, BookOpen, ChevronRight, Calendar, User as UserIcon, Sparkles, AlertCircle } from "lucide-react";
import { logout } from "@/lib/auth-actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { User } from "@/types";

import { NotificationBell } from "@/components/features/NotificationBell";
import { JoinClassModal } from "@/components/features/JoinClassModal";
import { StudentAnalytics } from "@/lib/student-analytics";
import { motion } from 'framer-motion';
import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from "date-fns";
import { vi } from "date-fns/locale";

interface StudentDashboardProps {
    user: User;
    analytics: StudentAnalytics;
}

export function StudentDashboard({ user, analytics }: StudentDashboardProps) {
    const router = useRouter();
    const [isJoinClassModalOpen, setIsJoinClassModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="p-8 text-center text-gray-500">Đang tải Dashboard...</div>;
    }

    const pendingAssignments = Array.isArray(analytics.pendingAssignments) ? analytics.pendingAssignments : [];
    const hasClasses = (analytics as any).totalClasses > 0 || pendingAssignments.length > 0;
    const hasPendingWork = pendingAssignments.length > 0;
    const urgentAssignments = pendingAssignments.filter((a: any) => a.urgent) || [];
    const todayDate = format(new Date(), "EEEE, d 'tháng' M", { locale: vi });

    const formatDeadline = (dateStr: any) => {
        const date = new Date(dateStr);
        if (isToday(date)) return `Hôm nay ${format(date, 'HH:mm')}`;
        if (isTomorrow(date)) return `Ngày mai ${format(date, 'HH:mm')}`;
        if (isPast(date)) return 'Quá hạn';
        return format(date, 'dd/MM');
    };

    // If student has no classes, show onboarding
    if (!hasClasses) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md mx-auto p-8"
                >
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Chào mừng, {user.name}! 👋
                    </h1>
                    <p className="text-gray-500 mb-8">
                        Bạn chưa tham gia lớp học nào. Hãy nhập mã lớp từ giáo viên để bắt đầu hành trình học tập!
                    </p>
                    <button
                        onClick={() => setIsJoinClassModalOpen(true)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Tham gia lớp học
                    </button>

                    <JoinClassModal
                        isOpen={isJoinClassModalOpen}
                        onClose={() => setIsJoinClassModalOpen(false)}
                        onSuccess={() => {
                            setIsJoinClassModalOpen(false);
                            window.location.reload();
                        }}
                        userId={user.id}
                    />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header - Compact */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Xin chào, {user.name.split(' ').pop()}! 👋
                    </h1>
                    <p className="text-sm text-gray-500">{todayDate}</p>
                </div>
                <div className="flex items-center gap-3">
                    <NotificationBell userId={user.id} />
                    <button
                        onClick={handleLogout}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Đăng xuất"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Grid - Single Screen Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Priority Tasks */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Urgent Alert */}
                    {urgentAssignments.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl p-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-red-800">
                                        {urgentAssignments.length} nhiệm vụ cần hoàn thành gấp!
                                    </p>
                                    <p className="text-sm text-red-600">
                                        {urgentAssignments[0]?.title}
                                    </p>
                                </div>
                                <Link
                                    href={`/dashboard/assignments/${urgentAssignments[0]?.id}`}
                                    className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700"
                                >
                                    Làm ngay
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {/* Pending Assignments - Compact List */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Target className="w-4 h-4 text-indigo-600" />
                                Nhiệm vụ đang chờ
                            </h3>
                            <Link href="/dashboard/assignments" className="text-sm text-indigo-600 hover:underline">
                                Xem tất cả
                            </Link>
                        </div>

                        {hasPendingWork ? (
                            <div className="divide-y divide-gray-50">
                                {analytics.pendingAssignments.slice(0, 4).map((assignment, idx) => (
                                    <Link
                                        key={assignment.id}
                                        href={`/dashboard/assignments/${assignment.id}`}
                                        className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors group"
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${assignment.urgent ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'
                                            }`}>
                                            <BookOpen className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate group-hover:text-indigo-600">
                                                {assignment.title}
                                            </p>
                                            <p className="text-xs text-gray-500">{assignment.className}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-medium ${assignment.urgent ? 'text-red-600' : 'text-gray-500'
                                                }`}>
                                                {formatDeadline(assignment.dueDate)}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600" />
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="px-5 py-8 text-center">
                                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Sparkles className="w-6 h-6 text-green-600" />
                                </div>
                                <p className="font-medium text-gray-900">Tuyệt vời! 🎉</p>
                                <p className="text-sm text-gray-500">Bạn đã hoàn thành tất cả nhiệm vụ</p>
                            </div>
                        )}
                    </div>

                    {/* Quick Stats - Inline */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                            <p className="text-2xl font-bold text-indigo-600">{(analytics as any).totalClasses || 0}</p>
                            <p className="text-xs text-gray-500">Lớp học</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                            <p className="text-2xl font-bold text-green-600">{analytics.mySubmissionRate}%</p>
                            <p className="text-xs text-gray-500">Tỉ lệ nộp</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                            <p className="text-2xl font-bold text-amber-600">{analytics.pendingAssignments?.length || 0}</p>
                            <p className="text-xs text-gray-500">Đang chờ</p>
                        </div>
                    </div>
                </div>

                {/* Right: Quick Actions */}
                <div className="space-y-4">
                    {/* Quick Actions Card */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 mb-4">Truy cập nhanh</h3>
                        <div className="space-y-2">
                            <Link
                                href="/dashboard/classes"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-50 transition-colors group"
                            >
                                <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <BookOpen className="w-4 h-4 text-indigo-600" />
                                </div>
                                <span className="font-medium text-gray-700 group-hover:text-indigo-600">Lớp học của tôi</span>
                            </Link>

                            <Link
                                href="/dashboard/schedule"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors group"
                            >
                                <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-4 h-4 text-emerald-600" />
                                </div>
                                <span className="font-medium text-gray-700 group-hover:text-emerald-600">Thời khóa biểu</span>
                            </Link>

                            <Link
                                href="/dashboard/assignments"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors group"
                            >
                                <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <BookOpen className="w-4 h-4 text-purple-600" />
                                </div>
                                <span className="font-medium text-gray-700 group-hover:text-purple-600">Bài tập của tôi</span>
                            </Link>

                            <button
                                onClick={() => setIsJoinClassModalOpen(true)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-amber-50 transition-colors group"
                            >
                                <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <Plus className="w-4 h-4 text-amber-600" />
                                </div>
                                <span className="font-medium text-gray-700 group-hover:text-amber-600">Tham gia lớp mới</span>
                            </button>
                        </div>
                    </div>

                    {/* My Classes Quick View */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900">Lớp của tôi</h3>
                            <Link href="/dashboard/classes" className="text-xs text-indigo-600 hover:underline">
                                Xem tất cả
                            </Link>
                        </div>
                        <div className="text-center py-4 text-gray-500 text-sm">
                            {(analytics as any).totalClasses || 0} lớp học
                        </div>
                    </div>
                </div>
            </div>

            <JoinClassModal
                isOpen={isJoinClassModalOpen}
                onClose={() => setIsJoinClassModalOpen(false)}
                onSuccess={() => {
                    setIsJoinClassModalOpen(false);
                    window.location.reload();
                }}
                userId={user.id}
            />
        </div>
    );
}
