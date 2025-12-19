
'use client';

import React from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ClassSession } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface SessionCalendarProps {
    sessions: ClassSession[];
    currentDate: Date;
    onDateChange: (date: Date) => void;
    onSessionClick: (session: ClassSession) => void;
    onEmptySlotClick: (date: Date, period: number) => void;
}

export function SessionCalendar({
    sessions,
    currentDate,
    onDateChange,
    onSessionClick,
    onEmptySlotClick
}: SessionCalendarProps) {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const weekDays = Array.from({ length: 6 }).map((_, i) => addDays(startDate, i)); // Mon-Sat
    const periods = Array.from({ length: 10 }).map((_, i) => i + 1); // 1-10 periods

    const getSession = (date: Date, period: number) => {
        return sessions.find(s =>
            isSameDay(new Date(s.date), date) && s.period === period
        );
    };

    const getClassificationColor = (classification?: string) => {
        switch (classification) {
            case 'A': return 'bg-green-100 text-green-800 border-green-200';
            case 'B': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'C': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'D': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-blue-50 text-blue-800 border-blue-100';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Tuần {format(startDate, 'dd/MM')} - {format(addDays(startDate, 5), 'dd/MM/yyyy')}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onDateChange(addDays(currentDate, -7))}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                        onClick={() => onDateChange(new Date())}
                        className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        Hôm nay
                    </button>
                    <button
                        onClick={() => onDateChange(addDays(currentDate, 7))}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Days Header */}
                    <div className="grid grid-cols-[60px_repeat(6,1fr)] border-b border-gray-200 bg-gray-50">
                        <div className="p-3 text-center text-sm font-medium text-gray-500 border-r border-gray-200">
                            Tiết
                        </div>
                        {weekDays.map(day => (
                            <div key={day.toString()} className={cn(
                                "p-3 text-center border-r border-gray-200 last:border-r-0",
                                isSameDay(day, new Date()) && "bg-blue-50"
                            )}>
                                <div className="text-sm font-semibold text-gray-900">
                                    {format(day, 'EEEE', { locale: vi })}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {format(day, 'dd/MM')}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Periods Rows */}
                    {periods.map(period => (
                        <div key={period} className="grid grid-cols-[60px_repeat(6,1fr)] border-b border-gray-100 last:border-b-0">
                            <div className="p-3 flex items-center justify-center text-sm font-medium text-gray-500 border-r border-gray-200 bg-gray-50">
                                {period}
                            </div>
                            {weekDays.map(day => {
                                const session = getSession(day, period);
                                return (
                                    <div
                                        key={`${day}-${period}`}
                                        className={cn(
                                            "min-h-[100px] p-2 border-r border-gray-100 last:border-r-0 relative group transition-colors",
                                            !session && "hover:bg-gray-50 cursor-pointer"
                                        )}
                                        onClick={() => !session && onEmptySlotClick(day, period)}
                                    >
                                        {session ? (
                                            <div
                                                onClick={(e) => { e.stopPropagation(); onSessionClick(session); }}
                                                className={cn(
                                                    "h-full w-full rounded-lg p-2 text-xs border cursor-pointer hover:shadow-md transition-all",
                                                    getClassificationColor(session.classification)
                                                )}
                                            >
                                                <div className="font-bold mb-1 truncate">{session.subject || 'Chưa có môn'}</div>
                                                <div className="line-clamp-2 mb-1 text-gray-700">{session.lessonContent || 'Chưa có nội dung'}</div>
                                                {session.classification && (
                                                    <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-white/50 flex items-center justify-center font-bold text-[10px]">
                                                        {session.classification}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="hidden group-hover:flex items-center justify-center h-full w-full text-gray-300">
                                                <Plus className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
