"use client";

import { StudentAnalytics } from "@/lib/student-analytics";
import { TrendingUp, Award, Users, Target } from "lucide-react";

interface MyPerformanceWidgetProps {
    analytics: StudentAnalytics;
}

export default function MyPerformanceWidget({ analytics }: MyPerformanceWidgetProps) {
    const metrics = [
        {
            label: "Điểm của bạn",
            value: analytics.myAverageScore.toFixed(1),
            max: "10",
            percentage: (analytics.myAverageScore / 10) * 100,
            color: "blue",
            icon: Target
        },
        {
            label: "Tỷ lệ nộp bài",
            value: `${analytics.mySubmissionRate}%`,
            percentage: analytics.mySubmissionRate,
            color: "green",
            icon: TrendingUp
        },
        {
            label: "Điểm danh",
            value: `${analytics.myAttendanceRate}%`,
            percentage: analytics.myAttendanceRate,
            color: "purple",
            icon: Users
        }
    ];

    const getColorClasses = (color: string) => {
        const colors = {
            blue: "from-blue-400 via-blue-500 to-blue-600",
            green: "from-green-400 via-green-500 to-green-600",
            purple: "from-purple-400 via-purple-500 to-purple-600",
            orange: "from-orange-400 via-orange-500 to-orange-600"
        };
        return colors[color as keyof typeof colors] || colors.blue;
    };


    return (
        <div className="relative bg-gradient-to-br from-white/95 via-white/90 to-gray-50/80 backdrop-blur-xl rounded-2xl border border-gray-200/40 p-6 shadow-lg overflow-hidden">
            {/* Decorative gradient orb */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Award className="w-5 h-5 text-blue-600" />
                        Tổng quan kết quả
                    </h3>
                </div>

                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            So với trung bình lớp
                        </span>
                        <span className={`text-sm font-bold ${analytics.aboveAverage ? 'text-green-600' : 'text-amber-600'}`}>
                            {analytics.aboveAverage ? "Trên trung bình" : "Cần cố gắng thêm"}
                        </span>
                    </div>
                    <div className="text-xs text-gray-600">
                        Điểm TB lớp: <span className="font-semibold">{analytics.classAverageScore.toFixed(1)}</span> •
                        Của bạn: <span className="font-semibold">{analytics.myAverageScore.toFixed(1)}</span>
                    </div>
                </div>

                {/* Personal Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {metrics.map((metric) => {
                        const Icon = metric.icon;
                        const isHigh = metric.percentage >= 80;

                        return (
                            <div key={metric.label} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4 text-gray-700" />
                                    <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                                </div>

                                <div className="text-2xl font-bold text-gray-900">
                                    {metric.value}
                                    {metric.max && <span className="text-sm text-gray-500 ml-1">/ {metric.max}</span>}
                                </div>

                                {/* Progress bar with glow */}
                                <div className="relative">
                                    {isHigh && (
                                        <div className={`absolute inset-0 bg-gradient-to-r ${getColorClasses(metric.color)} opacity-20 blur-md rounded-full`} />
                                    )}
                                    <div className="relative h-2 bg-gray-200/50 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className={`h-full bg-gradient-to-r ${getColorClasses(metric.color)} shadow-md transition-all duration-700`}
                                            style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
