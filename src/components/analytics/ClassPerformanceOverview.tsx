"use client";

import { getClassOverviewStats, ClassOverviewStats } from "@/lib/analytics";
import { User, Submission, Assignment } from "@/types";
import { TrendingUp, Users, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatScore } from "@/lib/score-utils";

interface ClassPerformanceOverviewProps {
    users: User[];
    submissions: Submission[];
    assignments: Assignment[];
    classStudentIds: string[];
}

export function ClassPerformanceOverview({
    users,
    submissions,
    assignments,
    classStudentIds
}: ClassPerformanceOverviewProps) {
    const stats = getClassOverviewStats(users, submissions, assignments, classStudentIds);

    return (
        <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Tổng Quan Lớp Học</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Students */}
                <StatCard
                    icon={<Users className="w-5 h-5" />}
                    label="Tổng học sinh"
                    value={stats.totalStudents}
                    color="blue"
                />

                {/* Average Score */}
                <StatCard
                    icon={<TrendingUp className="w-5 h-5" />}
                    label="Điểm TB"
                    value={`${formatScore(stats.averageScore / 10)}/10`}
                    color="green"
                />

                {/* Completion Rate */}
                <StatCard
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    label="Tỷ lệ hoàn thành"
                    value={`${stats.completionRate}%`}
                    color="purple"
                />

                {/* At Risk Count */}
                <StatCard
                    icon={<AlertTriangle className="w-5 h-5" />}
                    label="Học sinh cần hỗ trợ"
                    value={stats.atRiskCount}
                    color="red"
                />
            </div>

            {/* Top Performer */}
            {stats.topPerformer && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-900">
                        🏆 <span className="font-semibold">Học sinh xuất sắc nhất:</span>{' '}
                        {stats.topPerformer.name} ({formatScore(stats.topPerformer.score / 10)}/10)
                    </p>
                </div>
            )}
        </div>
    );
}

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: 'blue' | 'green' | 'purple' | 'red';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 border-blue-200',
        green: 'bg-green-50 text-green-600 border-green-200',
        purple: 'bg-purple-50 text-purple-600 border-purple-200',
        red: 'bg-red-50 text-red-600 border-red-200'
    };

    return (
        <div className="space-y-2">
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${colorClasses[color]}`}>
                {icon}
            </div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );
}
