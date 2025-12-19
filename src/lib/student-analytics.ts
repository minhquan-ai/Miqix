import { getClassByIdAction } from "./actions";

export interface StudentAnalytics {
    // Personal performance
    myAverageScore: number;
    mySubmissionRate: number;
    myAttendanceRate: number;


    // Comparison with class
    classAverageScore: number;
    aboveAverage: boolean;

    // Pending work
    pendingAssignments: PendingAssignment[];
    ungradedSubmissions: UngradedSubmission[];


    // Feedback
    latestFeedback?: {
        assignmentTitle: string;
        score: number;
        maxScore: number;
        feedback?: string;
        submittedAt: Date;
    };
}

export interface PendingAssignment {
    id: string;
    title: string;
    dueDate: Date;
    urgent: boolean;  // Due in < 2 days
    maxScore: number;
    classId: string;
    className?: string; // Added for Netflix view
    subject?: string;
    color?: string;
}

export interface UngradedSubmission {
    assignmentId: string;
    assignmentTitle: string;
    submittedAt: Date;
    status: 'pending' | 'graded';
    classId: string;
    className?: string;
    subject?: string;
    color?: string;
}

/**
 * Calculate personal analytics for a student
 */
export async function getStudentAnalytics(
    classId: string,
    studentId: string
): Promise<StudentAnalytics> {
    const { getStudentAnalyticsDataAction } = await import('@/lib/actions');

    // Fetch data efficiently
    const data = await getStudentAnalyticsDataAction(classId, studentId);

    if (!data || !data.classData) {
        throw new Error("Class not found");
    }

    const { assignments, students, allSubmissions } = data;

    // Get student's submissions from assignments (nested include)
    // Note: assignments.submissions only contains submissions for THIS student due to the filter in action
    const mySubmissions = assignments.flatMap((a: any) => a.submissions || []);

    // Calculate personal average score
    const gradedSubmissions = mySubmissions.filter((s: any) => s.score !== null && s.score !== undefined);
    const myAverageScore = gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / gradedSubmissions.length
        : 0;

    // Calculate submission rate
    const expectedSubmissions = assignments.length;
    const mySubmissionRate = expectedSubmissions > 0
        ? Math.round((mySubmissions.length / expectedSubmissions) * 100)
        : 100;

    // Fetch real attendance data for this student
    const { getStudentAttendanceStatsAction } = await import('@/lib/actions');
    const attendanceStats = await getStudentAttendanceStatsAction(classId, studentId);
    const myAttendanceRate = attendanceStats.attendanceRate;

    // Calculate class average for comparison
    // allSubmissions contains ALL submissions for the class assignments
    const allGradedSubmissions = allSubmissions.filter((s: any) => s.score !== null && s.score !== undefined);
    const classAverageScore = allGradedSubmissions.length > 0
        ? allGradedSubmissions.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / allGradedSubmissions.length
        : 0;


    // Find pending assignments (not submitted yet)
    const submittedAssignmentIds = new Set(mySubmissions.map((s: any) => s.assignmentId));
    const now = new Date();
    const pendingAssignments: PendingAssignment[] = assignments
        .filter((a: any) => !submittedAssignmentIds.has(a.id))
        .map((a: any) => ({
            id: a.id,
            title: a.title,
            dueDate: new Date(a.dueDate),
            urgent: new Date(a.dueDate).getTime() - now.getTime() < 2 * 24 * 60 * 60 * 1000,
            maxScore: a.maxScore || 10,
            classId: classId // Use the classId passed to the function
        }))
        .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    // Find ungraded submissions
    const ungradedSubmissions: UngradedSubmission[] = mySubmissions
        .filter((s: any) => s.status === 'submitted')
        .map((s: any) => {
            const assignment = assignments.find((a: any) => a.id === s.assignmentId);
            return {
                assignmentId: s.assignmentId,
                assignmentTitle: assignment?.title || "Unknown",
                submittedAt: new Date(s.submittedAt),
                status: 'pending' as const,
                classId: classId
            };
        });




    // Get latest feedback
    const latestGraded = gradedSubmissions.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
    const latestFeedback = latestGraded ? {
        assignmentTitle: assignments.find((a: any) => a.id === latestGraded.assignmentId)?.title || "Unknown Assignment",
        score: latestGraded.score || 0,
        maxScore: 10, // Assuming 10 is max
        feedback: latestGraded.feedback,
        submittedAt: new Date(latestGraded.submittedAt)
    } : undefined;

    return {
        myAverageScore,
        mySubmissionRate,
        myAttendanceRate,
        classAverageScore,
        aboveAverage: myAverageScore >= classAverageScore,
        pendingAssignments,
        ungradedSubmissions,
        latestFeedback
    };
}
