"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, ClipboardList, Calendar, User } from "lucide-react";
import { motion } from "framer-motion";

interface BottomNavigationProps {
    pendingAssignments?: number;
}

// Chỉ sử dụng các tính năng thực sự có trong app
const navItems = [
    { icon: Home, label: "Trang chủ", href: "/dashboard" },
    { icon: BookOpen, label: "Lớp học", href: "/dashboard/classes" },
    { icon: ClipboardList, label: "Bài tập", href: "/dashboard/assignments", badgeKey: "assignments" },
    { icon: Calendar, label: "Lịch biểu", href: "/dashboard/schedule" },
    { icon: User, label: "Hồ sơ", href: "/dashboard/profile" },
];

export default function BottomNavigation({ pendingAssignments = 0 }: BottomNavigationProps) {
    const pathname = usePathname();

    const getBadge = (badgeKey?: string) => {
        if (badgeKey === "assignments" && pendingAssignments > 0) return pendingAssignments;
        return 0;
    };

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname.startsWith(href);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[9999] bg-white/95 backdrop-blur-md border-t border-gray-200/80 safe-area-bottom md:hidden">
            <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    const badge = getBadge(item.badgeKey);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`relative flex flex-col items-center justify-center flex-1 h-full py-2 touch-target transition-all duration-200 ${active
                                    ? "text-indigo-600"
                                    : "text-gray-400 active:text-gray-600"
                                }`}
                        >
                            <div className="relative">
                                <item.icon
                                    className={`w-6 h-6 transition-transform ${active ? "stroke-[2.5px] scale-110" : ""
                                        }`}
                                />
                                {badge > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                                        {badge > 9 ? "9+" : badge}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[11px] mt-1 transition-all ${active ? "font-semibold" : "font-medium"
                                }`}>
                                {item.label}
                            </span>
                            {active && (
                                <motion.div
                                    layoutId="bottomNavIndicator"
                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-b-full"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
