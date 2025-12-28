import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface UrgentAssignment {
    id: string;
    title: string;
    className: string;
    submissionsToGrade: number;
    dueDate: Date;
}

interface AssignmentsToGradeWidgetProps {
    assignments: UrgentAssignment[];
}

export const AssignmentsToGradeWidget = ({ assignments }: AssignmentsToGradeWidgetProps) => {
    const urgentAssignments = assignments.slice(0, 3);
    const totalToGrade = assignments.reduce((sum, a) => sum + a.submissionsToGrade, 0);

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-md">
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-red-500 rounded-full" />
                    <h3 className="font-bold text-gray-800 text-sm tracking-tight">Cần chấm gấp</h3>
                </div>
                <div className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {totalToGrade}
                </div>
            </div>

            <div className="space-y-2">
                {urgentAssignments.length > 0 ? (
                    <>
                        {urgentAssignments.map((assignment) => (
                            <div
                                key={assignment.id}
                                className="p-2 rounded-lg cursor-pointer transition-all hover:bg-red-50 border border-transparent hover:border-red-200 group"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-red-700">
                                            {assignment.title}
                                        </p>
                                        <p className="text-[10px] text-gray-500">
                                            {assignment.className} • {assignment.submissionsToGrade} bài
                                        </p>
                                        <p className="text-[9px] text-red-600 mt-0.5">
                                            {formatDistanceToNow(assignment.dueDate, { locale: vi, addSuffix: true })}
                                        </p>
                                    </div>
                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                </div>
                            </div>
                        ))}
                        <button className="w-full text-xs text-red-600 hover:text-red-700 font-medium py-2 flex items-center justify-center gap-1 hover:bg-red-50 rounded-lg transition-colors">
                            Xem tất cả
                            <ChevronRight className="w-3 h-3" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center opacity-50">
                        <AlertCircle className="w-5 h-5 text-gray-300 mb-2" />
                        <p className="text-xs text-gray-600">Không có bài cần chấm</p>
                    </div>
                )}
            </div>
        </div>
    );
};
