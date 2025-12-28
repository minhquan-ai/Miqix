import React from 'react';
import { Activity, FileText, Award as AwardIcon, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface RecentActivity {
    id: string;
    type: 'submission' | 'grade' | 'achievement' | 'attendance';
    title: string;
    description: string;
    time: Date;
}

interface RecentActivityWidgetProps {
    activities: RecentActivity[];
}

const activityIcons = {
    submission: FileText,
    grade: AwardIcon,
    achievement: AwardIcon,
    attendance: Calendar
};

const activityColors = {
    submission: 'bg-blue-50 text-blue-600',
    grade: 'bg-emerald-50 text-emerald-600',
    achievement: 'bg-amber-50 text-amber-600',
    attendance: 'bg-purple-50 text-purple-600'
};

export const RecentActivityWidget = ({ activities }: RecentActivityWidgetProps) => {
    const recentActivities = activities.slice(0, 3);

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-md">
            <div className="mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                <h3 className="font-bold text-gray-800 text-sm tracking-tight">Hoạt động gần đây</h3>
            </div>

            <div className="space-y-3">
                {recentActivities.length > 0 ? (
                    recentActivities.map((activity, idx) => {
                        const Icon = activityIcons[activity.type];
                        const colorClass = activityColors[activity.type];

                        return (
                            <div key={activity.id} className="relative pl-4">
                                {/* Timeline line */}
                                {idx !== recentActivities.length - 1 && (
                                    <div className="absolute left-[11px] top-6 bottom-[-12px] w-[1px] bg-gray-100" />
                                )}

                                <div className="flex gap-2 group cursor-pointer">
                                    <div className={cn(
                                        "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 relative z-10",
                                        colorClass
                                    )}>
                                        <Icon className="w-3 h-3" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                            {activity.title}
                                        </p>
                                        <p className="text-[10px] text-gray-500 line-clamp-1">
                                            {activity.description}
                                        </p>
                                        <p className="text-[9px] text-gray-400 mt-0.5">
                                            {formatDistanceToNow(activity.time, { locale: vi, addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center opacity-50">
                        <Activity className="w-5 h-5 text-gray-300 mb-2" />
                        <p className="text-xs text-gray-600">Chưa có hoạt động</p>
                    </div>
                )}
            </div>
        </div>
    );
};
