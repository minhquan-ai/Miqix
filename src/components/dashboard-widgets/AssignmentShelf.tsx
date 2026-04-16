import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { PendingAssignment } from '@/lib/analytics/student-analytics';
import { Calendar, Clock, AlertCircle, ArrowRight, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import Link from 'next/link';

interface AssignmentShelfProps {
    title: string;
    assignments: PendingAssignment[];
    color?: string;
    subject?: string;
    classId: string;
}

const AssignmentShelf: React.FC<AssignmentShelfProps> = ({ title, assignments, color = "blue", subject, classId }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Map color string to tailwind classes
    const getColorClasses = (colorName: string) => {
        const colors: Record<string, string> = {
            blue: 'bg-blue-50 text-blue-700 border-blue-200',
            green: 'bg-green-50 text-green-700 border-green-200',
            purple: 'bg-purple-50 text-purple-700 border-purple-200',
            orange: 'bg-orange-50 text-orange-700 border-orange-200',
            red: 'bg-red-50 text-red-700 border-red-200',
            pink: 'bg-pink-50 text-pink-700 border-pink-200',
            indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            teal: 'bg-teal-50 text-teal-700 border-teal-200',
            yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            gray: 'bg-gray-50 text-gray-700 border-gray-200',
        };
        return colors[colorName] || colors.blue;
    };

    const colorClasses = getColorClasses(color);

    return (
        <div className="mb-10 group">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        {title}
                        {subject && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${colorClasses}`}>
                                {subject}
                            </span>
                        )}
                        <span className="text-sm font-medium text-gray-500 ml-2 bg-gray-100 px-2 py-0.5 rounded-full">
                            {assignments.length}
                        </span>
                    </h3>
                </div>
                <Link href={`/dashboard/classes/${classId}`}>
                    <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        Xem tất cả <ArrowRight className="w-4 h-4" />
                    </button>
                </Link>
            </div>

            <div
                ref={scrollRef}
                className="overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide flex gap-4 snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {assignments.map((assignment, index) => (
                    <motion.div
                        key={assignment.id}
                        className="flex-shrink-0 w-[280px] snap-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Link href={`/assignments/${assignment.id}`}>
                            <div className={`h-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group/card relative overflow-hidden`}>
                                {/* Hover Gradient Overlay */}
                                <div className={`absolute inset-0 bg-gradient-to-br from-white to-${color}-50 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`p-2 rounded-xl bg-gray-50 group-hover/card:bg-white transition-colors`}>
                                            <BookOpen className={`w-5 h-5 text-${color}-600`} />
                                        </div>
                                        {assignment.urgent && (
                                            <div className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100 animate-pulse">
                                                <AlertCircle className="w-3 h-3" />
                                                Gấp
                                            </div>
                                        )}
                                    </div>

                                    <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover/card:text-indigo-600 transition-colors">
                                        {assignment.title}
                                    </h4>

                                    <div className="mt-auto space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Calendar className="w-4 h-4" />
                                            <span>{format(new Date(assignment.dueDate), "dd/MM", { locale: vi })}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Clock className="w-4 h-4" />
                                            <span>{format(new Date(assignment.dueDate), "HH:mm")}</span>
                                        </div>

                                        <div className="pt-3 mt-1 border-t border-gray-50 flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-400">
                                                {assignment.maxScore} điểm
                                            </span>
                                            <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 opacity-0 group-hover/card:opacity-100 transform translate-x-2 group-hover/card:translate-x-0 transition-all">
                                                <ArrowRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}

                {/* View All Card */}
                <motion.div
                    className="flex-shrink-0 w-[150px] snap-center flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: assignments.length * 0.05 }}
                >
                    <Link href={`/dashboard/classes/${classId}`}>
                        <button className="flex flex-col items-center gap-2 text-gray-400 hover:text-indigo-600 transition-colors group/view-all">
                            <div className="w-12 h-12 rounded-full border-2 border-gray-200 group-hover/view-all:border-indigo-600 flex items-center justify-center transition-colors">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium">Xem tất cả</span>
                        </button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default AssignmentShelf;
