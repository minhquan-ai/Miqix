'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    PlusCircle,
    BookOpen,
    Activity,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Users,
    Search,
    Filter,
    MoreVertical
} from 'lucide-react';
import { useRouter } from "next/navigation";
import { getTeacherDashboardAnalyticsAction } from "@/lib/analytics-actions";
import { ClassAnalytics } from '@/lib/class-analytics';

export default function TeacherMissions() {
    const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const data = await getTeacherDashboardAnalyticsAction();
            setAnalytics(data);
            setLoading(false);
        };
        loadData();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500 italic">Đang tải dữ liệu nghiệp vụ...</div>;

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Nhiệm vụ</h1>
                    <p className="text-gray-500">Theo dõi tiến độ chấm bài và quản lý lớp học hiệu quả.</p>
                </div>
                <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm">
                    <PlusCircle className="w-5 h-5" />
                    Tạo nhiệm vụ mới
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Chưa chấm"
                    value={analytics?.ungradedCount || 0}
                    icon={Clock}
                    color="text-amber-600"
                    bgColor="bg-amber-50"
                />
                <StatCard
                    label="Bản nháp"
                    value={analytics?.draftCount || 0}
                    icon={BookOpen}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                />
                <StatCard
                    label="Học sinh nguy cơ"
                    value={analytics?.atRiskStudents?.length || 0}
                    icon={AlertTriangle}
                    color="text-red-600"
                    bgColor="bg-red-50"
                />
                <StatCard
                    label="Tiến độ nộp bài"
                    value={`${analytics?.submissionRate || 0}%`}
                    icon={Activity}
                    color="text-green-600"
                    bgColor="bg-green-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Mission List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <LayoutDashboard className="w-5 h-5 text-indigo-600" />
                            Đang thực hiện
                        </h2>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm nhiệm vụ..."
                                    className="pl-9 pr-4 py-1.5 text-sm border border-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-48"
                                />
                            </div>
                            <button className="p-2 border border-gray-100 rounded-lg hover:bg-gray-50">
                                <Filter className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {analytics?.upcomingDeadlines.map((mission, idx) => (
                            <MissionRow key={mission.assignmentId} mission={mission} />
                        ))}
                        {(!analytics?.upcomingDeadlines || analytics.upcomingDeadlines.length === 0) && (
                            <div className="p-8 text-center bg-gray-50 border border-dashed rounded-2xl text-gray-400 italic">
                                Không có nhiệm vụ nào đang diễn ra.
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar: Notifications & At-Risk */}
                <div className="space-y-6">
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                Cần lưu ý
                            </h3>
                            <button className="text-xs text-indigo-600 font-bold hover:underline">Xem tất cả</button>
                        </div>
                        <div className="p-4 space-y-4">
                            {analytics?.atRiskStudents?.map(student => (
                                <div key={student.id} className="flex items-start gap-3">
                                    <img src={student.avatarUrl} alt={student.name} className="w-8 h-8 rounded-full bg-gray-100" />
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-gray-900">{student.name}</div>
                                        <div className="text-xs text-red-500">{student.reasons[0]}</div>
                                    </div>
                                    <button className="p-1 hover:bg-gray-100 rounded">
                                        <MoreVertical className="w-3 h-3 text-gray-400" />
                                    </button>
                                </div>
                            ))}
                            {(!analytics?.atRiskStudents || analytics.atRiskStudents.length === 0) && (
                                <p className="text-xs text-gray-400 italic text-center py-2">Mọi thứ vẫn đang ổn.</p>
                            )}
                        </div>
                    </section>

                    <section className="bg-indigo-900 text-white rounded-2xl p-6 relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="font-bold mb-2">Lời khuyên nghiệp vụ</h3>
                            <p className="text-sm text-indigo-100 opacity-90">
                                Tỉ lệ nộp bài đang ở mức cao (94%). Hãy dành thời gian chấm bài Chương 1 để phản hồi kịp thời cho học sinh.
                            </p>
                            <button className="mt-4 text-xs font-bold px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                                Xem chi tiết báo cáo
                            </button>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform cursor-default" />
                    </section>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, bgColor }: any) {
    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${bgColor} ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</div>
                <div className="text-xl font-bold text-gray-900">{value}</div>
            </div>
        </div>
    );
}

function MissionRow({ mission }: { mission: any }) {
    const progress = Math.round((mission.submissionCount / mission.totalStudents) * 100);

    return (
        <div className="p-4 bg-white border border-gray-100 rounded-2xl hover:border-indigo-200 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-green-50 text-green-600 font-bold border border-green-100">Đang nhận bài</span>
                    <h3 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{mission.title}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Lớp 1+
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Còn {mission.daysUntilDue} ngày
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex flex-col items-end gap-1">
                    <div className="flex justify-between w-32 items-center text-[10px] font-bold">
                        <span className="text-gray-400">Tỉ lệ nộp: {progress}%</span>
                        <span className="text-gray-900">{mission.submissionCount}/{mission.totalStudents}</span>
                    </div>
                    <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                </div>
                <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-indigo-600">
                    <CheckCircle2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
