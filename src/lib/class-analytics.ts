// Class Analytics Service - Rule-based analytics for class dashboard

export interface ClassAnalytics {
    // Performance metrics
    averageScore: number;           // 0-10
    submissionRate: number;         // 0-100%
    attendanceRate: number;         // 0-100%
    completionRate: number;         // 0-100% (assignments completed on time)

    // Trends (comparison to previous period)
    scoreTrend: 'up' | 'down' | 'stable';
    submissionTrend: 'up' | 'down' | 'stable';

    // At-risk students
    atRiskStudents: AtRiskStudent[];

    // Activity stats
    totalAnnouncements: number;
    totalAssignments: number;
    activeStudents: number;  // Students active in last 7 days

    // Upcoming
    upcomingDeadlines: UpcomingDeadline[];

    // Recent activity
    recentActivity: RecentActivity[];

    // Grade Distribution
    gradeDistribution: { range: string; count: number; color: string }[];

    // Counts for Todo List
    ungradedCount: number;
    draftCount: number;
    pendingCount: number;
}

export interface AtRiskStudent {
    id: string;
    name: string;
    avatarUrl: string;
    reasons: string[];  // ["3 bài chưa nộp", "Điểm TB: 4.2"]
    severity: 'high' | 'medium' | 'low';
}

export interface UpcomingDeadline {
    assignmentId: string;
    title: string;
    dueDate: Date;
    daysUntilDue: number;
    submissionCount: number;
    totalStudents: number;
}

export interface RecentActivity {
    id: string;
    type: 'announcement' | 'submission' | 'comment' | 'grade';
    description: string;
    timestamp: Date;
    actor?: {
        name: string;
        avatarUrl: string;
    };
}

/**
 * Calculate comprehensive analytics for a class
 * Uses rule-based logic (no AI required)
 */
export async function getClassAnalytics(classId: string): Promise<ClassAnalytics> {
    const { getClassAnalyticsDataAction } = await import('@/lib/actions');

    // Fetch all data efficiently using server action
    const data = await getClassAnalyticsDataAction(classId);
    const { getAttendanceStatsAction, getPendingEnrollmentsAction } = await import('@/lib/actions');
    const attendanceStats = await getAttendanceStatsAction(classId);
    const pendingEnrollments = await getPendingEnrollmentsAction(classId);

    if (!data || !data.classData) {
        throw new Error(`Class ${classId} not found`);
    }

    const { assignments, students, announcements, classData } = data;

    // Log for debugging
    console.log('[ClassAnalytics] Students data:', {
        count: students.length,
        sample: students[0],
        hasUserId: students[0]?.id
    });

    // Extract submissions from assignments
    const classSubmissions = assignments.flatMap((a: any) => a.submissions || []);

    // Handle both formats: direct user objects or enrollment objects with user property
    const studentUsers = students.map((s: any) => ({
        ...s,
        userId: s.userId || s.id,  // Support both formats
        name: s.name,
        avatarUrl: s.avatarUrl
    }));

    // Calculate trends by comparing current week vs previous week
    const { scoreTrend, submissionTrend } = calculateTrends(classSubmissions, assignments, studentUsers);

    // Calculate metrics
    const metrics = {
        // Performance
        averageScore: calculateAverageScore(classSubmissions),
        submissionRate: calculateSubmissionRate(assignments, classSubmissions, studentUsers),
        attendanceRate: attendanceStats.attendanceRate,
        completionRate: calculateCompletionRate(assignments, classSubmissions, studentUsers),

        // Trends (calculated from real data)
        scoreTrend,
        submissionTrend,

        // At-risk students
        atRiskStudents: identifyAtRiskStudents(studentUsers, assignments, classSubmissions),

        // Activity
        totalAnnouncements: announcements.length,
        totalAssignments: assignments.length,
        activeStudents: studentUsers.length,  // Use mapped student users count

        // Upcoming
        upcomingDeadlines: getUpcomingDeadlines(assignments, classSubmissions, studentUsers),

        // Recent activity
        recentActivity: getRecentActivity(announcements, classSubmissions, studentUsers),

        // Grade Distribution
        gradeDistribution: calculateGradeDistribution(classSubmissions),

        // Counts
        ungradedCount: classSubmissions.filter(s => s.status === 'submitted').length,
        draftCount: assignments.filter(a => a.status === 'draft').length,
        pendingCount: pendingEnrollments.length
    };

    console.log('[ClassAnalytics] Calculated metrics:', {
        activeStudents: metrics.activeStudents,
        totalAssignments: metrics.totalAssignments
    });

    return metrics;
}

/**
 * Calculate score and submission trends by comparing periods
 * Compares current week vs previous week
 */
function calculateTrends(
    submissions: any[],
    assignments: any[],
    students: any[]
): { scoreTrend: 'up' | 'down' | 'stable'; submissionTrend: 'up' | 'down' | 'stable' } {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get submissions from current week vs previous week
    const currentWeekSubmissions = submissions.filter(s => {
        const date = new Date(s.submittedAt || s.createdAt);
        return date >= oneWeekAgo && date <= now;
    });

    const previousWeekSubmissions = submissions.filter(s => {
        const date = new Date(s.submittedAt || s.createdAt);
        return date >= twoWeeksAgo && date < oneWeekAgo;
    });

    // Calculate score trend
    const currentGraded = currentWeekSubmissions.filter(s => s.score !== null && s.score !== undefined);
    const previousGraded = previousWeekSubmissions.filter(s => s.score !== null && s.score !== undefined);

    const currentAvgScore = currentGraded.length > 0
        ? currentGraded.reduce((sum, s) => sum + (s.score || 0), 0) / currentGraded.length
        : 0;

    const previousAvgScore = previousGraded.length > 0
        ? previousGraded.reduce((sum, s) => sum + (s.score || 0), 0) / previousGraded.length
        : 0;

    // Determine score trend (5% threshold for change)
    let scoreTrend: 'up' | 'down' | 'stable' = 'stable';
    if (previousAvgScore > 0) {
        const scoreChange = ((currentAvgScore - previousAvgScore) / previousAvgScore) * 100;
        if (scoreChange >= 5) scoreTrend = 'up';
        else if (scoreChange <= -5) scoreTrend = 'down';
    } else if (currentAvgScore > 0 && previousAvgScore === 0) {
        scoreTrend = 'up'; // Started getting submissions
    }

    // Calculate submission trend
    let submissionTrend: 'up' | 'down' | 'stable' = 'stable';
    if (previousWeekSubmissions.length > 0) {
        const submissionChange = ((currentWeekSubmissions.length - previousWeekSubmissions.length) / previousWeekSubmissions.length) * 100;
        if (submissionChange >= 10) submissionTrend = 'up';
        else if (submissionChange <= -10) submissionTrend = 'down';
    } else if (currentWeekSubmissions.length > 0 && previousWeekSubmissions.length === 0) {
        submissionTrend = 'up';
    }

    return { scoreTrend, submissionTrend };
}

/**
 * Calculate average score from graded submissions
 */
function calculateAverageScore(submissions: any[]): number {
    const gradedSubmissions = submissions.filter(s => s.score !== null && s.score !== undefined);

    if (gradedSubmissions.length === 0) return 0;

    const totalScore = gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0);
    return Math.round((totalScore / gradedSubmissions.length) * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate submission rate (% of expected submissions received)
 */
function calculateSubmissionRate(assignments: any[], submissions: any[], students: any[]): number {
    if (assignments.length === 0 || students.length === 0) return 100;

    const expectedSubmissions = assignments.length * students.length;
    const actualSubmissions = submissions.length;

    return Math.round((actualSubmissions / expectedSubmissions) * 100);
}

/**
 * Calculate completion rate (% of assignments completed on time)
 */
function calculateCompletionRate(assignments: any[], submissions: any[], students: any[]): number {
    if (assignments.length === 0 || students.length === 0) return 100;

    const now = new Date();
    const pastAssignments = assignments.filter(a => new Date(a.dueDate) < now);

    if (pastAssignments.length === 0) return 100;

    const expectedSubmissions = pastAssignments.length * students.length;
    const onTimeSubmissions = submissions.filter(s => {
        const assignment = assignments.find(a => a.id === s.assignmentId);
        if (!assignment) return false;
        return new Date(s.submittedAt) <= new Date(assignment.dueDate);
    }).length;

    return Math.round((onTimeSubmissions / expectedSubmissions) * 100);
}

/**
 * Identify at-risk students using rule-based logic
 */
function identifyAtRiskStudents(
    students: any[],
    assignments: any[],
    submissions: any[]
): AtRiskStudent[] {
    const atRisk: AtRiskStudent[] = [];

    for (const student of students) {
        const studentSubmissions = submissions.filter(s => s.studentId === student.userId);
        const reasons: string[] = [];

        // Rule 1: Missing assignments (3+)
        const missingCount = assignments.length - studentSubmissions.length;
        if (missingCount >= 3) {
            reasons.push(`${missingCount} bài chưa nộp`);
        }

        // Rule 2: Low average score (< 5)
        const gradedSubmissions = studentSubmissions.filter(s => s.score !== null);
        if (gradedSubmissions.length > 0) {
            const avg = gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length;
            if (avg < 5) {
                reasons.push(`Điểm TB thấp: ${avg.toFixed(1)}`);
            }
        }

        // Rule 3: Late submissions (50%+)
        const lateSubmissions = studentSubmissions.filter(s => {
            const assignment = assignments.find(a => a.id === s.assignmentId);
            if (!assignment) return false;
            return new Date(s.submittedAt) > new Date(assignment.dueDate);
        });

        if (studentSubmissions.length > 0) {
            const lateRate = lateSubmissions.length / studentSubmissions.length;
            if (lateRate >= 0.5) {
                reasons.push(`Nộp trễ ${Math.round(lateRate * 100)}% bài`);
            }
        }

        // Add to at-risk list if any reasons
        if (reasons.length > 0) {
            atRisk.push({
                id: student.userId,
                name: student.name,
                avatarUrl: student.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`,
                reasons,
                severity: reasons.length >= 2 ? 'high' : 'medium'
            });
        }
    }

    // Sort by severity (high first)
    return atRisk.sort((a, b) => {
        if (a.severity === 'high' && b.severity !== 'high') return -1;
        if (a.severity !== 'high' && b.severity === 'high') return 1;
        return b.reasons.length - a.reasons.length;
    });
}

/**
 * Get assignments due in the next 7 days
 */
function getUpcomingDeadlines(
    assignments: any[],
    submissions: any[],
    students: any[]
): UpcomingDeadline[] {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcoming = assignments
        .filter(a => {
            const dueDate = new Date(a.dueDate);
            return dueDate > now && dueDate <= sevenDaysLater;
        })
        .map(a => {
            const dueDate = new Date(a.dueDate);
            const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
            const submissionCount = submissions.filter(s => s.assignmentId === a.id).length;

            return {
                assignmentId: a.id,
                title: a.title,
                dueDate,
                daysUntilDue,
                submissionCount,
                totalStudents: students.length
            };
        })
        .sort((a, b) => a.daysUntilDue - b.daysUntilDue); // Soonest first

    return upcoming;
}

/**
 * Get recent activity (last 10 items)
 */
function getRecentActivity(
    announcements: any[],
    submissions: any[],
    students: any[]
): RecentActivity[] {
    const activities: RecentActivity[] = [];

    // Add announcements
    announcements.forEach(a => {
        activities.push({
            id: `announcement-${a.id}`,
            type: 'announcement',
            description: `Đã đăng thông báo: "${a.title || a.content.slice(0, 50)}"`,
            timestamp: new Date(a.createdAt)
        });
    });

    // Add recent submissions
    submissions
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, 10)
        .forEach(s => {
            const student = students.find(st => st.userId === s.studentId);
            if (student) {
                activities.push({
                    id: `submission-${s.id}`,
                    type: 'submission',
                    description: `${student.name} đã nộp bài`,
                    timestamp: new Date(s.submittedAt),
                    actor: {
                        name: student.name,
                        avatarUrl: student.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`
                    }
                });
            }
        });

    // Sort by timestamp (newest first) and limit to 10
    return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);
}

/**
 * Calculate grade distribution
 */
function calculateGradeDistribution(submissions: any[]): { range: string; count: number; color: string }[] {
    const graded = submissions.filter(s => s.score !== null && s.score !== undefined);
    const distribution = [
        { range: '0-4', count: 0, color: 'bg-red-500' },
        { range: '4-6', count: 0, color: 'bg-orange-500' },
        { range: '6-8', count: 0, color: 'bg-yellow-500' },
        { range: '8-9', count: 0, color: 'bg-blue-500' },
        { range: '9-10', count: 0, color: 'bg-green-500' }
    ];

    graded.forEach(s => {
        const score = s.score || 0;
        if (score < 4) distribution[0].count++;
        else if (score < 6) distribution[1].count++;
        else if (score < 8) distribution[2].count++;
        else if (score < 9) distribution[3].count++;
        else distribution[4].count++;
    });

    return distribution;
}
