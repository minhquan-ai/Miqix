
import React from 'react';
import { BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast } from 'date-fns';
import { vi } from 'date-fns/locale';

interface MiniAssignmentsWidgetProps {
    assignments: any[];
    userId?: string;
}

export const MiniAssignmentsWidget = ({ assignments, userId }: MiniAssignmentsWidgetProps) => {
    // Filter for upcoming/pending
    const pendingAssignments = assignments
        .filter(a => !isPast(new Date(a.dueDate)))
        .slice(0, 3);

    return (
        <div className="h-full flex flex-col pr-4 bg-white rounded-2xl border border-gray-200 p-4 shadow-md">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-amber-500 rounded-full" />
                    <h3 className="font-bold text-gray-800 text-sm tracking-tight">Bài tập sắp tới</h3>
                </div>
                <div className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {pendingAssignments.length}
                </div>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 scrollbar-hide pl-2">
                {pendingAssignments.length > 0 ? (
                    pendingAssignments.map((assignment) => (
                        <div key={assignment.id} className="group cursor-pointer">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                                    {(assignment.subject || "Môn học")}
                                </span>
                                <span className={cn(
                                    "text-[10px] font-bold",
                                    isPast(new Date(assignment.dueDate)) ? "text-red-500" : "text-amber-600"
                                )}>
                                    {format(new Date(assignment.dueDate), 'dd/MM', { locale: vi })}
                                </span>
                            </div>
                            <div className={cn(
                                "p-3 rounded-xl transition-all border",
                                "bg-white border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]",
                                "group-hover:border-amber-200 group-hover:shadow-[0_4px_12px_rgba(251,191,36,0.1)] group-hover:-translate-y-0.5"
                            )}>
                                <h4 className="text-[13px] font-bold text-gray-800 line-clamp-1 group-hover:text-amber-700 transition-colors mb-1">
                                    {assignment.title}
                                </h4>
                                <div className="flex items-center gap-1.5">
                                    <div className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        isPast(new Date(assignment.dueDate)) ? "bg-red-400" : "bg-amber-400"
                                    )} />
                                    <p className="text-[10px] text-gray-600 truncate">
                                        {assignment.assignmentClasses?.[0]?.class?.name || "Lớp học"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-center opacity-50">
                        <CheckCircle className="w-6 h-6 text-green-300 mb-2" />
                        <p className="text-xs text-gray-600">Đã xong hết!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
