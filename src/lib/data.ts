/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Assignment, Mission, Submission, Notification, Class, SocialEvent, User } from "@/types";

// ============================================================================
// DATA SERVICE - Deprecated, use Prisma actions instead
// ============================================================================
// This file is kept for backward compatibility
// New code should use specific action files in /lib/*-actions.ts

export const DataService = {
    // --- User ---
    getCurrentUser: async (_role?: 'teacher' | 'student'): Promise<User | null> => {
        console.warn("DataService.getCurrentUser is deprecated. Use getCurrentUserAction from @/lib/actions");
        return null;
    },

    getUserById: async (_userId: string): Promise<User | null> => {
        console.warn("DataService.getUserById is deprecated. Use Prisma directly");
        return null;
    },

    login: async (_role: 'teacher' | 'student') => {
        console.warn("DataService.login is deprecated. Use loginAction from @/lib/actions");
        return null;
    },

    // --- Classes ---
    getClasses: async (): Promise<Class[]> => {
        console.warn("DataService.getClasses is deprecated. Use getClassesAction from @/lib/class-actions");
        return [];
    },

    getStudentClasses: async (): Promise<Class[]> => {
        console.warn("DataService.getStudentClasses is deprecated. Use getClassesAction from @/lib/class-actions");
        return [];
    },

    getClassById: async (id: string): Promise<Class | null> => {
        const { getClassByIdAction } = await import("@/lib/actions");
        return await getClassByIdAction(id) as unknown as Class;
    },

    getStudentsByClassId: async (classId: string): Promise<User[]> => {
        const { getClassMembersAction } = await import("@/lib/class-member-actions");
        return await getClassMembersAction(classId) as unknown as User[];
    },

    getClassMembers: async (classId: string): Promise<User[]> => {
        const { getClassMembersAction } = await import("@/lib/class-member-actions");
        return await getClassMembersAction(classId) as unknown as User[];
    },

    getStudentSubmission: async (assignmentId: string, studentId: string) => {
        const { getStudentSubmissionAction } = await import("@/lib/actions");
        return await getStudentSubmissionAction(assignmentId, studentId) as unknown as Submission[];
    },

    getUserEnrollments: async () => {
        const { getUserEnrollmentsAction } = await import("@/lib/class-member-actions");
        return await getUserEnrollmentsAction() as unknown as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    },

    removeStudentFromClass: async (enrollmentId: string) => {
        const { removeStudentFromClassAction } = await import("@/lib/class-member-actions");
        return await removeStudentFromClassAction(enrollmentId);
    },

    createClass: async (_data: any) => {
        console.warn("DataService.createClass is deprecated. Use createClassAction from @/lib/actions");
        return { success: false, message: "Use createClassAction instead" };
    },

    updateClass: async (_id: string, _data: any) => {
        console.warn("DataService.updateClass is deprecated. Use Prisma directly");
        return { success: false };
    },

    deleteClass: async (_id: string) => {
        console.warn("DataService.deleteClass is deprecated. Use Prisma directly");
        return { success: false };
    },

    // --- Class Stats ---
    getClassStats: async (_classId: string) => {
        console.warn("DataService.getClassStats is deprecated. Use getClassStatsAction from @/lib/class-actions");
        return {
            studentCount: 0,
            activeAssignments: 0,
            totalSubmissions: 0,
            attendanceRate: 0
        };
    },

    // --- Assignments ---
    getAssignments: async (classId?: string): Promise<Assignment[]> => {
        const { getAssignmentsAction } = await import("@/lib/actions");
        return await getAssignmentsAction(classId) as unknown as Assignment[];
    },

    getAssignmentById: async (id: string): Promise<Assignment | null> => {
        const { getAssignmentByIdAction } = await import("@/lib/actions");
        return await getAssignmentByIdAction(id) as unknown as Assignment;
    },

    createAssignment: async (_data: any) => {
        console.warn("DataService.createAssignment is deprecated. Use createAssignmentAction");
        return { success: false };
    },

    updateAssignment: async (_id: string, _data: any) => {
        console.warn("DataService.updateAssignment is deprecated. Use Prisma directly");
        return { success: false };
    },

    deleteAssignment: async (_id: string) => {
        console.warn("DataService.deleteAssignment is deprecated. Use Prisma directly");
        return { success: false };
    },

    // --- Submissions ---
    getSubmissions: async (): Promise<Submission[]> => {
        console.warn("DataService.getSubmissions is deprecated. Use Prisma directly");
        return [];
    },

    getSubmissionsByAssignmentId: async (assignmentId: string): Promise<Submission[]> => {
        const { getSubmissionsByAssignmentIdAction } = await import("@/lib/actions");
        return await getSubmissionsByAssignmentIdAction(assignmentId) as unknown as Submission[];
    },

    getSubmissionById: async (_id: string): Promise<Submission | null> => {
        console.warn("DataService.getSubmissionById is deprecated. Use Prisma directly");
        return null;
    },

    submitAssignment: async (_data: any) => {
        console.warn("DataService.submitAssignment is deprecated. Use submitAssignmentAction");
        return { success: false };
    },

    gradeSubmission: async (_id: string, _score: number, _feedback?: string) => {
        console.warn("DataService.gradeSubmission is deprecated. Use gradeSubmissionAction");
        return { success: false };
    },

    // --- Missions ---
    getMissions: async (): Promise<Mission[]> => {
        console.warn("DataService.getMissions is deprecated. Use Prisma directly");
        return [];
    },

    // --- Notifications ---
    getNotifications: async (): Promise<Notification[]> => {
        console.warn("DataService.getNotifications is deprecated. Use Prisma directly");
        return [];
    },

    markNotificationAsRead: async (_id: string) => {
        console.warn("DataService.markNotificationAsRead is deprecated. Use Prisma directly");
        return { success: false };
    },

    // --- Social Events ---
    getSocialEvents: async (): Promise<SocialEvent[]> => {
        console.warn("DataService.getSocialEvents is deprecated. Use Prisma directly");
        return [];
    },

    // --- Join Class ---
    joinClass: async (_code: string) => {
        console.warn("DataService.joinClass is deprecated. Use joinClassAction from @/lib/class-actions");
        return { success: false, message: "Use joinClassAction instead" };
    },

    // --- Pin Class ---
    togglePinClass: async (_classId: string) => {
        console.warn("DataService.togglePinClass is deprecated. Use togglePinClassAction from @/lib/class-actions");
        return { success: false };
    },

    // --- Todos ---
    getTodos: async () => {
        return [];
    },

    createTodo: async (data: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        return { success: true, todo: { id: '1', ...data } };
    },

    updateTodo: async (_id: string, _data: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        return { success: true };
    },

    deleteTodo: async (_id: string) => {
        return { success: true };
    },

    // --- Analytics ---
    getStudentDashboardAnalytics: async () => {
        // Return empty analytics for now
        return {
            totalClasses: 0,
            pendingAssignments: 0,
            completedAssignments: 0,
            averageScore: null,
            streak: 0,
            recentActivity: []
        };
    },

    getTeacherDashboardAnalytics: async () => {
        // Return empty analytics with all required fields
        return {
            totalClasses: 0,
            totalStudents: 0,
            activeAssignments: 0,
            pendingGrading: 0,
            recentSubmissions: [],
            classStats: [],
            atRiskStudents: [],
            ungradedCount: 0,
            averageScore: 7.5,
            scoreTrend: 'stable' as 'up' | 'down' | 'stable',
            upcomingDeadlines: []
        };
    }
};
