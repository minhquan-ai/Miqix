'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createClassSessionAction(data: {
    classId: string;
    date: Date;
    period: number;
    subject?: string;
    lessonContent?: string;
    note?: string;
}) {
    const sessionToken = await auth();
    if (!sessionToken?.user?.id) return { success: false, message: "Unauthorized" };

    try {
        const session = await db.classSession.create({
            data: {
                classId: data.classId,
                teacherId: sessionToken.user.id,
                date: data.date,
                period: data.period,
                subject: data.subject,
                lessonContent: data.lessonContent,
                note: data.note,
            }
        });

        // Auto-create PRESENT records for all active students by default
        const enrollments = await db.classEnrollment.findMany({
            where: { classId: data.classId, status: 'active' },
            select: { userId: true }
        });

        if (enrollments.length > 0) {
            await db.attendanceRecord.createMany({
                data: enrollments.map(e => ({
                    sessionId: session.id,
                    studentId: e.userId,
                    status: 'PRESENT'
                }))
            });
        }

        revalidatePath(`/dashboard/classes/${data.classId}`);
        return { success: true, session };
    } catch (error) {
        console.error("Failed to create class session:", error);
        return { success: false, message: "Failed to create session" };
    }
}

export async function updateAttendanceAction(records: {
    sessionId: string;
    studentId: string;
    status: string;
    note?: string;
}[]) {
    const sessionToken = await auth();
    if (!sessionToken?.user?.id) return { success: false, message: "Unauthorized" };

    try {
        // We use a transaction to update many records
        await db.$transaction(
            records.map(record =>
                db.attendanceRecord.upsert({
                    where: {
                        sessionId_studentId: {
                            sessionId: record.sessionId,
                            studentId: record.studentId
                        }
                    },
                    update: {
                        status: record.status,
                        note: record.note
                    },
                    create: {
                        sessionId: record.sessionId,
                        studentId: record.studentId,
                        status: record.status,
                        note: record.note
                    }
                })
            )
        );

        return { success: true };
    } catch (error) {
        console.error("Failed to update attendance:", error);
        return { success: false, message: "Failed to update attendance" };
    }
}

export async function getClassSessionsAction(classId: string) {
    try {
        const sessions = await db.classSession.findMany({
            where: { classId },
            orderBy: { date: 'desc' },
            include: {
                attendanceRecords: true
            }
        });
        return sessions;
    } catch (error) {
        console.error("Failed to fetch sessions:", error);
        return [];
    }
}

export async function getStudentAttendanceStatsAction(classId: string, studentId: string) {
    try {
        const records = await db.attendanceRecord.findMany({
            where: {
                studentId,
                session: { classId }
            }
        });

        const total = records.length;
        if (total === 0) return { rate: 100, present: 0, absent: 0, late: 0, total: 0 };

        const present = records.filter(r => r.status === 'PRESENT').length;
        const absent = records.filter(r => r.status === 'ABSENT').length;
        const late = records.filter(r => r.status === 'LATE').length;
        const excused = records.filter(r => r.status === 'EXCUSED').length;

        // Rate = (Present + Late + Excused) / Total
        const rate = Math.round(((present + late + excused) / total) * 100);

        return { rate, present, absent, late, excused, total };
    } catch (error) {
        console.error("Failed to get student stats:", error);
        return { rate: 0, present: 0, absent: 0, late: 0, total: 0 };
    }
}

export async function getClassAttendanceStatsAction(classId: string) {
    try {
        const records = await db.attendanceRecord.findMany({
            where: {
                session: { classId }
            }
        });

        const total = records.length;
        if (total === 0) return { rate: 100 };

        const presentCount = records.filter(r => ['PRESENT', 'LATE', 'EXCUSED'].includes(r.status)).length;
        const rate = Math.round((presentCount / total) * 100);

        return { rate };
    } catch (error) {
        console.error("Failed to get class stats:", error);
        return { rate: 0 };
    }
}
