import React from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Notification {
    id: string;
    title: string;
    from: string;
    time: Date;
    unread: boolean;
}

interface NotificationsWidgetProps {
    notifications: Notification[];
}

export const NotificationsWidget = ({ notifications }: NotificationsWidgetProps) => {
    const recentNotifications = notifications.slice(0, 3);
    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-md">
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-purple-500 rounded-full" />
                    <h3 className="font-bold text-gray-800 text-sm tracking-tight">Thông báo</h3>
                </div>
                {unreadCount > 0 && (
                    <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {unreadCount}
                    </span>
                )}
            </div>

            <div className="space-y-2">
                {recentNotifications.length > 0 ? (
                    <>
                        {recentNotifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={cn(
                                    "p-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 group",
                                    notif.unread && "bg-blue-50/50"
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-xs line-clamp-1 mb-0.5",
                                            notif.unread ? "font-bold text-gray-900" : "font-medium text-gray-700"
                                        )}>
                                            {notif.title}
                                        </p>
                                        <p className="text-[10px] text-gray-500">
                                            {notif.from} • {formatDistanceToNow(notif.time, { locale: vi, addSuffix: true })}
                                        </p>
                                    </div>
                                    {notif.unread && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                                    )}
                                </div>
                            </div>
                        ))}
                        <button className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium py-2 flex items-center justify-center gap-1 hover:bg-blue-50 rounded-lg transition-colors">
                            Xem tất cả
                            <ChevronRight className="w-3 h-3" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center opacity-50">
                        <Bell className="w-5 h-5 text-gray-300 mb-2" />
                        <p className="text-xs text-gray-600">Chưa có thông báo</p>
                    </div>
                )}
            </div>
        </div>
    );
};
