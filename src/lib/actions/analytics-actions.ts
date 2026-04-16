'use server';

import { db } from "@/lib/db";
import { StudentAnalytics, PendingAssignment, UngradedSubmission } from "@/lib/analytics/student-analytics";
import { ClassAnalytics, AtRiskStudent, RecentActivity, UpcomingDeadline } from "@/lib/analytics/class-analytics";
import { User } from "@/types";

import { auth } from "@/auth";
import { serverCache } from "@/lib/cache";
import { getClassesAction, getAssignmentsAction } from "./actions";
import { getAggregatedScheduleAction, ScheduleEvent } from "./schedule-actions";
import { startOfWeek } from "date-fns";

// --- Combined Dashboard Data (reduces round-trips) ---

export interface DashboardData {
    user: User;
    analytics: StudentAnalytics | ClassAnalytics;
    schedule: ScheduleEvent[];
    allAssignments: any[];
    allClasses: any[];
}

export async function getDashboardDataAction(): Promise<DashboardData | null> {
    const session = await auth();
    if (!session?.user?.id) return null;

    const userId = session.user.id;
    const cacheKey = `dashboard:v2:${userId}`; // V2 for new structure

    // Try cache first for the combined data (shorter TTL as it's a large object)
    const cached = serverCache.get<DashboardData>(cacheKey);
    if (cached) return cached;

    // Parallel fetch: user and other data
    const dbUserPromise = db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, avatarUrl: true }
    }).catch(err => {
        console.error("Error fetching user for dashboard:", err);
        return null;
    });

    const [dbUser, allAssignments, allClasses, scheduleData] = await Promise.all([
        dbUserPromise,
        getAssignmentsAction(),
        getClassesAction(),
        getAggregatedScheduleAction(startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString())
    ]);

    if (!dbUser) return null;

    const user: User = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role as 'teacher' | 'student',
        avatarUrl: dbUser.avatarUrl || undefined
    };

    // Get analytics based on role (already cached internally)
    const analytics = user.role === 'student'
        ? await getStudentDashboardAnalyticsAction()
        : await getTeacherDashboardAnalyticsAction();

    const result: DashboardData = {
        user,
        analytics,
        schedule: scheduleData.events,
        allAssignments,
        allClasses
    };

    // Cache combined result for 30 seconds
    serverCache.set(cacheKey, result, 30 * 1000);

    return result;
}

// --- Student Analytics ---

export async function getStudentDashboardAnalyticsAction(): Promise<StudentAnalytics> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const userId = session.user.id;

    // Cache for 60 seconds
    const cacheKey = `analytics:student:${userId}`;
    const cached = serverCache.get<StudentAnalytics>(cacheKey);
    if (cached) return cached;

    // Parallel fetch: user, enrollments
    const [user, enrollments] = await Promise.all([
        db.user.findUnique({ where: { id: userId } }),
        db.classEnrollment.findMany({
            where: { userId },
            select: { classId: true }
        })
    ]);

    if (!user) throw new Error("User not found");

    const classIds = enrollments.map(e => e.classId);

    // Parallel fetch: assignments, submissions, sessions, attendance, and all class submissions for average
    const [allAssignments, submissions, sessions, attendanceRecords, allClassSubmissions] = await Promise.all([
        db.assignment.findMany({
            where: {
                OR: [
                    { assignmentClasses: { some: { classId: { in: classIds } } } }
                ]
            },
            include: { assignmentClasses: { include: { class: true } } }
        }),
        db.submission.findMany({
            where: { studentId: userId }
        }),
        db.classSession.findMany({
            where: { classId: { in: classIds } }
        }),
        db.attendanceRecord.findMany({
            where: { studentId: userId }
        }),
        db.submission.findMany({
            where: {
                assignment: {
                    assignmentClasses: {
                        some: { classId: { in: classIds } }
                    }
                },
                score: { not: null }
            },
            select: { score: true }
        })
    ]);

    // Calculate class average score
    const classAverageScore = allClassSubmissions.length > 0
        ? allClassSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / allClassSubmissions.length
        : 8.0; // Default if no data

    // Calculate Attendance Rate
    // For each class, we count sessions that happened after the student joined
    // But for now, let's keep it simple: total present / total sessions across all their classes
    const totalSessions = sessions.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const myAttendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;

    // Calculate Stats
    const gradedSubmissions = submissions.filter(s => s.score !== null);
    const myAverageScore = gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length
        : 0;

    const mySubmissionRate = allAssignments.length > 0
        ? Math.round((submissions.length / allAssignments.length) * 100)
        : 100;

    const submittedAssignmentIds = new Set(submissions.map(s => s.assignmentId));
    const now = new Date();

    const pendingAssignments: PendingAssignment[] = allAssignments
        .filter(a => !submittedAssignmentIds.has(a.id) && a.status === 'open')
        .map(a => ({
            id: a.id,
            title: a.title,
            dueDate: a.dueDate,
            urgent: a.dueDate.getTime() - now.getTime() < 2 * 24 * 60 * 60 * 1000,
            maxScore: a.maxScore || 10,
            classId: a.assignmentClasses[0]?.classId || "",
            className: a.assignmentClasses[0]?.class?.name || "Lớp học",
            subject: a.assignmentClasses[0]?.class?.subject,
            color: a.assignmentClasses[0]?.class?.color
        }))
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    const ungradedSubmissions: UngradedSubmission[] = submissions
        .filter(s => s.status === 'submitted')
        .map(s => {
            const assignment = allAssignments.find(a => a.id === s.assignmentId);
            const classData = assignment?.assignmentClasses[0]?.class;
            return {
                assignmentId: s.assignmentId,
                assignmentTitle: assignment?.title || "Unknown",
                submittedAt: s.submittedAt,
                status: 'pending',
                classId: classData?.id || "",
                className: classData?.name || "Lớp học",
                subject: classData?.subject,
                color: classData?.color
            };
        });

    // Real attendance rate
    const result: StudentAnalytics = {
        myAverageScore,
        mySubmissionRate,
        myAttendanceRate,
        classAverageScore,
        aboveAverage: myAverageScore >= classAverageScore,
        pendingAssignments,
        ungradedSubmissions,
    };

    serverCache.set(cacheKey, result, 60 * 1000);
    return result;
}

// --- Teacher Analytics ---

export async function getTeacherDashboardAnalyticsAction(): Promise<ClassAnalytics> {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'teacher') throw new Error("Unauthorized");
    const teacherId = session.user.id;

    // Cache for 60 seconds
    const cacheKey = `analytics:teacher:${teacherId}`;
    const cached = serverCache.get<ClassAnalytics>(cacheKey);
    if (cached) return cached;

    // Parallel fetch all data
    const [classes, assignments, submissions, enrollments, sessions, totalAnnouncements, pendingJoins] = await Promise.all([
        db.class.findMany({
            where: { teacherId },
            include: { _count: { select: { enrollments: true } } }
        }),
        db.assignment.findMany({
            where: { teacherId },
            include: { assignmentClasses: true }
        }),
        db.submission.findMany({
            where: { assignment: { teacherId } },
            include: { student: true }
        }),
        db.classEnrollment.findMany({
            where: { class: { teacherId } },
            include: { user: true }
        }),
        db.classSession.findMany({
            where: { class: { teacherId } },
            include: { attendanceRecords: true }
        }),
        db.announcement.count({
            where: { teacherId }
        }),
        db.classEnrollment.count({
            where: {
                class: { teacherId },
                status: 'pending'
            }
        })
    ]);

    // Calculate Real Attendance for Teacher
    let totalExpectedAttendance = 0;
    let totalPresentAttendance = 0;

    sessions.forEach(session => {
        // Expected = number of students in that class at that time
        // Simplified: using current student count for that class
        const classData = classes.find(c => c.id === session.classId);
        const studentCount = classData?._count.enrollments || 0;
        totalExpectedAttendance += studentCount;

        const presentInSession = session.attendanceRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
        totalPresentAttendance += presentInSession;
    });

    const attendanceRate = totalExpectedAttendance > 0
        ? Math.round((totalPresentAttendance / totalExpectedAttendance) * 100)
        : 100;

    const classIds = classes.map(c => c.id);

    // Unique students
    const studentsMap = new Map<string, User>();
    enrollments.forEach(e => {
        studentsMap.set(e.userId, {
            id: e.user.id,
            name: e.user.name,
            email: e.user.email,
            role: e.user.role as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            avatarUrl: e.user.avatarUrl || undefined
        });
    });
    const students = Array.from(studentsMap.values());

    // Calculate Stats
    const gradedSubmissions = submissions.filter(s => s.score !== null);
    const averageScore = gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length
        : 0;

    const expectedSubmissions = assignments.length * students.length;
    const submissionRate = expectedSubmissions > 0
        ? Math.min(Math.round((submissions.length / expectedSubmissions) * 100), 100)
        : 0;

    const onTimeSubmissions = submissions.filter(s => {
        const assignment = assignments.find(a => a.id === s.assignmentId);
        if (!assignment) return false;
        return s.submittedAt <= assignment.dueDate;
    }).length;

    const completionRate = submissions.length > 0
        ? Math.round((onTimeSubmissions / submissions.length) * 100)
        : 100;

    // At Risk Students
    const atRiskStudents: AtRiskStudent[] = [];
    students.forEach(student => {
        const studentSubmissions = submissions.filter(s => s.studentId === student.id);
        const missingCount = assignments.length - studentSubmissions.length;

        if (missingCount > 3) {
            atRiskStudents.push({
                id: student.id,
                name: student.name,
                avatarUrl: student.avatarUrl || "",
                reasons: [`Thiếu ${missingCount} bài tập`],
                severity: missingCount > 5 ? 'high' : 'medium'
            });
        }
    });

    // Recent Activity
    const recentActivity: RecentActivity[] = submissions
        .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
        .slice(0, 5)
        .map(s => {
            const assignment = assignments.find(a => a.id === s.assignmentId);
            return {
                id: s.id,
                type: 'submission',
                description: `${s.student.name} đã nộp bài ${assignment?.title || ''}`,
                timestamp: s.submittedAt,
                actor: { name: s.student.name, avatarUrl: s.student.avatarUrl || "" }
            };
        });

    // Upcoming Deadlines
    const now = new Date();
    const upcomingDeadlines: UpcomingDeadline[] = assignments
        .filter(a => a.dueDate > now)
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
        .slice(0, 5)
        .map(a => ({
            assignmentId: a.id,
            title: a.title,
            dueDate: a.dueDate,
            daysUntilDue: Math.ceil((a.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            submissionCount: submissions.filter(s => s.assignmentId === a.id).length,
            totalStudents: students.length
        }));

    // Grade Distribution
    const gradeDistribution = [
        { range: '0-4', count: 0, color: 'bg-red-500' },
        { range: '4-6', count: 0, color: 'bg-orange-500' },
        { range: '6-8', count: 0, color: 'bg-yellow-500' },
        { range: '8-9', count: 0, color: 'bg-blue-500' },
        { range: '9-10', count: 0, color: 'bg-green-500' }
    ];

    gradedSubmissions.forEach(s => {
        const score = s.score || 0;
        if (score < 4) gradeDistribution[0].count++;
        else if (score < 6) gradeDistribution[1].count++;
        else if (score < 8) gradeDistribution[2].count++;
        else if (score < 9) gradeDistribution[3].count++;
        else gradeDistribution[4].count++;
    });

    const result: ClassAnalytics = {
        averageScore,
        submissionRate,
        attendanceRate, // Real value calculated above
        completionRate,
        scoreTrend: 'stable',
        submissionTrend: 'stable',
        atRiskStudents: atRiskStudents.slice(0, 5),
        totalAnnouncements,
        totalAssignments: assignments.length,
        activeStudents: students.length,
        upcomingDeadlines,
        recentActivity,
        gradeDistribution,
        ungradedCount: submissions.filter(s => s.status === 'submitted').length,
        draftCount: assignments.filter(a => a.status === 'draft').length,
        pendingCount: pendingJoins
    };

    serverCache.set(cacheKey, result, 60 * 1000);
    return result;
}
