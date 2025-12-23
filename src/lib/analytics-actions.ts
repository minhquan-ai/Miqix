'use server';

import { db } from "@/lib/db";
import { StudentAnalytics, PendingAssignment, UngradedSubmission } from "@/lib/student-analytics";
import { ClassAnalytics, AtRiskStudent, RecentActivity, UpcomingDeadline } from "@/lib/class-analytics";
import { User } from "@/types";

import { auth } from "@/auth";

// --- Student Analytics ---

export async function getStudentDashboardAnalyticsAction(): Promise<StudentAnalytics> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const userId = session.user.id;

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    // 1. Fetch Assignments & Submissions
    // Get all classes user is enrolled in
    const enrollments = await db.classEnrollment.findMany({
        where: { userId },
        select: { classId: true }
    });
    const classIds = enrollments.map(e => e.classId);

    // Get assignments for these classes - unused in this scope
    // Removed unused assignment fetch

    // Get all assignments (even closed) for stats
    const allAssignments = await db.assignment.findMany({
        where: {
            OR: [
                { assignmentClasses: { some: { classId: { in: classIds } } } }
            ]
        },
        include: { assignmentClasses: { include: { class: true } } }
    });

    const submissions = await db.submission.findMany({
        where: { studentId: userId }
    });

    // 2. Calculate Stats

    // Average Score
    const gradedSubmissions = submissions.filter(s => s.score !== null);
    const myAverageScore = gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length
        : 0;

    // Submission Rate
    const mySubmissionRate = allAssignments.length > 0
        ? Math.round((submissions.length / allAssignments.length) * 100)
        : 100; // Default to 100 if no assignments

    // Pending Assignments
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

    // Ungraded Submissions
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

    const { getStudentAttendanceStatsAction } = await import("@/lib/attendance-actions");
    const attendanceStats = await getStudentAttendanceStatsAction(classIds[0] || "", userId);

    return {
        myAverageScore,
        mySubmissionRate,
        myAttendanceRate: attendanceStats.rate,
        classAverageScore: 7.5, // Mock
        aboveAverage: myAverageScore >= 7.5,
        pendingAssignments,
        ungradedSubmissions,
    };
}

// --- Teacher Analytics ---

export async function getTeacherDashboardAnalyticsAction(): Promise<ClassAnalytics> {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'teacher') throw new Error("Unauthorized");
    const teacherId = session.user.id;

    // 1. Fetch Data
    const classes = await db.class.findMany({
        where: { teacherId },
        include: {
            _count: { select: { enrollments: true } }
        }
    });
    const classIds = classes.map(c => c.id);

    const assignments = await db.assignment.findMany({
        where: { teacherId },
        include: { assignmentClasses: true }
    });

    // Get all submissions for these assignments
    const submissions = await db.submission.findMany({
        where: {
            assignment: { teacherId }
        },
        include: { student: true }
    });

    // Get all students
    const enrollments = await db.classEnrollment.findMany({
        where: { classId: { in: classIds } },
        include: { user: true }
    });

    // Unique students
    const studentsMap = new Map<string, User>();
    enrollments.forEach(e => {
        // Map Prisma User to our User type (simplified)
        studentsMap.set(e.userId, {
            id: e.user.id,
            name: e.user.name,
            email: e.user.email,
            role: e.user.role as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            avatarUrl: e.user.avatarUrl || undefined
        });
    });
    const students = Array.from(studentsMap.values());

    // 2. Calculate Stats

    // Average Score
    const gradedSubmissions = submissions.filter(s => s.score !== null);
    const averageScore = gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length
        : 0;

    // Submission Rate
    // Total expected = sum of (students in class * assignments in class)
    // Simplified: active assignments * total unique students (approx)
    const expectedSubmissions = assignments.length * students.length;
    const submissionRate = expectedSubmissions > 0
        ? Math.min(Math.round((submissions.length / expectedSubmissions) * 100), 100)
        : 0;

    // Completion Rate (On Time)
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
            totalStudents: students.length // Approx
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

    const { getClassAttendanceStatsAction } = await import("@/lib/attendance-actions");
    const classAttendance = await getClassAttendanceStatsAction(classIds[0] || "");

    return {
        averageScore,
        submissionRate,
        attendanceRate: classAttendance.rate,
        completionRate,
        scoreTrend: 'up',
        submissionTrend: 'stable',
        atRiskStudents: atRiskStudents.slice(0, 5),
        totalAnnouncements: 0,
        totalAssignments: assignments.length,
        activeStudents: students.length,
        upcomingDeadlines,
        recentActivity,
        gradeDistribution,
        ungradedCount: submissions.filter(s => s.status === 'submitted').length,
        draftCount: assignments.filter(a => a.status === 'draft').length,
        pendingCount: 0 // TODO: Calculate pending enrollments
    };
}
