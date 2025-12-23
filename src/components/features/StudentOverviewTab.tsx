"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import {
    BookOpen, Clock, Zap, TrendingUp, CheckCircle2,
    Calendar, FileText, Users, Bell, Star,
    ChevronRight, Target, ArrowUpRight, Flame,
    MessageCircle, Hand, User as UserIcon, MoreHorizontal
} from 'lucide-react';
import { User, Assignment, Submission, Announcement } from '@/types';
import { cn } from "@/lib/utils";

interface StudentOverviewTabProps {
    classId: string;
    classData: any;
    currentUser: User;
    announcements: Announcement[];
    assignments: Assignment[];
    submissions: Submission[];
    students: any[];
    attendanceRate?: number;
}

export default function StudentOverviewTab({
    classId,
    classData,
    currentUser,
    announcements,
    assignments,
    submissions,
    students,
    attendanceRate = 100
}: StudentOverviewTabProps) {
    const [greeting, setGreeting] = useState('');
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        // eslint-disable-next-line
        setCurrentTime(Date.now());
    }, []);

    useEffect(() => {
        const hour = new Date().getHours();
        // eslint-disable-next-line
        if (hour < 12) setGreeting('Chào buổi sáng');
        else if (hour < 18) setGreeting('Chào buổi chiều');
        else setGreeting('Chào buổi tối');
    }, []);

    // --- Calculations ---
    const mySubmissions = submissions.filter(s => s.studentId === currentUser.id);
    const gradedSubmissions = mySubmissions.filter(s => s.status === 'graded');

    // Avg Score
    const averageScore = gradedSubmissions.length > 0
        ? Math.round(gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length * 10) / 10
        : null;

    // Completion Rate
    const totalAssignments = assignments.filter(a => a.status !== 'draft').length;
    const submittedCount = mySubmissions.length;
    const completionRate = totalAssignments > 0 ? Math.round((submittedCount / totalAssignments) * 100) : 0;

    // Next Up (Most urgent open assignment)
    const upcomingDeadlines = currentTime > 0
        ? assignments
            .filter(a => a.status === 'open' && new Date(a.dueDate).getTime() > currentTime)
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        : [];

    const nextUp = upcomingDeadlines[0];
    const otherDeadlines = upcomingDeadlines.slice(1, 4);

    // Recent announcements (pinned first)
    const recentAnnouncements = [...announcements]
        .sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .slice(0, 5);



    const isUrgent = (dueDate: string | Date) => {
        if (currentTime === 0) return false;
        return new Date(dueDate).getTime() - currentTime < 24 * 60 * 60 * 1000;
    };

    return (
        <div className="space-y-6 pb-10">
            {/* --- Clean Header Section --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {greeting}, {currentUser.name.split(' ').pop()}! <span className="text-2xl">👋</span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Chào mừng trở lại lớp học. Hôm nay bạn có một ngày tuyệt vời nhé!
                    </p>
                </div>

                {/* Compact Stats Row */}
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm text-center min-w-[100px]">
                        <div className="text-2xl font-bold text-emerald-600">{attendanceRate}%</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Chuyên cần</div>
                    </div>
                    <div className="w-px h-8 bg-gray-200 hidden md:block"></div>
                    <div className="px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm text-center min-w-[100px]">
                        <div className="text-2xl font-bold text-indigo-600">{completionRate}%</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Hoàn thành</div>
                    </div>
                    <div className="w-px h-8 bg-gray-200 hidden md:block"></div>
                    <div className="px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm text-center min-w-[100px]">
                        <div className="text-2xl font-bold text-violet-600">{averageScore ?? '--'}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Điểm TB</div>
                    </div>
                </div>
            </div>

            {/* --- Divider --- */}
            <hr className="border-gray-100" />


            <div className="grid lg:grid-cols-3 gap-8">
                {/* --- LEFT COL (FOCUS & SHORTCUTS) --- */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Next Up Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                                Tiếp theo
                            </h2>
                            <Link href={`/dashboard/classes/${classId}?tab=classwork`} className="text-sm text-indigo-600 font-medium hover:text-indigo-700 hover:underline">Xem tất cả</Link>
                        </div>

                        {nextUp ? (
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-lg relative overflow-hidden group transition-all"
                            >
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                                <div className="flex items-center justify-between mb-3">
                                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold uppercase tracking-wide border border-indigo-100">
                                        Ưu tiên
                                    </span>
                                    {isUrgent(nextUp.dueDate) && (
                                        <span className="flex items-center gap-1 text-rose-600 text-xs font-bold animate-pulse bg-rose-50 px-2 py-0.5 rounded-full">
                                            <Clock className="w-3 h-3" /> Gấp
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                                    {nextUp.title}
                                </h3>

                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 font-medium">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span>Hạn nộp: <span className="text-gray-700">{format(new Date(nextUp.dueDate), 'HH:mm dd/MM', { locale: vi })}</span></span>
                                </div>

                                <Link href={`/dashboard/assignments/${nextUp.id}`}>
                                    <button className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95">
                                        Làm bài ngay <ArrowUpRight className="w-4 h-4" />
                                    </button>
                                </Link>
                            </motion.div>
                        ) : (
                            <div className="bg-white rounded-3xl p-8 border border-dashed border-gray-200 text-center">
                                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600">
                                    <CheckCircle2 className="w-7 h-7" />
                                </div>
                                <h3 className="font-bold text-gray-900">Tuyệt vời!</h3>
                                <p className="text-sm text-gray-500 mt-1">Bạn đã hoàn thành hết bài tập.</p>
                            </div>
                        )}
                    </div>

                    {/* Quick Shortcuts */}
                    <div>
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Tương tác</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="p-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all flex flex-col items-center gap-2 text-center group border border-indigo-100/50 hover:border-indigo-200 active:scale-95">
                                <div className="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md transition-shadow">
                                    <Hand className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold">Giơ tay</span>
                            </button>
                            <button className="p-4 rounded-2xl bg-pink-50 hover:bg-pink-100 text-pink-700 transition-all flex flex-col items-center gap-2 text-center group border border-pink-100/50 hover:border-pink-200 active:scale-95">
                                <div className="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md transition-shadow">
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold">Hỏi GV</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COL (ACTIVITY FEED) --- */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-gray-400" />
                            Bảng tin lớp học
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {recentAnnouncements.map((announcement, index) => (
                            <motion.div
                                key={announcement.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={cn(
                                    "bg-white rounded-3xl p-6 border shadow-sm hover:shadow-md transition-all group",
                                    announcement.isPinned ? "border-amber-200 bg-amber-50/20" : "border-gray-100"
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm",
                                        announcement.isPinned ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-500"
                                    )}>
                                        {announcement.isPinned ? <Star className="w-5 h-5 fill-amber-600" /> : <UserIcon className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            <span className="text-sm font-bold text-gray-900">Giáo viên</span>
                                            <span className="text-xs text-gray-400">• {formatDistanceToNow(new Date(announcement.createdAt), { locale: vi, addSuffix: true })}</span>
                                            {announcement.isPinned && (
                                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase ml-auto sm:ml-0">Ghim</span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-2 text-base md:text-lg group-hover:text-indigo-700 transition-colors">{announcement.title}</h3>
                                        <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap break-words">
                                            {announcement.content}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {recentAnnouncements.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-3xl border border-gray-100 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm rotate-3">
                                    <Bell className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg">Chưa có thông báo</h3>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">
                                    Giáo viên chưa đăng thông báo nào cho lớp học này.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Class Info Footer */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-3xl border border-gray-100 p-5 flex flex-wrap items-center gap-x-8 gap-y-4 shadow-sm"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">{students.length} học sinh</p>
                        <p className="text-xs text-gray-500">Thành viên</p>
                    </div>
                </div>

                <div className="w-px h-10 bg-gray-100 hidden sm:block" />

                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">{assignments.length} bài tập</p>
                        <p className="text-xs text-gray-500">Đã giao</p>
                    </div>
                </div>

                <div className="w-px h-10 bg-gray-100 hidden sm:block" />

                <Link href={`/dashboard/classes/${classId}?tab=schedule`} className="flex items-center gap-3 group hover:bg-gray-50 pr-4 rounded-xl transition-colors cursor-pointer">
                    <div className="p-2 bg-violet-50 text-violet-600 rounded-xl group-hover:bg-violet-100 transition-colors">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900 group-hover:text-violet-700 transition-colors flex items-center gap-1">
                            Xem lịch học <ChevronRight className="w-3 h-3" />
                        </p>
                        <p className="text-xs text-gray-500">Thời khóa biểu</p>
                    </div>
                </Link>
            </motion.div>
        </div>
    );
}
