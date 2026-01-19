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
            <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Sắp đến hạn
                </h3>
                <div className="text-center py-8">
                    <div className="text-4xl mb-2">🎉</div>
                    <p className="text-sm text-muted-foreground">Không có deadline trong 7 ngày tới!</p>
                </div>
            </div>
        );
    }

    const getUrgencyColor = (daysUntilDue: number) => {
        if (daysUntilDue <= 2) return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30";
        if (daysUntilDue <= 4) return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30";
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30";
    };

    return (
        <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Sắp đến hạn ({deadlines.length})
            </h3>

            <div className="space-y-3">
                {deadlines.map((deadline) => {
                    const submissionPercentage = (deadline.submissionCount / deadline.totalStudents) * 100;

                    return (
                        <Link
                            key={deadline.assignmentId}
                            href={`/dashboard/assignments/${deadline.assignmentId}`}
                            className="block p-3 rounded-xl border border-border hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/30 dark:hover:bg-purple-900/20 transition-all"
                        >
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="font-medium text-foreground line-clamp-1 flex-1">{deadline.title}</p>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getUrgencyColor(deadline.daysUntilDue)}`}>
                                    {deadline.daysUntilDue === 1 ? 'Ngày mai' : `${deadline.daysUntilDue} ngày nữa`}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
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
