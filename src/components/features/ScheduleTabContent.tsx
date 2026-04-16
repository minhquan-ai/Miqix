"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { format, startOfWeek, addDays, isSameDay, setMinutes, setHours } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import { Class, User } from "@/types";
import { motion } from "framer-motion";
import { ScheduleEvent } from "@/lib/actions/schedule-actions";

interface ScheduleTabContentProps {
    classData: Class | null;
    currentUser: User | null;
    onUpdateClass: (updated: Partial<Class>) => void;
}

// Helper to parse schedule string (copied to avoid server action import issues)
const parseRecurringSchedule = (cls: any, weekStart: Date): ScheduleEvent[] => {
    const events: ScheduleEvent[] = [];
    if (!cls?.schedule) return events;

    const dayMap: Record<string, number> = {
        '2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6,
        'mon': 0, 'tue': 1, 'wed': 2, 'thu': 3, 'fri': 4, 'sat': 5, 'sun': 6
    };

    try {
        if (cls.schedule.startsWith('{')) {
            const jsonSchedule = JSON.parse(cls.schedule);
            for (const [key, slot] of Object.entries(jsonSchedule)) {
                const s = slot as any;
                if (s.dayId && s.startTime && s.endTime) {
                    const dayId = s.dayId.toLowerCase().slice(0, 3);
                    const offset = dayMap[dayId];
                    if (offset === undefined) continue;

                    const [startH, startM] = s.startTime.split(':').map(Number);
                    const [endH, endM] = s.endTime.split(':').map(Number);

                    const eventDate = addDays(weekStart, offset);
                    const startDate = setMinutes(setHours(eventDate, startH), startM || 0);
                    const endDate = setMinutes(setHours(eventDate, endH), endM || 0);

                    events.push({
                        id: `${cls.id}_${key}`,
                        title: cls.name,
                        description: s.subject || cls.subject,
                        type: 'class',
                        start: startDate,
                        end: endDate,
                        color: cls.color || 'purple',
                        location: s.room || 'Phòng học',
                        classId: cls.id,
                        className: cls.name,
                        isRecurring: true,
                        status: 'upcoming'
                    });
                }
            }
            return events;
        }
    } catch (e) { }

    const daysMatch = cls.schedule.match(/Thứ\s*([\d,\s]+)/i);
    const timeMatch = cls.schedule.match(/\((\d{1,2}):?(\d{2})?\s*[-–]\s*(\d{1,2}):?(\d{2})?\)/);

    if (daysMatch && timeMatch) {
        const days = daysMatch[1].split(',').map((d: string) => d.trim());
        const startH = parseInt(timeMatch[1]);
        const startM = parseInt(timeMatch[2] || '0');
        const endH = parseInt(timeMatch[3]);
        const endM = parseInt(timeMatch[4] || '0');

        days.forEach((dayNum: string) => {
            const offset = dayMap[dayNum];
            if (offset === undefined) return;

            const eventDate = addDays(weekStart, offset);
            const startDate = setMinutes(setHours(eventDate, startH), startM);
            const endDate = setMinutes(setHours(eventDate, endH), endM);

            events.push({
                id: `${cls.id}_day${dayNum}_${startH}`,
                title: cls.name,
                description: cls.subject,
                type: 'class',
                start: startDate,
                end: endDate,
                color: cls.color || 'blue',
                location: 'Phòng học',
                classId: cls.id,
                className: cls.name,
                isRecurring: true,
                status: 'upcoming'
            });
        });
    }

    return events;
};

export default function ScheduleTabContent({ classData, currentUser, onUpdateClass }: ScheduleTabContentProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    if (!classData) return null;
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

    const scheduleEvents = parseRecurringSchedule(classData, weekStart);

    // Check if schedule is readable text (not JSON)
    const isJsonSchedule = classData.schedule?.startsWith('{') || classData.schedule?.startsWith('[');
    const scheduleDisplayText = isJsonSchedule
        ? `${scheduleEvents.length} buổi học trong tuần`
        : (classData.schedule || "Chưa có lịch học cụ thể");

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Thời khóa biểu lớp học</h2>
                        <p className="text-gray-500 text-sm">{scheduleDisplayText}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                    {weekDays.map(day => {
                        const isToday = isSameDay(day, new Date());
                        const dayEvents = scheduleEvents.filter(e => isSameDay(e.start, day));

                        return (
                            <div key={day.toString()} className={`min-h-[120px] p-3 rounded-xl border ${isToday ? 'bg-indigo-50/50 border-indigo-200' : 'bg-gray-50/50 border-gray-100'}`}>
                                <div className="text-center mb-3">
                                    <p className={`text-xs font-semibold uppercase ${isToday ? 'text-indigo-600' : 'text-gray-500'}`}>
                                        {format(day, "EEEE", { locale: vi })}
                                    </p>
                                    <p className={`text-sm font-bold ${isToday ? 'text-indigo-700' : 'text-gray-900'}`}>
                                        {format(day, "d/MM")}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    {dayEvents.map((event, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-white p-2 rounded-lg border border-indigo-100 shadow-sm text-xs"
                                        >
                                            <div className="flex items-center gap-1 text-indigo-600 font-bold mb-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}</span>
                                            </div>
                                            {event.location && (
                                                <div className="flex items-center gap-1 text-gray-500">
                                                    <MapPin className="w-3 h-3" />
                                                    <span className="truncate">{event.location}</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
