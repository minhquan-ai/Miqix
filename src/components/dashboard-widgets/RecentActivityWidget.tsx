"use client";

import { RecentActivity } from "@/lib/analytics/class-analytics";
import { Clock, FileText, MessageSquare, CheckCircle, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

import { isToday } from "date-fns";

interface RecentActivityWidgetProps {
    activities: RecentActivity[];
}

export default function RecentActivityWidget({ activities }: RecentActivityWidgetProps) {
    const todayActivities = activities.filter(activity => isToday(new Date(activity.timestamp)));

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'announcement':
                return <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
            case 'submission':
                return <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />;
            case 'grade':
                return <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
            default:
                return <Clock className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'announcement':
                return "bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800";
            case 'submission':
                return "bg-green-100 dark:bg-green-900/40 border-green-200 dark:border-green-800";
            case 'grade':
                return "bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800";
            default:
                return "bg-muted border-border";
        }
    };

    if (todayActivities.length === 0) {
        return (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Hoạt động hôm nay
                </h3>
                <p className="text-sm text-muted-foreground text-center py-4">
                    Chưa có hoạt động nào trong ngày hôm nay.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col max-h-[400px]">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2 shrink-0">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Hoạt động hôm nay
            </h3>

            <div className="relative pl-4 border-l-2 border-border space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                {todayActivities.map((activity, index) => (
                    <div key={activity.id} className="relative">
                        {/* Timeline dot */}
                        <div className={`absolute -left-[25px] top-1 w-4 h-4 rounded-full border-2 border-card shadow-sm flex items-center justify-center ${getActivityColor(activity.type)}`}>
                            {/* Inner dot handled by bg color */}
                        </div>

                        <div className="flex items-start gap-3">
                            {activity.actor && (
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0 border border-border">
                                    {activity.actor.avatarUrl ? (
                                        <img src={activity.actor.avatarUrl} alt={activity.actor.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            <User className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">
                                    {activity.description}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: vi })}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
