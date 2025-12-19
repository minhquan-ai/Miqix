"use client";

import { UpcomingDeadline } from "@/lib/class-analytics";
import { Calendar, Clock, Users } from "lucide-react";
import Link from "next/link";

interface UpcomingWidgetProps {
    deadlines: UpcomingDeadline[];
    classId: string;
}

export default function UpcomingWidget({ deadlines, classId }: UpcomingWidgetProps) {
    if (deadlines.length === 0) {
        return (
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/60 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Sắp đến hạn
                </h3>
                <div className="text-center py-8">
                    <div className="text-4xl mb-2">🎉</div>
                    <p className="text-sm text-gray-600">Không có deadline trong 7 ngày tới!</p>
                </div>
            </div>
        );
    }

    const getUrgencyColor = (daysUntilDue: number) => {
        if (daysUntilDue <= 2) return "text-red-600 bg-red-50";
        if (daysUntilDue <= 4) return "text-orange-600 bg-orange-50";
        return "text-blue-600 bg-blue-50";
    };

    return (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/60 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Sắp đến hạn ({deadlines.length})
            </h3>

            <div className="space-y-3">
                {deadlines.map((deadline) => {
                    const submissionPercentage = (deadline.submissionCount / deadline.totalStudents) * 100;

                    return (
                        <Link
                            key={deadline.assignmentId}
                            href={`/dashboard/assignments/${deadline.assignmentId}`}
                            className="block p-3 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 transition-all"
                        >
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="font-medium text-gray-900 line-clamp-1 flex-1">{deadline.title}</p>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getUrgencyColor(deadline.daysUntilDue)}`}>
                                    {deadline.daysUntilDue === 1 ? 'Ngày mai' : `${deadline.daysUntilDue} ngày nữa`}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-600">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(deadline.dueDate).toLocaleDateString('vi-VN', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {deadline.submissionCount}/{deadline.totalStudents} đã nộp
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                                    style={{ width: `${submissionPercentage}%` }}
                                />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
