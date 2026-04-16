"use server";

import { db } from "@/lib/db";
import { getCurrentUserAction } from "./actions";
import { startOfWeek, endOfWeek, startOfDay, endOfDay, subDays, format } from "date-fns";
import { vi } from "date-fns/locale";

interface CreateFocusSessionInput {
    duration: number; // in seconds
    type: string;
    subject?: string;
    goal?: string;
    isCompleted?: boolean;
}

// Create a new focus session
export async function createFocusSessionAction(input: CreateFocusSessionInput) {
    const user = await getCurrentUserAction();
    if (!user) throw new Error("Unauthorized");

    const session = await db.focusSession.create({
        data: {
            userId: user.id,
            duration: input.duration,
            type: input.type,
            subject: input.subject || null,
            goal: input.goal || null,
            isCompleted: input.isCompleted ?? true,
            completedAt: new Date(),
        },
    });

    return session;
}

// Get focus sessions for current week
export async function getWeeklyFocusSessionsAction() {
    const user = await getCurrentUserAction();
    if (!user) return { sessions: [], stats: null };

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    const sessions = await db.focusSession.findMany({
        where: {
            userId: user.id,
            completedAt: {
                gte: weekStart,
                lte: weekEnd,
            },
        },
        orderBy: { completedAt: "desc" },
    });

    // Calculate stats
    const totalSeconds = sessions.reduce((acc, s) => acc + s.duration, 0);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const sessionCount = sessions.length;

    // Group by subject
    const bySubject: Record<string, number> = {};
    sessions.forEach(s => {
        const key = s.subject || "Không xác định";
        bySubject[key] = (bySubject[key] || 0) + s.duration;
    });

    // Group by type
    const byType: Record<string, number> = {};
    sessions.forEach(s => {
        byType[s.type] = (byType[s.type] || 0) + s.duration;
    });

    // Group by day
    const byDay: Record<string, number> = {};
    sessions.forEach(s => {
        const dayKey = format(s.completedAt, "EEEE", { locale: vi });
        byDay[dayKey] = (byDay[dayKey] || 0) + s.duration;
    });

    return {
        sessions,
        stats: {
            totalSeconds,
            totalMinutes,
            totalHours,
            sessionCount,
            bySubject,
            byType,
            byDay,
            averageSessionMinutes: sessionCount > 0 ? Math.floor(totalMinutes / sessionCount) : 0,
        },
    };
}

// Get focus stats for today
export async function getTodayFocusStatsAction() {
    const user = await getCurrentUserAction();
    if (!user) return null;

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const sessions = await db.focusSession.findMany({
        where: {
            userId: user.id,
            completedAt: {
                gte: todayStart,
                lte: todayEnd,
            },
        },
    });

    const totalSeconds = sessions.reduce((acc, s) => acc + s.duration, 0);
    const totalMinutes = Math.floor(totalSeconds / 60);

    return {
        totalMinutes,
        sessionCount: sessions.length,
        sessions,
    };
}

// Get comparison with last week
export async function getFocusComparisonAction() {
    const user = await getCurrentUserAction();
    if (!user) return null;

    const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const lastWeekStart = subDays(thisWeekStart, 7);
    const lastWeekEnd = subDays(thisWeekStart, 1);

    const [thisWeekSessions, lastWeekSessions] = await Promise.all([
        db.focusSession.findMany({
            where: {
                userId: user.id,
                completedAt: { gte: thisWeekStart },
            },
        }),
        db.focusSession.findMany({
            where: {
                userId: user.id,
                completedAt: {
                    gte: lastWeekStart,
                    lte: lastWeekEnd,
                },
            },
        }),
    ]);

    const thisWeekMinutes = Math.floor(thisWeekSessions.reduce((acc, s) => acc + s.duration, 0) / 60);
    const lastWeekMinutes = Math.floor(lastWeekSessions.reduce((acc, s) => acc + s.duration, 0) / 60);
    const difference = thisWeekMinutes - lastWeekMinutes;
    const percentChange = lastWeekMinutes > 0 ? Math.round((difference / lastWeekMinutes) * 100) : 0;

    return {
        thisWeekMinutes,
        lastWeekMinutes,
        difference,
        percentChange,
        trend: difference > 0 ? "up" : difference < 0 ? "down" : "same",
    };
}

// Get streak (days in a row with at least 1 focus session)
export async function getFocusStreakAction() {
    const user = await getCurrentUserAction();
    if (!user) return 0;

    let streak = 0;
    let currentDate = new Date();

    // Check up to 30 days back
    for (let i = 0; i < 30; i++) {
        const dayStart = startOfDay(currentDate);
        const dayEnd = endOfDay(currentDate);

        const session = await db.focusSession.findFirst({
            where: {
                userId: user.id,
                completedAt: {
                    gte: dayStart,
                    lte: dayEnd,
                },
            },
        });

        if (session) {
            streak++;
            currentDate = subDays(currentDate, 1);
        } else {
            break;
        }
    }

    return streak;
}
