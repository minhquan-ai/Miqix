"use client";

import { Users, FileText, Clock, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface TeacherClassesStatsProps {
    totalClasses: number;
    totalStudents: number;
    pendingGrading: number;
}

export function TeacherClassesStats({ totalClasses, totalStudents, pendingGrading }: TeacherClassesStatsProps) {
    // minimalist stats strip
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Users className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-2xl font-bold text-gray-900">{totalStudents}</div>
                    <div className="text-xs text-gray-500 font-medium uppercase">Học sinh</div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                    <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-2xl font-bold text-gray-900">{totalClasses}</div>
                    <div className="text-xs text-gray-500 font-medium uppercase">Lớp học</div>
                </div>
            </div>

            <div className="col-span-2 bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-orange-600">{pendingGrading}</div>
                        <div className="text-xs text-gray-500 font-medium uppercase">Bài cần chấm</div>
                    </div>
                </div>
                {pendingGrading > 0 && (
                    <div className="h-full flex items-center">
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full animate-pulse">
                            Ưu tiên
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
