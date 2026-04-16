"use client";

import { AtRiskStudent } from "@/lib/analytics/class-analytics";
import { AlertTriangle, Mail, Eye, MoreHorizontal } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface AtRiskWidgetProps {
    students: AtRiskStudent[];
    classId: string;
}

export default function AtRiskWidget({ students, classId }: AtRiskWidgetProps) {
    const { showToast } = useToast();

    if (students.length === 0) {
        return (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    Học sinh cần chú ý
                </h3>
                <div className="text-center py-8">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="text-sm text-muted-foreground">Tất cả học sinh đang hoàn thành tốt!</p>
                </div>
            </div>
        );
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high':
                return "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 hover:border-red-200 dark:hover:border-red-700";
            case 'medium':
                return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800 hover:border-yellow-200 dark:hover:border-yellow-700";
            default:
                return "bg-muted border-border hover:border-muted-foreground/30";
        }
    };

    return (
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    Học sinh cần chú ý ({students.length})
                </h3>
                <button
                    onClick={() => showToast("Trang báo cáo tổng hợp đang được phát triển", "info")}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                    Xem tất cả
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {students.slice(0, 4).map((student) => (
                    <div
                        key={student.id}
                        className={`relative p-4 rounded-xl border transition-all duration-200 ${getSeverityColor(student.severity)}`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-card border border-border shadow-sm">
                                    <img
                                        src={student.avatarUrl}
                                        alt={student.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground text-sm">{student.name}</p>
                                    <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm ${student.severity === 'high' ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200' : 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'}`}>
                                        {student.severity === 'high' ? 'Khẩn cấp' : 'Cần chú ý'}
                                    </span>
                                </div>
                            </div>
                            <button className="text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-1 mb-4">
                            {student.reasons.map((reason, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <div className="w-1 h-1 rounded-full bg-red-500" />
                                    {reason}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => showToast("Tính năng nhắn tin đang được phát triển", "info")}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-white bg-gray-900 dark:bg-white dark:text-foreground rounded-lg hover:bg-gray-800 dark:hover:bg-muted transition-colors"
                            >
                                <Mail className="w-3 h-3" />
                                Nhắn tin
                            </button>
                            <button
                                onClick={() => showToast("Trang hồ sơ học sinh đang được phát triển", "info")}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                            >
                                <Eye className="w-3 h-3" />
                                Hồ sơ
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
