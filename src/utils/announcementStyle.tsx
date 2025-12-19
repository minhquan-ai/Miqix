import { Bell, AlertTriangle, Calendar, Sparkles } from "lucide-react";
import React from "react";

export const getAnnouncementStyle = (type: string) => {
    switch (type) {
        case 'IMPORTANT':
            return {
                gradient: 'from-orange-50 via-orange-50/50 to-amber-50/30',
                border: 'border-orange-200', // Increased opacity for modal visibility
                icon: <Bell className="w-4 h-4 text-orange-600" />,
                badge: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white',
                badgeText: 'QUAN TRỌNG',
                accentColor: 'bg-orange-500',
                headerBg: 'bg-orange-50'
            };
        case 'URGENT':
            return {
                gradient: 'from-red-50 via-red-50/50 to-rose-50/30',
                border: 'border-red-200', // Increased opacity
                icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
                badge: 'bg-gradient-to-r from-red-500 to-rose-500 text-white',
                badgeText: 'KHẨN CẤP',
                accentColor: 'bg-red-500',
                headerBg: 'bg-red-50'
            };
        case 'EVENT':
            return {
                gradient: 'from-purple-50 via-purple-50/50 to-violet-50/30',
                border: 'border-purple-200',
                icon: <Calendar className="w-4 h-4 text-purple-600" />,
                badge: 'bg-gradient-to-r from-purple-500 to-violet-500 text-white',
                badgeText: 'SỰ KIỆN',
                accentColor: 'bg-purple-500',
                headerBg: 'bg-purple-50'
            };
        default:
            return {
                gradient: 'from-white via-gray-50/30 to-blue-50/20',
                border: 'border-gray-200', // Default border
                icon: <Sparkles className="w-4 h-4 text-blue-500" />,
                badge: null,
                badgeText: null,
                accentColor: 'bg-blue-500',
                headerBg: 'bg-gray-50'
            };
    }
};
