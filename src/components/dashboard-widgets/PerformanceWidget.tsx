"use client";

import { ClassAnalytics } from "@/lib/analytics/class-analytics";
import { TrendingUp, TrendingDown, Minus, Users, ClipboardList, Calendar, Activity } from "lucide-react";

interface PerformanceWidgetProps {
    analytics: ClassAnalytics;
}

export default function PerformanceWidget({ analytics }: PerformanceWidgetProps) {
    const metrics = [
        {
            label: "Điểm trung bình",
            value: analytics.averageScore.toFixed(1),
            max: "10",
            percentage: (analytics.averageScore / 10) * 100,
            trend: analytics.scoreTrend,
            color: "blue",
            icon: ClipboardList
        },
        {
            label: "Tỷ lệ nộp bài",
            value: `${analytics.submissionRate}%`,
            max: "100%",
            percentage: analytics.submissionRate,
            trend: analytics.submissionTrend,
            color: "green",
            icon: Activity
        },
        {
            label: "Tỷ lệ điểm danh",
            value: `${analytics.attendanceRate}%`,
            max: "100%",
            percentage: analytics.attendanceRate,
            trend: 'stable' as const,
            color: "purple",
            icon: Calendar
        },
        {
            label: "Hoàn thành đúng hạn",
            value: `${analytics.completionRate}%`,
            max: "100%",
            percentage: analytics.completionRate,
            trend: 'stable' as const,
            color: "orange",
            icon: Users
        }
    ];

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="w-4 h-4  text-green-600" />;
            case 'down':
                return <TrendingDown className="w-4 h-4 text-red-600" />;
            default:
                return <Minus className="w-4 h-4 text-muted-foreground" />;
        }
    };

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
        <div className="relative bg-gradient-to-br from-white/95 via-white/90 to-gray-50/80 backdrop-blur-xl rounded-2xl border border-border/40 p-6 shadow-lg overflow-hidden">
            {/* Decorative gradient orb */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Hiệu suất lớp học
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {metrics.map((metric) => {
                        const Icon = metric.icon;
                        const isHigh = metric.percentage >= 80;

                        return (
                            <div key={metric.label} className="relative group space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icon className="w-4 h-4 text-foreground" />
                                        <span className="text-sm font-medium text-foreground">{metric.label}</span>
                                    </div>
                                    {getTrendIcon(metric.trend)}
                                </div>

                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-foreground">{metric.value}</span>
                                    <span className="text-sm text-muted-foreground">/ {metric.max}</span>
                                </div>

                                {/* Enhanced Progress bar with glow */}
                                <div className="relative">
                                    {isHigh && (
                                        <div className={`absolute inset-0 bg-gradient-to-r ${getColorClasses(metric.color)} opacity-20 blur-md rounded-full`} />
                                    )}
                                    <div className="relative h-2.5 bg-gray-200/50 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className={`h-full bg-gradient-to-r ${getColorClasses(metric.color)} shadow-md transition-all duration-700 ease-out`}
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
