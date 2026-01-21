"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowLeft, User, Mail, Calendar, Trophy, TrendingUp, TrendingDown,
    BookOpen, CheckCircle2, XCircle, Clock, AlertTriangle, BarChart3
} from "lucide-react";
import { getStudentProfileDataAction } from "@/lib/actions";
import { formatScore } from "@/lib/score-utils";

interface StudentProfileData {
    student: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string;
        joinedAt: string;
    };
    submissions: {
        id: string;
        assignmentTitle: string;
        assignmentId: string;
        score: number | null;
        maxScore: number;
        status: string;
        submittedAt: string;
        isLate: boolean;
    }[];
    attendance: {
        total: number;
        present: number;
        late: number;
        absent: number;
        excused: number;
    };
    stats: {
        averageScore: number;
        submissionRate: number;
        onTimeRate: number;
        totalAssignments: number;
    };
}

export default function StudentProfilePage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.id as string;
    const studentId = params.studentId as string;

    const [data, setData] = useState<StudentProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const result = await getStudentProfileDataAction(classId, studentId);
                if (result.success && result.data) {
                    setData(result.data);
                } else {
                    setError(result.message || "Không thể tải thông tin học sinh");
                }
            } catch (e) {
                setError("Có lỗi xảy ra");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [classId, studentId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto animate-pulse">
                    <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
                    <div className="h-40 bg-gray-200 rounded-2xl mb-6"></div>
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Không thể tải dữ liệu</h2>
                    <p className="text-gray-500 mb-4">{error}</p>
                    <button onClick={() => router.back()} className="px-4 py-2 bg-primary text-white rounded-lg">
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    const { student, submissions, attendance, stats } = data;
    const attendanceRate = attendance.total > 0
        ? Math.round(((attendance.present + attendance.late) / attendance.total) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Hồ sơ học sinh</h1>
                </div>

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm"
                >
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                            {student.avatarUrl ? (
                                <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                                student.name.charAt(0)
                            )}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
                            <div className="flex items-center gap-4 mt-2 text-gray-500">
                                <span className="flex items-center gap-1.5">
                                    <Mail className="w-4 h-4" />
                                    {student.email}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    Tham gia: {new Date(student.joinedAt).toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        icon={<Trophy className="w-5 h-5 text-yellow-600" />}
                        label="Điểm TB"
                        value={formatScore(stats.averageScore)}
                        max="/10"
                        color="yellow"
                    />
                    <StatCard
                        icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
                        label="Tỷ lệ nộp bài"
                        value={`${stats.submissionRate}%`}
                        color="green"
                    />
                    <StatCard
                        icon={<Clock className="w-5 h-5 text-blue-600" />}
                        label="Nộp đúng hạn"
                        value={`${stats.onTimeRate}%`}
                        color="blue"
                    />
                    <StatCard
                        icon={<Calendar className="w-5 h-5 text-purple-600" />}
                        label="Điểm danh"
                        value={`${attendanceRate}%`}
                        color="purple"
                    />
                </div>

                {/* Attendance Breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm"
                >
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        Chi tiết điểm danh
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-xl">
                            <div className="text-2xl font-bold text-green-600">{attendance.present}</div>
                            <div className="text-sm text-gray-500">Có mặt</div>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-xl">
                            <div className="text-2xl font-bold text-yellow-600">{attendance.late}</div>
                            <div className="text-sm text-gray-500">Đi muộn</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-xl">
                            <div className="text-2xl font-bold text-red-600">{attendance.absent}</div>
                            <div className="text-sm text-gray-500">Vắng mặt</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-xl">
                            <div className="text-2xl font-bold text-blue-600">{attendance.excused}</div>
                            <div className="text-sm text-gray-500">Có phép</div>
                        </div>
                    </div>
                </motion.div>

                {/* Submissions List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
                >
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        Lịch sử bài nộp ({submissions.length})
                    </h3>

                    {submissions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Chưa có bài nộp nào
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {submissions.map((sub) => (
                                <div
                                    key={sub.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{sub.assignmentTitle}</div>
                                        <div className="text-sm text-gray-500 flex items-center gap-2">
                                            <span>{new Date(sub.submittedAt).toLocaleDateString('vi-VN')}</span>
                                            {sub.isLate && (
                                                <span className="text-red-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> Trễ hạn
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {sub.score !== null ? (
                                            <div className="text-lg font-bold text-gray-900">
                                                {formatScore(sub.score)}<span className="text-sm text-gray-500">/{sub.maxScore}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-yellow-600 bg-yellow-100 px-2 py-1 rounded-lg">
                                                Chưa chấm
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, max, color }: { icon: React.ReactNode; label: string; value: string; max?: string; color: string }) {
    const bgColors: Record<string, string> = {
        yellow: "bg-yellow-50",
        green: "bg-green-50",
        blue: "bg-blue-50",
        purple: "bg-purple-50"
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${bgColors[color]} rounded-xl p-4`}
        >
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className="text-sm font-medium text-gray-600">{label}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
                {value}
                {max && <span className="text-sm text-gray-500">{max}</span>}
            </div>
        </motion.div>
    );
}
