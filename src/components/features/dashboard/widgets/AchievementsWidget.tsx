import React from 'react';
import { Flame, Trophy, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AchievementsWidgetProps {
    streak: number;
    badges: number;
    rank?: number;
}

export const AchievementsWidget = ({ streak, badges, rank }: AchievementsWidgetProps) => {
    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4 shadow-md">
            <div className="mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-amber-500 rounded-full" />
                <h3 className="font-bold text-gray-800 text-sm tracking-tight">Thành tích</h3>
            </div>

            <div className="space-y-2">
                {/* Streak */}
                <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-amber-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                                <Flame className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-600 font-medium">Chuỗi ngày</p>
                                <p className="text-xs font-bold text-gray-800">{streak} ngày liên tiếp</p>
                            </div>
                        </div>
                        <div className="text-2xl">🔥</div>
                    </div>
                </div>

                {/* Badges */}
                <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
                            <Trophy className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] text-gray-600 font-medium">Huy hiệu</p>
                            <p className="text-xs font-bold text-gray-800">{badges} huy hiệu</p>
                        </div>
                        <div className="flex gap-0.5">
                            {[...Array(Math.min(badges, 3))].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Rank (if available) */}
                {rank && (
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-xl text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-medium opacity-90">Xếp hạng lớp</p>
                                <p className="text-lg font-bold">#{rank}</p>
                            </div>
                            <div className="text-2xl">🏆</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
