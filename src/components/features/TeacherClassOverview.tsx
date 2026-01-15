"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import {
    Calendar, Users, BookOpen, CheckCircle2,
    Plus, MessageCircle, Clock, ChevronRight, FileText, UserPlus
} from 'lucide-react';
import { User, Assignment, Submission, Announcement } from '@/types';

interface TeacherClassOverviewProps {
    classId: string;
    classData: any;
    currentUser: User;
    announcements: Announcement[];
    assignments: Assignment[];
    submissions: Submission[];
    students: any[];
    pendingStudents?: any[];
    attendanceRate?: number;
    onCreateAssignment: () => void;
    onPostAnnouncement: () => void;
}

export default function TeacherClassOverview({
    classId,
    classData,
    currentUser,
    announcements,
    assignments,
    submissions,
    students,
    pendingStudents = [],
    attendanceRate = 100,
    onCreateAssignment,
    onPostAnnouncement
}: TeacherClassOverviewProps) {
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (hour < 12) setGreeting('Chào buổi sáng');
        else if (hour < 18) setGreeting('Chào buổi chiều');
        else setGreeting('Chào buổi tối');
    }, []);

    // --- Calculations ---
    const pendingGradingSubmissions = submissions.filter(s => s.status === 'submitted');
    const gradedSubmissions = submissions.filter(s => s.status === 'graded');
    const openAssignments = assignments.filter(a => a.status === 'open');

    // Upcoming assignments (next 7 days)
    const upcomingAssignments = assignments
        .filter(a => a.status === 'open' && new Date(a.dueDate) > new Date())
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 3);

    // Recent announcements
    const recentAnnouncements = announcements.slice(0, 3);

    return (
        <div className="space-y-6 pb-10">
            {/* --- Clean Greeting --- */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                <div>
                    <p className="text-sm text-gray-500 mb-1">
                        {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: vi })}
                    </p>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {greeting}, Thầy/Cô {currentUser.name.split(' ').pop()}! 👋
                    </h1>
                </div>
            </div>

            {/* --- Stats Grid --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                            <p className="text-xs text-gray-500">Học sinh</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{openAssignments.length}</p>
                            <p className="text-xs text-gray-500">Bài tập mở</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{pendingGradingSubmissions.length}</p>
                            <p className="text-xs text-gray-500">Chờ chấm</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{attendanceRate}%</p>
                            <p className="text-xs text-gray-500">Chuyên cần</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Main Content Grid --- */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Quick Actions - Simplified */}
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">
                            Tác vụ nhanh
                        </h3>
                        <div className="flex gap-3">
                            <button
                                onClick={onCreateAssignment}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Tạo bài tập
                            </button>
                            <button
                                onClick={onPostAnnouncement}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Đăng thông báo
                            </button>
                        </div>
                    </div>

                    {/* Upcoming Deadlines */}
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                Bài tập sắp đến hạn
                            </h3>
                            <Link
                                href={`/dashboard/classes/${classId}?tab=classwork`}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                Xem tất cả
                            </Link>
                        </div>

                        {upcomingAssignments.length > 0 ? (
                            <div className="space-y-3">
                                {upcomingAssignments.map(assignment => (
                                    <Link
                                        key={assignment.id}
                                        href={`/dashboard/assignments/${assignment.id}`}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate group-hover:text-blue-600">
                                                {assignment.title}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Hạn: {format(new Date(assignment.dueDate), 'dd/MM - HH:mm')}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Không có bài tập sắp đến hạn</p>
                                <button
                                    onClick={onCreateAssignment}
                                    className="mt-3 text-sm text-blue-600 hover:underline"
                                >
                                    + Tạo bài tập mới
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Pending Enrollments Widget */}
                    {pendingStudents.length > 0 && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100 animate-pulse-slow">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                        <UserPlus className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">
                                            {pendingStudents.length} yêu cầu tham gia
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Học sinh mới đang chờ duyệt
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href={`/dashboard/classes/${classId}?tab=people`}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Duyệt ngay
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Recent Announcements */}
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                Thông báo gần đây
                            </h3>
                            <Link
                                href={`/dashboard/classes/${classId}?tab=stream`}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                Xem bảng tin
                            </Link>
                        </div>

                        {recentAnnouncements.length > 0 ? (
                            <div className="space-y-3">
                                {recentAnnouncements.map(announcement => (
                                    <div
                                        key={announcement.id}
                                        className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                                    >
                                        <p className="text-sm text-gray-900 line-clamp-2">
                                            {announcement.content}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {format(new Date(announcement.createdAt), 'dd/MM/yyyy - HH:mm')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Chưa có thông báo nào</p>
                                <button
                                    onClick={onPostAnnouncement}
                                    className="mt-3 text-sm text-blue-600 hover:underline"
                                >
                                    + Đăng thông báo đầu tiên
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Pending Grading */}
                    {pendingGradingSubmissions.length > 0 && (
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">
                                            {pendingGradingSubmissions.length} bài chờ chấm
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Bài nộp mới cần được xem xét
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href={`/dashboard/grading`}
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Chấm điểm
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
