import React from 'react';
import { Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeeklyGoalsWidgetProps {
    completed: number;
    total: number;
    goal: string;
}

export const WeeklyGoalsWidget = ({ completed, total, goal }: WeeklyGoalsWidgetProps) => {
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isOnTrack = progress >= 60;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-md">
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-violet-500 rounded-full" />
                    <h3 className="font-bold text-gray-800 text-sm tracking-tight">Mục tiêu tuần</h3>
                </div>
                <div className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold",
                    isOnTrack ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                )}>
                    {progress}%
                </div>
            </div>

            <div className="space-y-3">
                {/* Progress Bar */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-600 font-medium">{goal}</span>
                        <span className="text-xs text-gray-500 font-medium">{completed}/{total}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-500",
                                isOnTrack
                                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                                    : "bg-gradient-to-r from-amber-500 to-amber-600"
                            )}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Status Message */}
                <div className={cn(
                    "p-2 rounded-lg flex items-center gap-2",
                    isOnTrack ? "bg-emerald-50" : "bg-amber-50"
                )}>
                    <TrendingUp className={cn(
                        "w-4 h-4 flex-shrink-0",
                        isOnTrack ? "text-emerald-600" : "text-amber-600"
                    )} />
                    <p className={cn(
                        "text-[10px] font-medium",
                        isOnTrack ? "text-emerald-700" : "text-amber-700"
                    )}>
                        {isOnTrack
                            ? "Đang trên đà đạt mục tiêu!"
                            : `Còn ${total - completed} bài tập để đạt mục tiêu`}
                    </p>
                </div>
            </div>
        </div>
    );
};
