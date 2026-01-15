import React from 'react';
import { CheckCircle, Circle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GradingProgressWidgetProps {
    graded: number;
    total: number;
    deadline?: Date;
}

export const GradingProgressWidget = ({ graded, total, deadline }: GradingProgressWidgetProps) => {
    const progress = total > 0 ? Math.round((graded / total) * 100) : 0;
    const remaining = total - graded;
    const isComplete = graded === total;

    return (
        <div className={cn(
            "rounded-2xl border p-4 shadow-md transition-colors",
            isComplete
                ? "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200"
                : "bg-white border-gray-200"
        )}>
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-1 h-4 rounded-full",
                        isComplete ? "bg-emerald-500" : "bg-blue-500"
                    )} />
                    <h3 className="font-bold text-gray-800 text-sm tracking-tight">Tiến độ chấm</h3>
                </div>
                <div className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold",
                    isComplete
                        ? "bg-emerald-500 text-white"
                        : "bg-blue-100 text-blue-700"
                )}>
                    {progress}%
                </div>
            </div>

            <div className="space-y-3">
                {/* Progress Bar */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-600 font-medium">
                            {isComplete ? 'Hoàn thành!' : `Còn ${remaining} bài`}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">{graded}/{total}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-500",
                                isComplete
                                    ? "bg-gradient-to-r from-emerald-500 to-green-600"
                                    : "bg-gradient-to-r from-blue-500 to-indigo-600"
                            )}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Status */}
                <div className={cn(
                    "p-2 rounded-lg flex items-center gap-2",
                    isComplete ? "bg-emerald-100/50" : "bg-blue-50"
                )}>
                    {isComplete ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                        <Circle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    )}
                    <p className={cn(
                        "text-[10px] font-medium",
                        isComplete ? "text-emerald-700" : "text-blue-700"
                    )}>
                        {isComplete
                            ? 'Đã chấm xong tất cả bài tập!'
                            : 'Tiếp tục chấm bài để hoàn thành'}
                    </p>
                </div>
            </div>
        </div>
    );
};
