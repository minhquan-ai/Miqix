"use client";

import { Users, MoreVertical, Pin, Settings, Archive } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Class } from "@/types";
import { useState } from "react";

interface ClassCardTeacherProps {
    classData: Class;
    stats?: any;
    isPinned?: boolean;
    onPin?: (classId: string) => void;
    onEdit?: (classId: string) => void;
}

export function ClassCardTeacher({ classData, stats, isPinned, onPin, onEdit }: ClassCardTeacherProps) {
    const [showMenu, setShowMenu] = useState(false);

    // Map color name to theme styles
    const colorMap: Record<string, any> = {
        blue: { bar: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50" },
        emerald: { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
        violet: { bar: "bg-violet-500", text: "text-violet-700", bg: "bg-violet-50" },
        rose: { bar: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" },
        amber: { bar: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
        cyan: { bar: "bg-cyan-500", text: "text-cyan-700", bg: "bg-cyan-50" },
        indigo: { bar: "bg-indigo-500", text: "text-indigo-700", bg: "bg-indigo-50" },
        purple: { bar: "bg-purple-500", text: "text-purple-700", bg: "bg-purple-50" },
    };

    // Parse color - support both direct color names and gradient format
    const getColorKey = () => {
        if (!classData.color) return classData.classType === 'NORMAL' ? 'blue' : 'purple';
        // Handle gradient format like "from-blue-500 to-blue-600"
        const match = classData.color.match(/from-(\w+)-/);
        if (match) return match[1];
        return classData.color;
    };

    const colorKey = getColorKey();
    const theme = colorMap[colorKey] || colorMap.blue;

    // Determine Label - check multiple fields for compatibility
    const isNormalClass = classData.classType === 'NORMAL' || classData.role === 'main';
    const classLabel = isNormalClass ? "Chính khoá" : "Học thêm";
    const labelColor = isNormalClass
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-amber-50 text-amber-700 border-amber-200";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            transition={{ duration: 0.2 }}
            className="relative group h-full"
        >
            <Link href={`/dashboard/classes/${classData.id}`}>
                <div className="bg-white rounded-xl border border-gray-200 transition-all duration-300 shadow-sm overflow-hidden flex flex-col h-full hover:border-blue-200">
                    {/* Top Color Bar - Thick and visible */}
                    <div className={`h-2 w-full ${theme.bar}`} />

                    <div className="p-5 flex flex-col h-full">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="space-y-1 flex-1 min-w-0">
                                {/* Pinned indicator + Class Type Label */}
                                <div className="flex items-center gap-2 mb-2">
                                    {isPinned && <Pin className="w-3.5 h-3.5 text-orange-500 fill-orange-500 flex-shrink-0" />}
                                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${labelColor}`}>
                                        {classLabel}
                                    </span>
                                </div>

                                {/* Class Name - Prominent */}
                                <h3 className="font-bold text-lg leading-tight line-clamp-1 text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {classData.name}
                                </h3>

                                {/* Subject + Stream */}
                                <p className="text-gray-500 text-sm font-medium line-clamp-1">
                                    {classData.subject}
                                    {classData.stream && ` • ${classData.stream}`}
                                </p>
                            </div>

                            {/* Context Menu Trigger */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowMenu(!showMenu);
                                }}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors -mr-2 -mt-1 flex-shrink-0"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Description (if any) */}
                        {classData.description && (
                            <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                                {classData.description}
                            </p>
                        )}

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Footer */}
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                <Users className="w-4 h-4" />
                                <span className="font-medium">{stats?.studentCount || 0} học sinh</span>
                            </div>

                            <code className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                {classData.code}
                            </code>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Dropdown Menu */}
            {showMenu && (
                <div
                    className="absolute top-12 right-2 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 min-w-[150px]"
                    onClick={(e) => e.preventDefault()}
                >
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onPin?.(classData.id);
                            setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700"
                    >
                        <Pin className="w-4 h-4" />
                        {isPinned ? "Bỏ ghim" : "Ghim lớp"}
                    </button>
                    <button className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700">
                        <Settings className="w-4 h-4" />
                        Cài đặt
                    </button>
                    <div className="h-px bg-gray-100 my-1" />
                    <button className="w-full px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-sm text-red-600">
                        <Archive className="w-4 h-4" />
                        Lưu trữ
                    </button>
                </div>
            )}
            {/* Click outside listener */}
            {showMenu && (
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            )}
        </motion.div>
    );
}

