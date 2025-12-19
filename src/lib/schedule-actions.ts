"use server";

import { db } from "@/lib/db";
import { getCurrentUserAction } from "@/lib/actions";
import { Class, Assignment, ClassSession } from "@/types";
import { addDays, startOfWeek, format, parseISO, getDay, setHours, setMinutes } from "date-fns";
import { vi } from "date-fns/locale";

export type ScheduleEventType = 'class' | 'assignment' | 'exam' | 'event';

export interface ScheduleEvent {
    id: string;
    title: string;
    description?: string;
    type: ScheduleEventType;
    start: Date;
    end: Date;
    color?: string;
    location?: string;
    classId?: string;
    className?: string;
    url?: string;
    isRecurring?: boolean; // True for class schedule
    status?: 'upcoming' | 'ongoing' | 'completed' | 'late';
}

// Helper to deterministically generate a color or grab from class
const getEventColor = (classColor?: string, type?: ScheduleEventType) => {
    if (type === 'assignment') return 'orange';
    return classColor || 'blue';
};

// Parse schedule string into event objects for a specific week
// Handles multiple formats:
// 1. "Thứ 2, 4, 6 (07:00 - 08:30)" - Multi-day with HH:MM
// 2. JSON object for extra classes: {"extra_xxx": {"dayId": "Mon", "startTime": "17:30", "endTime": "19:00"}}
const parseRecurringSchedule = (cls: any, weekStart: Date): ScheduleEvent[] => {
    const events: ScheduleEvent[] = [];
    if (!cls.schedule) return events;

    // Day name to offset mapping (weekStart is Monday = 0)
    const dayMap: Record<string, number> = {
        '2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6,
        'mon': 0, 'tue': 1, 'wed': 2, 'thu': 3, 'fri': 4, 'sat': 5, 'sun': 6
    };

    // Try parsing as JSON first (for extra class schedules)
    try {
        if (cls.schedule.startsWith('{')) {
            const jsonSchedule = JSON.parse(cls.schedule);
            for (const [key, slot] of Object.entries(jsonSchedule)) {
                const s = slot as any;
                if (s.dayId && s.startTime && s.endTime) {
                    const dayId = s.dayId.toLowerCase().slice(0, 3); // "Tue" -> "tue"
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
    } catch (e) {
        // Not JSON, continue with string parsing
    }

    // Format: "Thứ 2, 4, 6 (07:00 - 08:30)" or "Thứ 3, 5 (09:00 - 10:30)"
    // Extract days: find numbers after "Thứ" and before "("
    // Extract time: find (HH:MM - HH:MM)
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


export async function getAggregatedScheduleAction(weekStartStr?: string) {
    const user = await getCurrentUserAction();
    if (!user) return { events: [], todo: [] };

    const weekStart = weekStartStr ? parseISO(weekStartStr) : startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 7);

    try {
        // 1. Fetch Classes (Standard & Extra)
        // We need all classes the user is enrolled in or teaching
        let classes = [];
        if (user.role === 'teacher') {
            classes = await db.class.findMany({
                where: { teacherId: user.id },
                // assignments is not a direct relation on Class, so we don't include it. 
                // fetching default scalar fields is enough.
            });
        } else {
            const enrollments = await db.classEnrollment.findMany({
                where: { userId: user.id, status: 'active' },
                include: { class: true }
            });
            classes = enrollments.map(e => e.class);
        }

        // 2. Fetch Assignments (Deadlines)
        const classIds = classes.map(c => c.id);
        const assignments = await db.assignment.findMany({
            where: {
                // Determine logic: assignments for these classes
                OR: [
                    { teacherId: user.id }, // Created by me (teacher)
                    // Or I am a student in the class (Need relation logic, but for now simple query)
                    // The schema has assignmentClasses or checks logic. 
                    // For simplicity, we get assignments where teacherId matches (if teacher) 
                    // OR if we assume we can filter by classIds if we had that relation easily.
                    // The schema shows Assignment -> AssignmentClass pivot.
                    {
                        assignmentClasses: {
                            some: {
                                classId: { in: classIds }
                            }
                        }
                    }
                ],
                dueDate: {
                    gte: weekStart,
                    lte: weekEnd
                }
            },
            include: { assignmentClasses: { include: { class: true } } }
        });

        // 3. Normalize into Events
        let allEvents: ScheduleEvent[] = [];

        // A. Recurring Class Sessions
        classes.forEach(cls => {
            const classEvents = parseRecurringSchedule(cls, weekStart);
            allEvents = [...allEvents, ...classEvents];
        });

        // B. Assignments
        assignments.forEach(submission => {
            // Assignment deadlines are single points in time.
            // visual: create a 1-hour block ending at due date, or just a marker.
            // Let's make it a 30min block ending at due time.
            const due = new Date(submission.dueDate);
            const start = setMinutes(due, due.getMinutes() - 30);

            allEvents.push({
                id: `assign_${submission.id}`,
                title: submission.title,
                description: "Hạn nộp bài tập",
                type: 'assignment',
                start: start,
                end: due,
                color: 'orange', // fixed for assignment
                location: 'Online',
                status: 'upcoming',
                url: `/dashboard/assignments/${submission.id}`
            });
        });

        // 4. Create "Smart Agenda" List (Tasks for the week)
        // This is separate from the calendar grid events
        const todoList = assignments.map(a => ({
            id: a.id,
            title: a.title,
            deadline: a.dueDate,
            class: 'Lớp học', // ideal: a.assignmentClasses[0]?.class.name
            type: 'assignment'
        }));

        return {
            events: allEvents,
            todo: todoList
        };

    } catch (error) {
        console.error("Error fetching aggregated schedule:", error);
        return { events: [], todo: [] };
    }
}
