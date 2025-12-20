"use client";

import React, { useEffect, useState } from 'react';
import { MissionsHero } from '@/features/missions/components/MissionsHero';
import { Target, Clock, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCurrentUserAction, getClassesAction, getAssignmentsAction, getStudentSubmissionAction } from '@/lib/actions';
import { formatDistanceToNow, isPast, isToday, isTomorrow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AIPageWrapper } from "@/components/layout/AIPageWrapper";
import { MissionAI } from "@/components/features/ai/MissionAI";

interface StudentMission {
    id: string;
    title: string;
    subject: string;
    dueDate: string;
    status: 'urgent' | 'pending' | 'completed';
    classId: string;
    className: string;
    hasSubmitted: boolean;
}

// Subject color mapping
const subjectColors: Record<string, { bg: string; text: string; icon: string }> = {
    'Toán': { bg: 'bg-blue-50', text: 'text-blue-600', icon: '📐' },
    'Ngữ văn': { bg: 'bg-purple-50', text: 'text-purple-600', icon: '📚' },
    'Vật lý': { bg: 'bg-orange-50', text: 'text-orange-600', icon: '⚛️' },
    'Hóa học': { bg: 'bg-green-50', text: 'text-green-600', icon: '🧪' },
    'Sinh học': { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: '🌱' },
    'Tiếng Anh': { bg: 'bg-red-50', text: 'text-red-600', icon: '🌍' },
    'Lịch sử': { bg: 'bg-amber-50', text: 'text-amber-600', icon: '📜' },
    'Địa lý': { bg: 'bg-cyan-50', text: 'text-cyan-600', icon: '🗺️' },
    'default': { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: '📝' }
};

export default function MissionsPage() {
    const router = useRouter();
    const [missions, setMissions] = useState<StudentMission[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        async function loadMissions() {
            try {
                const user = await getCurrentUserAction();
                if (!user) {
                    router.push('/login');
                    return;
                }
                setUserId(user.id);

                // Get classes the student is enrolled in
                const classes = await getClassesAction();

                if (classes.length === 0) {
                    // No classes = no missions
                    setMissions([]);
                    setLoading(false);
                    return;
                }

                // Build class lookup
                const classMap = new Map(classes.map(c => [c.id, c]));
                const classIds = classes.map(c => c.id);

                // Get all assignments
                const allAssignments = await getAssignmentsAction();

                // Filter assignments that belong to student's classes
                const studentAssignments = allAssignments.filter(a =>
                    a.classIds.some(id => classIds.includes(id)) && a.status === 'open'
                );

                // Check submission status for each assignment
                const missionsData: StudentMission[] = await Promise.all(
                    studentAssignments.map(async (assignment) => {
                        const submission = await getStudentSubmissionAction(assignment.id, user.id);
                        const dueDate = new Date(assignment.dueDate);
                        const hasSubmitted = !!submission;

                        // Determine status
                        let status: 'urgent' | 'pending' | 'completed' = 'pending';
                        if (hasSubmitted && submission?.status === 'graded') {
                            status = 'completed';
                        } else if (hasSubmitted) {
                            status = 'completed'; // submitted = done from student's perspective
                        } else if (isPast(dueDate) || isToday(dueDate)) {
                            status = 'urgent';
                        }

                        // Find which class this assignment belongs to
                        const matchingClassId = assignment.classIds.find(id => classIds.includes(id)) || '';
                        const matchingClass = classMap.get(matchingClassId);

                        return {
                            id: assignment.id,
                            title: assignment.title,
                            subject: assignment.subject || 'Tổng hợp',
                            dueDate: assignment.dueDate,
                            status,
                            classId: matchingClassId,
                            className: matchingClass?.name || 'Lớp học',
                            hasSubmitted
                        };
                    })
                );

                // Sort: urgent first, then by due date
                missionsData.sort((a, b) => {
                    if (a.status === 'urgent' && b.status !== 'urgent') return -1;
                    if (a.status !== 'urgent' && b.status === 'urgent') return 1;
                    if (a.status === 'completed' && b.status !== 'completed') return 1;
                    if (a.status !== 'completed' && b.status === 'completed') return -1;
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                });

                setMissions(missionsData);
            } catch (error) {
                console.error('Failed to load missions:', error);
            } finally {
                setLoading(false);
            }
        }

        loadMissions();
    }, [router]);

    const getSubjectStyle = (subject: string) => {
        return subjectColors[subject] || subjectColors.default;
    };

    const formatDueDate = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isToday(date)) {
            return `Hôm nay, ${format(date, 'HH:mm')}`;
        }
        if (isTomorrow(date)) {
            return `Ngày mai, ${format(date, 'HH:mm')}`;
        }
        if (isPast(date)) {
            return 'Đã hết hạn';
        }
        return format(date, 'dd/MM/yyyy');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'urgent':
                return (
                    <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> GẤP
                    </span>
                );
            case 'completed':
                return (
                    <span className="px-2 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> HOÀN THÀNH
                    </span>
                );
            default:
                return (
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg">
                        ĐANG CHỜ
                    </span>
                );
        }
    };

    const urgentCount = missions.filter(m => m.status === 'urgent').length;
    const pendingCount = missions.filter(m => m.status === 'pending').length;
    const completedCount = missions.filter(m => m.status === 'completed').length;

    return (
        <AIPageWrapper
            renderAI={({ onClose }) => <MissionAI onClose={onClose} userId={userId} missions={missions} />}
        >
            <div className="flex-1 flex flex-col overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                <div className="space-y-6 p-1">
                    <MissionsHero
                        title="Nhiệm vụ của tôi"
                        subtitle="Quản lý, theo dõi và hoàn thành các nhiệm vụ học tập của bạn để nâng cao kết quả học tập."
                        icon={<Target size={24} />}
                    />

                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Danh sách nhiệm vụ</h2>
                        <div className="flex gap-2">
                            {urgentCount > 0 && (
                                <span className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-lg">
                                    {urgentCount} Cần làm gấp
                                </span>
                            )}
                            <span className="text-sm font-medium text-gray-500 bg-white border border-gray-100 px-3 py-1 rounded-lg">
                                Tổng số: {missions.length}
                            </span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 animate-pulse">
                                    <div className="h-6 bg-gray-100 rounded w-1/3 mb-4" />
                                    <div className="h-8 bg-gray-100 rounded w-3/4 mb-4" />
                                    <div className="h-4 bg-gray-100 rounded w-full" />
                                </div>
                            ))}
                        </div>
                    ) : missions.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có nhiệm vụ nào</h3>
                            <p className="text-gray-500 mb-6">Tham gia lớp học để nhận nhiệm vụ từ giáo viên.</p>
                            <Link
                                href="/dashboard/classes"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                            >
                                Tham gia lớp học
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {missions.map((mission, index) => {
                                const subjectStyle = getSubjectStyle(mission.subject);

                                return (
                                    <motion.div
                                        key={mission.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ y: -5 }}
                                        className={`bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden ${mission.status === 'urgent' ? 'border-red-200' :
                                            mission.status === 'completed' ? 'border-green-200' :
                                                'border-gray-100'
                                            }`}
                                        onClick={() => router.push(`/dashboard/assignments/${mission.id}`)}
                                    >
                                        {/* Accent line */}
                                        <div className={`absolute top-0 left-0 w-1 h-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ${mission.status === 'urgent' ? 'bg-red-500' :
                                            mission.status === 'completed' ? 'bg-green-500' :
                                                'bg-blue-600'
                                            }`} />

                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-12 h-12 rounded-xl ${subjectStyle.bg} flex items-center justify-center text-2xl`}>
                                                {subjectStyle.icon || '📝'}
                                            </div>
                                            {getStatusBadge(mission.status)}
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                            {mission.title}
                                        </h3>

                                        {/* Subject & Class */}
                                        <p className="text-sm text-gray-500 mb-4">
                                            {mission.subject} - {mission.className}
                                        </p>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                            <div className={`flex items-center gap-1.5 text-sm ${mission.status === 'urgent' ? 'text-red-600' :
                                                mission.status === 'completed' ? 'text-green-600' :
                                                    'text-gray-500'
                                                }`}>
                                                <Clock className="w-4 h-4" />
                                                {mission.status === 'completed' ? 'Đã hoàn thành' : formatDueDate(mission.dueDate)}
                                            </div>
                                            <span className="text-sm font-bold text-indigo-600 group-hover:text-indigo-700">
                                                {mission.status === 'completed' ? 'Xem kết quả →' : 'Bắt đầu ngay →'}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AIPageWrapper>
    );
}
