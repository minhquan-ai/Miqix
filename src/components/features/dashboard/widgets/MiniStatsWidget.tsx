import React from 'react';
import { TrendingUp, Target, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MiniStatsWidgetProps {
    averageScore: number;
    attendanceRate: number;
    rank?: number;
}

export const MiniStatsWidget = ({ averageScore, attendanceRate, rank }: MiniStatsWidgetProps) => {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-md">
            <div className="mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                <h3 className="font-bold text-gray-800 text-sm tracking-tight">Thành tích</h3>
            </div>

            <div className="space-y-3">
                {/* Average Score */}
                <div className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-xs text-gray-600 font-medium">Điểm TB</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">{averageScore.toFixed(1)}</span>
                </div>

                {/* Attendance Rate */}
                <div className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <Target className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="text-xs text-gray-600 font-medium">Chuyên cần</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">{attendanceRate}%</span>
                </div>

                {/* Rank (if available) */}
                {rank && (
                    <div className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                <Award className="w-4 h-4 text-amber-600" />
                            </div>
                            <span className="text-xs text-gray-600 font-medium">Xếp hạng</span>
                        </div>
                        <span className="text-sm font-bold text-amber-600">#{rank}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
