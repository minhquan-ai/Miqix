"use client";

import { MessageSquare, Plus, Users, Calendar, ClipboardList, Bell } from "lucide-react";
import Link from "next/link";

interface QuickActionsWidgetProps {
    classId: string;
    role: 'teacher' | 'student';
}

export default function QuickActionsWidget({ classId, role }: QuickActionsWidgetProps) {
    const teacherActions = [
        {
            label: "Tạo thông báo",
            icon: MessageSquare,
            href: `/dashboard/classes/${classId}?tab=stream&action=post`,
            color: "blue"
        },
        {
            label: "Tạo bài tập",
            icon: Plus,
            href: `/dashboard/classes/${classId}?tab=classwork&action=create`,
            color: "green"
        },
        {
            label: "Điểm danh",
            icon: Calendar,
            href: `/dashboard/classes/${classId}?tab=attendance`,
            color: "purple"
        },
        {
            label: "Danh sách lớp",
            icon: Users,
            href: `/dashboard/classes/${classId}?tab=people`,
            color: "orange"
        }
    ];

    const studentActions = [
        {
            label: "Bài tập",
            icon: ClipboardList,
            href: `/dashboard/classes/${classId}?tab=classwork`,
            color: "blue"
        },
        {
            label: "Thông báo",
            icon: Bell,
            href: `/dashboard/classes/${classId}?tab=stream`,
            color: "green"
        },
        {
            label: "Điểm danh",
            icon: Calendar,
            href: `/dashboard/classes/${classId}?tab=attendance`,
            color: "purple"
        },
        {
            label: "Thành viên",
            icon: Users,
            href: `/dashboard/classes/${classId}?tab=people`,
            color: "orange"
        }
    ];

    const actions = role === 'teacher' ? teacherActions : studentActions;

    const getColorClasses = (color: string) => {
        const colors = {
            blue: "bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-600 hover:from-blue-100 hover:to-blue-200/50 border-blue-200/30",
            green: "bg-gradient-to-br from-green-50 to-green-100/50 text-green-600 hover:from-green-100 hover:to-green-200/50 border-green-200/30",
            purple: "bg-gradient-to-br from-purple-50 to-purple-100/50 text-purple-600 hover:from-purple-100 hover:to-purple-200/50 border-purple-200/30",
            orange: "bg-gradient-to-br from-orange-50 to-orange-100/50 text-orange-600 hover:from-orange-100 hover:to-orange-200/50 border-orange-200/30"
        };
        return colors[color as keyof typeof colors] || colors.blue;
    };

    return (
        <div className="bg-gradient-to-br from-white/95 via-white/90 to-gray-50/80 backdrop-blur-xl rounded-2xl border border-gray-200/40 p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-5">Quick Actions</h3>

            <div className="grid grid-cols-2 gap-3">
                {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <Link
                            key={action.label}
                            href={action.href}
                            className={`group flex flex-col items-center justify-center gap-3 p-5 rounded-xl backdrop-blur-sm border shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.03] ${getColorClasses(action.color)}`}
                        >
                            <Icon className="w-7 h-7 transition-transform group-hover:scale-110" />
                            <span className="text-sm font-medium text-center leading-tight">{action.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
