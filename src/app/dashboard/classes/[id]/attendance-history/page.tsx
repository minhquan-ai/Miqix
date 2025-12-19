"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Users, CheckCircle, XCircle, Clock, TrendingUp, Download } from "lucide-react";
import { motion } from "framer-motion";
import { getAttendanceHistoryAction, getClassByIdAction } from "@/lib/actions";

interface SessionSummary {
    id: string;
    date: string;
    lessonContent: string | null;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    totalStudents: number;
}

interface StudentStats {
    studentId: string;
    studentName: string;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendanceRate: number;
}

export default function AttendanceHistoryPage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [className, setClassName] = useState("");
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [studentStats, setStudentStats] = useState<StudentStats[]>([]);
    const [activeTab, setActiveTab] = useState<"sessions" | "students">("sessions");

    useEffect(() => {
        loadData();
    }, [classId]);

    const loadData = async () => {
        setLoading(true);

        // Load class info
        const classInfo = await getClassByIdAction(classId);
        if (classInfo) {
            setClassName(classInfo.name);
        }

        // Load attendance history
        const result = await getAttendanceHistoryAction(classId);
        if (result.success && result.data) {
            setSessions(result.data.sessions);
            setStudentStats(result.data.studentStats);
        }

        setLoading(false);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };

    const getAttendanceColor = (rate: number) => {
        if (rate >= 90) return "text-green-600 bg-green-50";
        if (rate >= 70) return "text-yellow-600 bg-yellow-50";
        return "text-red-600 bg-red-50";
    };

    // Calculate overall stats
    const totalSessions = sessions.length;
    const avgAttendance = studentStats.length > 0
        ? Math.round(studentStats.reduce((sum, s) => sum + s.attendanceRate, 0) / studentStats.length)
        : 0;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Lịch sử điểm danh</h1>
                        <p className="text-sm text-gray-500">{className}</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                </div>
            ) : (
                <div className="max-w-5xl mx-auto px-4 py-6">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
                                    <p className="text-sm text-gray-500">Buổi học</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{avgAttendance}%</p>
                                    <p className="text-sm text-gray-500">Tỷ lệ có mặt TB</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{studentStats.length}</p>
                                    <p className="text-sm text-gray-500">Học sinh</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setActiveTab("sessions")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "sessions"
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                                }`}
                        >
                            Theo buổi học
                        </button>
                        <button
                            onClick={() => setActiveTab("students")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "students"
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                                }`}
                        >
                            Theo học sinh
                        </button>
                    </div>

                    {/* Content */}
                    {activeTab === "sessions" ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                        >
                            {sessions.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>Chưa có buổi điểm danh nào</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {sessions.map((session, index) => (
                                        <motion.div
                                            key={session.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {formatDate(session.date)}
                                                    </p>
                                                    {session.lessonContent && (
                                                        <p className="text-sm text-gray-500 mt-0.5">
                                                            {session.lessonContent}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1 text-green-600">
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{session.presentCount}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-red-600">
                                                        <XCircle className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{session.absentCount}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-yellow-600">
                                                        <Clock className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{session.lateCount}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                        >
                            {studentStats.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>Chưa có dữ liệu học sinh</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                                                Học sinh
                                            </th>
                                            <th className="text-center px-4 py-3 text-xs font-semibold text-green-600 uppercase">
                                                Có mặt
                                            </th>
                                            <th className="text-center px-4 py-3 text-xs font-semibold text-red-600 uppercase">
                                                Vắng
                                            </th>
                                            <th className="text-center px-4 py-3 text-xs font-semibold text-yellow-600 uppercase">
                                                Muộn
                                            </th>
                                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                                                Tỷ lệ
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {studentStats.map((student, index) => (
                                            <motion.tr
                                                key={student.studentId}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-medium">
                                                            {student.studentName.charAt(0)}
                                                        </div>
                                                        <span className="font-medium text-gray-900">
                                                            {student.studentName}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center font-medium text-green-600">
                                                    {student.presentCount}
                                                </td>
                                                <td className="px-4 py-3 text-center font-medium text-red-600">
                                                    {student.absentCount}
                                                </td>
                                                <td className="px-4 py-3 text-center font-medium text-yellow-600">
                                                    {student.lateCount}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getAttendanceColor(student.attendanceRate)}`}>
                                                        {student.attendanceRate}%
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
}
