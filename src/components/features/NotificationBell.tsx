"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Info, Trophy, BookOpen } from "lucide-react";
import { Notification } from "@/types";
import { getNotificationsAction, markNotificationAsReadAction } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
    userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        loadNotifications();

        // Close dropdown when clicking outside
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [userId]);

    async function loadNotifications() {
        try {
            const data = await getNotificationsAction();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (error) {
            console.error("Failed to load notifications", error);
        }
    }

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            // Optimistic update while waiting for server confirmation
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            try {
                await markNotificationAsReadAction(notification.id);
            } catch (error) {
                console.error("Failed to mark notification as read", error);
            } finally {
                await loadNotifications();
            }
        }

        setIsOpen(false);
        if (notification.link) {
            router.push(notification.link);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'academic': return <BookOpen className="w-4 h-4 text-blue-500" />;
            case 'gamification': return <Trophy className="w-4 h-4 text-yellow-500" />;
            default: return <Info className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-border bg-muted/30 flex justify-between items-center">
                        <h3 className="font-semibold text-sm">Thông báo</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs text-muted-foreground">{unreadCount} chưa đọc</span>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                Không có thông báo nào.
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={cn(
                                            "p-4 hover:bg-muted/50 transition-colors cursor-pointer flex gap-3 items-start",
                                            !notification.isRead && "bg-blue-50/50"
                                        )}
                                    >
                                        <div className="mt-1 shrink-0 p-2 bg-background rounded-full border border-border shadow-sm">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className={cn("text-sm font-medium truncate pr-2", !notification.isRead && "text-blue-900")}>
                                                    {notification.title}
                                                </p>
                                                {!notification.isRead && (
                                                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground opacity-70">
                                                {new Date(notification.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-2 border-t border-border bg-muted/30 text-center">
                        <button className="text-xs text-primary hover:underline font-medium">
                            Xem tất cả
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
