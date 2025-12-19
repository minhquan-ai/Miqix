"use client";

import { StudentAnalytics } from "@/lib/student-analytics";
import { ClipboardList, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface MyAssignmentsWidgetProps {
    analytics: StudentAnalytics;
    classId: string;
}

export default function MyAssignmentsWidget({ analytics, classId }: MyAssignmentsWidgetProps) {
    const { pendingAssignments, ungradedSubmissions } = analytics;

    const formatDueDate = (date: Date) => {
        const now = new Date();
        const diff = date.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days < 0) return "Quá hạn";
        if (days === 0) return "Hôm nay";
        if (days === 1) return "Ngày mai";
        return `${days} ngày nữa`;
    };

    return (
        <div className="bg-gradient-to-br from-white/95 via-white/90 to-gray-50/80 backdrop-blur-xl rounded-2xl border border-gray-200/40 p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                Bài tập của bạn
            </h3>

            <div className="space-y-4">
                {/* Pending Assignments */}
                {pendingAssignments.length > 0 ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            Chưa nộp ({pendingAssignments.length})
                        </div>
                        {pendingAssignments.slice(0, 3).map((assignment) => (
                            <Link
                                key={assignment.id}
                                href={`/dashboard/classes/${assignment.classId}/assignments/${assignment.id}`}
                                className={`block p-3 rounded-xl border transition-all hover:shadow-md ${assignment.urgent
                                    ? "bg-gradient-to-r from-red-50 to-orange-50 border-red-200 hover:border-red-300"
                                    : "bg-white border-gray-200 hover:border-blue-300"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 truncate">
                                            {assignment.title}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDueDate(assignment.dueDate)}
                                            </span>
                                            <span>{assignment.maxScore} điểm</span>
                                        </div>
                                    </div>
                                    {assignment.urgent && (
                                        <span className="flex-shrink-0 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                            Khẩn
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ))}
                        {pendingAssignments.length > 3 && (
                            <Link
                                href={classId ? `/dashboard/classes/${classId}?tab=classwork` : '/dashboard/assignments'}
                                className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
                            >
                                Xem thêm {pendingAssignments.length - 3} bài...
                            </Link>
                        )}
                    </div>
                ) : null}

                {/* Ungraded Submissions */}
                {ungradedSubmissions.length > 0 ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            Chờ chấm điểm ({ungradedSubmissions.length})
                        </div>
                        {ungradedSubmissions.slice(0, 2).map((submission) => (
                            <div
                                key={submission.assignmentId}
                                className="p-3 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200"
                            >
                                <div className="font-medium text-gray-900 text-sm">
                                    {submission.assignmentTitle}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                    Nộp: {submission.submittedAt.toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}

                {/* Empty state */}
                {pendingAssignments.length === 0 && ungradedSubmissions.length === 0 && (
                    <div className="text-center py-8">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <div className="text-gray-600 font-medium">
                            Tuyệt vời! Tất cả bài tập đã hoàn thành
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                            Bạn đã nộp và được chấm điểm hết rồi 🎉
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
