import { ClassAnalytics } from "@/lib/class-analytics";
import { Users, FileCheck, GraduationCap, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";

interface KPIGridProps {
    analytics: ClassAnalytics;
    classId: string;
}

export default function KPIGrid({ analytics, classId }: KPIGridProps) {
    const metrics = [
        {
            label: "Điểm danh hôm nay",
            value: `${analytics.attendanceRate}%`,
            subtext: `${analytics.activeStudents} có mặt`,
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            trend: "stable"
        },
        {
            label: "Tỷ lệ nộp bài",
            value: `${analytics.submissionRate}%`,
            subtext: "Trung bình các bài",
            icon: FileCheck,
            color: "text-green-600",
            bgColor: "bg-green-50",
            trend: "up"
        },
        {
            label: "Điểm trung bình",
            value: analytics.averageScore.toFixed(1),
            subtext: "Thang điểm 10",
            icon: GraduationCap,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
            trend: "stable"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.map((metric, index) => {
                const isAttendance = metric.label === "Điểm danh hôm nay";
                const CardContent = (
                    <div className={`bg-white p-4 rounded-2xl border border-border/50 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow ${isAttendance ? 'cursor-pointer hover:border-blue-300' : ''}`}>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium mb-1">{metric.label}</p>
                            <div className="flex items-end gap-2">
                                <h3 className="text-2xl font-bold text-foreground">{metric.value}</h3>
                                {/* Trend indicator placeholder */}
                                {metric.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500 mb-1" />}
                                {metric.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500 mb-1" />}
                                {metric.trend === 'stable' && <Minus className="w-4 h-4 text-muted-foreground mb-1" />}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{metric.subtext}</p>
                        </div>
                        <div className={`p-3 rounded-xl ${metric.bgColor}`}>
                            <metric.icon className={`w-6 h-6 ${metric.color}`} />
                        </div>
                    </div>
                );

                if (isAttendance) {
                    return (
                        <Link key={index} href={`/dashboard/classes/${classId}/attendance`}>
                            {CardContent}
                        </Link>
                    );
                }

                return <div key={index}>{CardContent}</div>;
            })}
        </div>
    );
}
