import React from 'react';
import { Users, TrendingDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentAtRisk {
    id: string;
    name: string;
    className: string;
    reason: string;
    score: number;
}

interface StudentsNeedHelpWidgetProps {
    students: StudentAtRisk[];
}

export const StudentsNeedHelpWidget = ({ students = [] }: StudentsNeedHelpWidgetProps) => {
    const atRiskStudents = students.slice(0, 3);

    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4 shadow-md">
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-amber-500 rounded-full" />
                    <h3 className="font-bold text-gray-800 text-sm tracking-tight">Cần hỗ trợ</h3>
                </div>
                <div className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {students.length}
                </div>
            </div>

            <div className="space-y-2">
                {atRiskStudents.length > 0 ? (
                    atRiskStudents.map((student) => (
                        <div
                            key={student.id}
                            className="bg-white/80 backdrop-blur-sm p-2 rounded-lg cursor-pointer transition-all hover:bg-white border border-amber-100 hover:border-amber-300 group"
                        >
                            <div className="flex items-start gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {student.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-800 line-clamp-1">
                                        {student.name}
                                    </p>
                                    <p className="text-[10px] text-gray-600">
                                        {student.className}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <TrendingDown className="w-3 h-3 text-red-500" />
                                        <p className="text-[10px] text-red-600 font-medium">
                                            {student.reason}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-xs font-bold text-amber-700">
                                    {student.score}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center opacity-50">
                        <Users className="w-5 h-5 text-gray-300 mb-2" />
                        <p className="text-xs text-gray-600">Tất cả đều ổn!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
