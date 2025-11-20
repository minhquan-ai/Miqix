import React from 'react';
import { User } from '@/types';
import { Flame, Trophy, Star } from 'lucide-react';

interface GamificationStatsProps {
    user: User;
}

export function GamificationStats({ user }: GamificationStatsProps) {
    if (user.role !== 'student') return null;

    return (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold opacity-90">Hồ sơ Học tập</h2>
                    <p className="text-sm opacity-75">Tiếp tục phát huy nhé, {user.name}!</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
                    <span className="text-xl font-bold">{user.level}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/10">
                    <div className="flex items-center gap-2 mb-1 text-orange-300">
                        <Flame className="w-5 h-5 fill-orange-300" />
                        <span className="font-bold text-sm uppercase tracking-wider">Streak</span>
                    </div>
                    <div className="text-2xl font-bold">{user.streak || 0} <span className="text-sm font-normal opacity-75">ngày</span></div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/10">
                    <div className="flex items-center gap-2 mb-1 text-yellow-300">
                        <Star className="w-5 h-5 fill-yellow-300" />
                        <span className="font-bold text-sm uppercase tracking-wider">XP</span>
                    </div>
                    <div className="text-2xl font-bold">{user.xp?.toLocaleString()} <span className="text-sm font-normal opacity-75">pts</span></div>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-300" />
                        Huy hiệu gần đây
                    </h3>
                    <span className="text-xs opacity-75 hover:opacity-100 cursor-pointer">Xem tất cả</span>
                </div>

                {user.badges && user.badges.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {user.badges.map((badge) => (
                            <div key={badge.id} className="shrink-0 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-2xl border border-white/20 tooltip-trigger relative group cursor-help">
                                {badge.icon}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center">
                                    <div className="font-bold text-yellow-400 mb-0.5">{badge.name}</div>
                                    {badge.description}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm opacity-60 italic">Chưa có huy hiệu nào. Hãy làm bài tập để nhận!</div>
                )}
            </div>
        </div>
    );
}
