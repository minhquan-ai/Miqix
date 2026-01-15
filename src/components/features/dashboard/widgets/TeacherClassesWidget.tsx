import React from 'react';
import { GraduationCap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClassInfo {
    id: string;
    name: string;
    code: string;
    studentCount: number;
    subject: string;
}

interface TeacherClassesWidgetProps {
    classes: ClassInfo[];
}

export const TeacherClassesWidget = ({ classes }: TeacherClassesWidgetProps) => {
    const activeClasses = classes.slice(0, 3);

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-md">
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                    <h3 className="font-bold text-gray-800 text-sm tracking-tight">Lớp đang dạy</h3>
                </div>
                <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {classes.length}
                </span>
            </div>

            <div className="space-y-2">
                {activeClasses.length > 0 ? (
                    <>
                        {activeClasses.map((cls) => (
                            <div
                                key={cls.id}
                                className="p-2 rounded-lg cursor-pointer transition-all hover:bg-indigo-50 border border-transparent hover:border-indigo-200 group"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                        <GraduationCap className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-indigo-700">
                                            {cls.name}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] text-gray-500">{cls.code}</p>
                                            <span className="text-[10px] text-gray-400">•</span>
                                            <p className="text-[10px] text-gray-500">{cls.studentCount} HS</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                                </div>
                            </div>
                        ))}
                        <button className="w-full text-xs text-indigo-600 hover:text-indigo-700 font-medium py-2 flex items-center justify-center gap-1 hover:bg-indigo-50 rounded-lg transition-colors">
                            Xem tất cả
                            <ChevronRight className="w-3 h-3" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center opacity-50">
                        <GraduationCap className="w-5 h-5 text-gray-300 mb-2" />
                        <p className="text-xs text-gray-600">Chưa có lớp nào</p>
                    </div>
                )}
            </div>
        </div>
    );
};
