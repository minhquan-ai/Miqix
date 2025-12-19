"use client";

import React, { useEffect, useState } from 'react';
import { MissionsHero } from '@/features/missions/components/MissionsHero';
import { Sparkles, Users, Clock, Plus, BookOpen, FileText, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAssignmentsAction, getClassesAction, getSubmissionsByAssignmentIdAction, getCurrentUserAction } from '@/lib/actions';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MissionData {
    id: string;
    title: string;
    subject: string;
    type: string;
    dueDate: string;
    status: 'draft' | 'open' | 'closed';
    classIds: string[];
    classNames: string[];
    submissions: number;
    totalStudents: number;
    createdAt?: string;
}

// Subject color mapping
const subjectColors: Record<string, { bg: string; text: string }> = {
    'Toán': { bg: 'bg-blue-50', text: 'text-blue-600' },
    'Ngữ văn': { bg: 'bg-purple-50', text: 'text-purple-600' },
    'Vật lý': { bg: 'bg-orange-50', text: 'text-orange-600' },
    'Hóa học': { bg: 'bg-green-50', text: 'text-green-600' },
    'Sinh học': { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    'Tiếng Anh': { bg: 'bg-red-50', text: 'text-red-600' },
    'Lịch sử': { bg: 'bg-amber-50', text: 'text-amber-600' },
    'Địa lý': { bg: 'bg-cyan-50', text: 'text-cyan-600' },
    'default': { bg: 'bg-indigo-50', text: 'text-indigo-600' }
};

export default function TeacherMissionsPage() {
    const router = useRouter();
    const [missions, setMissions] = useState<MissionData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadMissions() {
            try {
                const user = await getCurrentUserAction();
                if (!user || user.role !== 'teacher') {
                    router.push('/login');
                    return;
                }

                // Get all assignments and classes
                const [assignments, classes] = await Promise.all([
                    getAssignmentsAction(),
                    getClassesAction()
                ]);

                // Build class lookup map
                const classMap = new Map(classes.map(c => [c.id, c]));

                // Get submissions for each assignment
                const missionsData: MissionData[] = await Promise.all(
                    assignments.map(async (assignment) => {
                        const submissions = await getSubmissionsByAssignmentIdAction(assignment.id);
                        const classNames = assignment.classIds
                            .map(id => classMap.get(id)?.name || 'Lớp không xác định')
                            .filter(Boolean);

                        // Calculate total students from classes
                        const totalStudents = assignment.classIds.reduce((sum, id) => {
                            const cls = classMap.get(id);
                            return sum + (cls?.studentCount || 0);
                        }, 0);

                        return {
                            id: assignment.id,
                            title: assignment.title,
                            subject: assignment.subject || 'Tổng hợp',
                            type: assignment.type,
                            dueDate: assignment.dueDate,
                            status: assignment.status,
                            classIds: assignment.classIds,
                            classNames,
                            submissions: submissions.length,
                            totalStudents: totalStudents || 30 // fallback
                        };
                    })
                );

                setMissions(missionsData);
            } catch (error) {
                console.error('Failed to load missions:', error);
            } finally {
                setLoading(false);
            }
        }

        loadMissions();
    }, [router]);

    const activeMissions = missions.filter(m => m.status === 'open');
    const draftMissions = missions.filter(m => m.status === 'draft');
    const closedMissions = missions.filter(m => m.status === 'closed');

    const getSubjectColor = (subject: string) => {
        return subjectColors[subject] || subjectColors.default;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return <span className="w-2 h-2 rounded-full bg-green-500" />;
            case 'draft':
                return <span className="w-2 h-2 rounded-full bg-gray-400" />;
            case 'closed':
                return <span className="w-2 h-2 rounded-full bg-blue-500" />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white -m-8 p-6">
            <div className="max-w-full mx-auto space-y-6">
                <MissionsHero
                    title="Quản lý Nhiệm vụ"
                    subtitle="Tạo, theo dõi và quản lý các nhiệm vụ học tập thông minh cho học sinh của bạn."
                    actionLabel="Tạo nhiệm vụ bằng AI"
                    onAction={() => router.push('/dashboard/assignments?create=true')}
                    icon={<Sparkles size={24} />}
                />

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Nhiệm vụ đã giao</h2>
                        <p className="text-sm text-gray-500 mt-1">Theo dõi tiến độ hoàn thành của các lớp.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-white border rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm text-sm font-medium">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            {activeMissions.length} Đang mở
                        </div>
                        {draftMissions.length > 0 && (
                            <div className="bg-white border rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm text-sm font-medium">
                                <span className="w-2 h-2 rounded-full bg-gray-400" />
                                {draftMissions.length} Bản nháp
                            </div>
                        )}
                        {closedMissions.length > 0 && (
                            <div className="bg-white border rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm text-sm font-medium">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                {closedMissions.length} Đã đóng
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 animate-pulse">
                                <div className="h-6 bg-gray-100 rounded w-1/3 mb-4" />
                                <div className="h-8 bg-gray-100 rounded w-3/4 mb-4" />
                                <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                                <div className="h-2 bg-gray-100 rounded w-full" />
                            </div>
                        ))}
                    </div>
                ) : missions.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có nhiệm vụ nào</h3>
                        <p className="text-gray-500 mb-6">Tạo bài tập đầu tiên để bắt đầu giao nhiệm vụ cho học sinh.</p>
                        <Link
                            href="/dashboard/assignments?create=true"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Tạo bài tập mới
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {missions.map((mission) => {
                            const subjectColor = getSubjectColor(mission.subject);
                            const progress = mission.totalStudents > 0
                                ? (mission.submissions / mission.totalStudents) * 100
                                : 0;
                            const isPastDue = new Date(mission.dueDate) < new Date();

                            return (
                                <motion.div
                                    key={mission.id}
                                    whileHover={{ y: -5 }}
                                    className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all h-full flex flex-col group relative overflow-hidden cursor-pointer"
                                    onClick={() => router.push(`/dashboard/assignments/${mission.id}`)}
                                >
                                    {/* Hover Accent */}
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />

                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`px-3 py-1 ${subjectColor.bg} ${subjectColor.text} rounded-lg text-xs font-bold`}>
                                            {mission.subject}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                                            {getStatusBadge(mission.status)}
                                            <Users size={14} />
                                            {mission.classNames.slice(0, 2).join(', ')}
                                            {mission.classNames.length > 2 && ` +${mission.classNames.length - 2}`}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                        {mission.title}
                                    </h3>

                                    {/* Progress */}
                                    <div className="space-y-3 mb-6 flex-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400 font-medium">Báo cáo nộp bài</span>
                                            <span className="text-gray-800 font-bold">
                                                {mission.submissions}/{mission.totalStudents}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: 0.5, delay: 0.2 }}
                                                className={`h-full rounded-full ${progress >= 80 ? 'bg-green-500' :
                                                        progress >= 50 ? 'bg-indigo-600' :
                                                            'bg-orange-500'
                                                    }`}
                                            />
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <div className={`flex items-center gap-1.5 text-xs ${isPastDue ? 'text-red-500' : 'text-gray-400'}`}>
                                            <Clock size={14} />
                                            {isPastDue ? 'Đã hết hạn' : formatDistanceToNow(new Date(mission.dueDate), {
                                                addSuffix: true,
                                                locale: vi
                                            })}
                                        </div>
                                        <span className="text-sm font-bold text-indigo-600 group-hover:text-indigo-700 transition-colors">
                                            Chi tiết →
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* New Mission Placeholder */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-400 transition-all bg-gray-50/50 cursor-pointer"
                            onClick={() => router.push('/dashboard/assignments?create=true')}
                        >
                            <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center mb-3 shadow-sm">
                                <Plus className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-sm">Giao nhiệm vụ mới</span>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}
