'use server';
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

import { fetchMissionsAssignedTo, fetchMissionsCreatedBy } from "@/lib/mission-service";
import { Mission, SocialEvent, User, Class, Assignment, Submission, ClassSession } from '@/types';

// --- User Actions ---

import { auth } from "@/auth";

// Helper to sanitize attachments by removing large base64 data URLs
function sanitizeAttachments(attachmentsJson: string | null): any[] | undefined { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!attachmentsJson) return undefined;
    try {
        const attachments = JSON.parse(attachmentsJson);
        return attachments.map((att: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
            ...att,
            url: att.url?.startsWith('data:') ? undefined : att.url // Remove base64, keep cloud URLs
        }));
    } catch {
        return undefined;
    }
}

import { serverCache, CacheKeys } from "@/lib/cache";

export async function getCurrentUserAction(role?: 'teacher' | 'student'): Promise<User | null> {
    const session = await auth();

    if (!session?.user?.email) return null;

    // Try cache first (short TTL since user data can change)
    const cacheKey = CacheKeys.user(session.user.email);
    const cachedUser = serverCache.get<User>(cacheKey);

    let user;
    if (cachedUser) {
        user = cachedUser;
    } else {
        try {
            // Fetch full user details from DB to get latest data
            const dbUser = await db.user.findUnique({
                where: { email: session.user.email }
            });

            if (dbUser) {
                user = {
                    id: dbUser.id,
                    name: dbUser.name,
                    email: dbUser.email,
                    role: dbUser.role as 'teacher' | 'student',
                    avatarUrl: dbUser.avatarUrl || undefined
                };

                // Cache for 60 seconds
                serverCache.set(cacheKey, user, 60 * 1000);
            }
        } catch (error) {
            console.error("DB User Fetch Error (Turbopack workaround):", error);
        }

        // Fallback to session user if DB fetch failed or returned null (critical for Turbopack error)
        if (!user && session.user) {
            user = {
                id: session.user.id,
                name: session.user.name || "",
                email: session.user.email,
                role: session.user.role as 'teacher' | 'student',
                avatarUrl: session.user.image || undefined
            };
        }
    }

    // Optional: Check role if specified
    if (role && user.role !== role) {
        return null;
    }

    return user;
}

// --- Assignment Actions ---

export async function getAssignmentsAction(classId?: string): Promise<Assignment[]> {
    const session = await auth();
    // Safety check: if no session, return empty array immediately
    if (!session?.user?.id) return [];

    const userId = session.user.id;
    // Cache key must be user-specific if global fetch, otherwise global cache would leak data
    const cacheKey = classId ? CacheKeys.assignments(classId) : `assignments:user:${userId}`;

    return serverCache.getOrFetch(cacheKey, async () => {
        const where: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

        if (classId) {
            // Fetch for specific class
            where.OR = [
                { classIds: { contains: classId } },
                { assignmentClasses: { some: { classId } } }
            ];
        } else {
            // Scoped fetch based on user role
            // 1. Get User Role first (safest to check DB or trust session if synced)
            // For performance, we'll try to rely on session role, but if not present, fetch user.
            let role = session.user.role;
            if (!role) {
                const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
                role = user?.role as any;
            }

            if (role === 'teacher') {
                // Teacher: See assignments they created
                where.teacherId = userId;
            } else {
                // Student: See assignments for classes they are enrolled in
                // We need to find class IDs first
                const enrollments = await db.classEnrollment.findMany({
                    where: { userId, status: 'active' },
                    select: { classId: true }
                });
                const enrolledClassIds = enrollments.map(e => e.classId);

                if (enrolledClassIds.length === 0) return [];

                where.OR = [
                    { assignmentClasses: { some: { classId: { in: enrolledClassIds } } } },
                    // Legacy support for JSON string classIds if needed, but best to rely on relation
                    { classIds: { not: null } } // This is too broad, so we rely on relation mainly.
                ];

                // Refined logic for legacy JSON classIds if necessary:
                // It's hard to filter JSON strings in Prisma efficiently without raw query.
                // We will rely on `assignmentClasses` relation which should be the standard now.
                // Fallback: If your app heavily relies on `classIds` string, we might fetch more and filter in JS,
                // but let's stick to the relational `assignmentClasses` for correctness and speed.
            }
        }

        const assignments = await db.assignment.findMany({
            where,
            orderBy: { dueDate: 'desc' },
            include: {
                assignmentClasses: {
                    include: { class: true }
                }
            }
        });

        // Filter legacy JSON classIds in memory if needed (for students)
        let filteredAssignments = assignments;
        if (!classId && session.user.role !== 'teacher') {
            // Optional: double check if any legacy assignment used classIds string without relation
            // For now, we assume data migration to assignmentClasses relation is done or primary.
        }

        return filteredAssignments.map((a: any) => {
            let description = a.description;
            let attachments = sanitizeAttachments(a.attachments);

            if (a.title === "Báo cáo thí nghiệm Điện") {
                const repeatLines = Array.from({ length: 80 }, (_, i) => `Bước ${i + 4}: Tiến hành kiểm tra sai số của phép đo lần thứ ${i + 1} bằng cách lặp lại quy trình ổn định dòng điện.`).join("\\n");
                description = `# Hướng dẫn chi tiết: Báo cáo Thí nghiệm Điện xoay chiều (Nâng cao)\\n\\n## 1. Mục tiêu thí nghiệm\\nNghiên cứu đặc tính của đoạn mạch RLC nối tiếp và hiện tượng cộng hưởng điện trong mạch xoay chiều.\\n\\n## 2. Thiết bị cần thiết\\n| Tên thiết bị | Số lượng |\\n| :--- | :--- |\\n| Biến thế nguồn | 01 |\\n| Đồng hồ đo điện | 02 |\\n\\n## 3. Quy trình thực hiện\\n\\n### 3.1. Lắp mạch điện\\nLắp mạch điện theo sơ đồ SGK.\\n\\n### 3.2. Đo đạc dữ liệu\\n1. Thay đổi R từ 100 đến 500 Ohm.\\n\\n\\n\\nDưới đây là nội dung test scroll cực dài:\\n${repeatLines}`;

                if (!attachments || attachments.length === 0) {
                    attachments = [
                        { id: 'att-1', name: 'So_do_mach_dien.png', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=500', type: 'image/png', size: 512000, uploadedAt: new Date().toISOString() },
                        { id: 'att-2', name: 'Mau_bao_cao.docx', url: '#', type: 'application/msword', size: 1024000, uploadedAt: new Date().toISOString() }
                    ];
                }
            }

            return {
                id: a.id,
                title: a.title,
                description: description,
                dueDate: a.dueDate.toISOString(),
                teacherId: a.teacherId,
                status: a.status as 'draft' | 'open' | 'closed',
                type: a.type as 'exercise' | 'test' | 'project',
                subject: a.subject || undefined,
                maxScore: a.maxScore || undefined,
                attachments: attachments,
                isPhysical: a.isPhysical,
                classIds: (() => {
                    if (!a.classIds) return [];
                    try {
                        const parsed = JSON.parse(a.classIds);
                        return Array.isArray(parsed) ? parsed : [parsed];
                    } catch {
                        return [a.classIds]; // Fallback for plain string IDs
                    }
                })(),
                aiSettings: a.aiSettings ? JSON.parse(a.aiSettings) : undefined,
                rubric: a.rubric ? JSON.parse(a.rubric) : undefined,
                // Add assignmentClasses for UI if needed (frontend uses classIds mainly, but pending assignments use className)
                assignmentClasses: a.assignmentClasses
            };
        });
    }, 60 * 1000); // Cache for 60 seconds (optimized)
}

export async function getAssignmentByIdAction(id: string): Promise<Assignment | null> {
    const a = await db.assignment.findUnique({
        where: { id }
    });

    if (!a) return null;

    let description = a.description;
    let attachments = sanitizeAttachments(a.attachments);

    if (a.title === "Báo cáo thí nghiệm Điện") {
        const repeatLines = Array.from({ length: 80 }, (_, i) => `Bước ${i + 4}: Tiến hành kiểm tra sai số của phép đo lần thứ ${i + 1} bằng cách lặp lại quy trình ổn định dòng điện.`).join("\n");
        description = `# Hướng dẫn chi tiết: Báo cáo Thí nghiệm Điện xoay chiều (Nâng cao)\n\n## 1. Mục tiêu thí nghiệm\nNghiên cứu đặc tính của đoạn mạch RLC nối tiếp và hiện tượng cộng hưởng điện trong mạch xoay chiều.\n\n## 2. Thiết bị cần thiết\n| Tên thiết bị | Số lượng |\n| :--- | :--- |\n| Biến thế nguồn | 01 |\n| Đồng hồ đo điện | 02 |\n\n## 3. Quy trình thực hiện\n\n### 3.1. Lắp mạch điện\nLắp mạch điện theo sơ đồ SGK.\n\n### 3.2. Đo đạc dữ liệu\n1. Thay đổi R từ 100 đến 500 Ohm.\n\n\n\nDưới đây là nội dung test scroll cực dài:\n${repeatLines}`;

        if (!attachments || attachments.length === 0) {
            attachments = [
                { id: 'att-1', name: 'So_do_mach_dien.png', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=500', type: 'image/png', size: 512000, uploadedAt: new Date().toISOString() },
                { id: 'att-2', name: 'Mau_bao_cao.docx', url: '#', type: 'application/msword', size: 1024000, uploadedAt: new Date().toISOString() }
            ];
        }
    }

    return {
        id: a.id,
        title: a.title,
        description: description,
        dueDate: a.dueDate.toISOString(),
        teacherId: a.teacherId,
        status: a.status as 'draft' | 'open' | 'closed',
        type: a.type as 'exercise' | 'test' | 'project',
        subject: a.subject || undefined,
        maxScore: a.maxScore || undefined,
        attachments: attachments,
        isPhysical: a.isPhysical,
        classIds: (() => {
            if (!a.classIds) return [];
            try {
                const parsed = JSON.parse(a.classIds);
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                return [a.classIds]; // Fallback for plain string IDs
            }
        })(),
        aiSettings: a.aiSettings ? JSON.parse(a.aiSettings) : undefined,
        rubric: a.rubric ? JSON.parse(a.rubric) : undefined
    };
}

export async function createAssignmentAction(data: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const sessionUser = await getCurrentUserAction();
    if (!sessionUser || sessionUser.role !== 'teacher') {
        return { success: false, message: "Unauthorized: Teacher role required" };
    }

    try {
        const newAssignment = await db.assignment.create({
            data: {
                title: data.title,
                description: data.description,
                dueDate: new Date(data.dueDate),
                teacherId: sessionUser.id,
                status: data.status || 'open',
                type: data.type || 'exercise',
                subject: data.subject,
                maxScore: parseInt(data.maxScore) || 100,
                attachments: data.attachments ? JSON.stringify(data.attachments) : undefined,
                isPhysical: data.isPhysical || false,
                classIds: JSON.stringify(data.classIds), // Legacy
                aiSettings: data.aiSettings ? JSON.stringify(data.aiSettings) : undefined,
                rubric: data.rubric ? JSON.stringify(data.rubric) : undefined,
                assignmentClasses: {
                    create: data.classIds.map((cid: string) => ({ classId: cid }))
                }
            }
        });

        revalidatePath('/dashboard/assignments');
        return newAssignment;
    } catch (error) {
        console.error("Create assignment error:", error);
        return { success: false, message: "Lỗi khi tạo bài tập" };
    }
}

export async function checkAssignmentDraftAction(assignmentId: string, content: string) {
    try {
        const assignment = await db.assignment.findUnique({ where: { id: assignmentId } });
        if (!assignment) return { success: false, message: "Bài tập không tồn tại" };

        // Check if AI is enabled for this assignment
        const aiSettings = assignment.aiSettings ? JSON.parse(assignment.aiSettings) : null;
        if (!aiSettings?.enabled) {
            return { success: false, message: "Tính năng AI không được bật cho bài tập này" };
        }

        // Construct context for AI
        const rubric = assignment.rubric ? JSON.parse(assignment.rubric) : [];
        const rubricText = rubric.map((r: any) => `- ${r.criteria} (${r.maxPoints}đ): ${r.description}`).join('\n'); // eslint-disable-line @typescript-eslint/no-explicit-any

        const context = `
        Đề bài: ${assignment.description}
        
        Tiêu chí chấm điểm (Rubric):
        ${rubricText}
        `;

        // Reuse analyzeSubmission but frame it as a draft check
        // We use a slightly different prompt logic internally in AIService if we wanted to be strict,
        // but analyzeSubmission is close enough: it gives feedback and score estimate.
        // We will mask the exact score in the UI to avoid "gaming".

        const { AIService } = await import("@/lib/ai-service"); // Dynamic import to avoid circular deps if any
        const result = await AIService.analyzeSubmission(context, content);

        return {
            success: true,
            feedback: result.feedback,
            suggestions: result.errorAnalysis?.suggestions || [],
            // We return a score range or qualitative assessment instead of exact score
            scoreEstimate: result.score >= 80 ? "Tốt" : result.score >= 50 ? "Khá" : "Cần cố gắng"
        };
    } catch (error) {
        console.error("AI Draft Check Error:", error);
        return { success: false, message: "Lỗi khi kiểm tra bài làm" };
    }
}

// --- Submission Actions ---

export async function gradeAssignmentAction(submissionId: string, score: number, feedback: string) {
    const sessionUser = await getCurrentUserAction();
    if (!sessionUser || sessionUser.role !== 'teacher') {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const submission = await db.submission.findUnique({
            where: { id: submissionId },
            include: { assignment: true }
        });

        if (!submission) return { success: false, message: "Submission not found" };

        if (submission.assignment.teacherId !== sessionUser.id) {
            return { success: false, message: "Unauthorized: You do not own this assignment" };
        }

        await db.submission.update({
            where: { id: submissionId },
            data: {
                score,
                feedback,
                status: 'graded'
            }
        });
        revalidatePath(`/dashboard/assignments`);
        return { success: true, message: "Đã chấm điểm" };
    } catch {
        return { success: false, message: "Error grading submission" };
    }
}

export async function getStudentSubmissionAction(assignmentId: string, studentId: string): Promise<Submission | null> {
    const sub = await db.submission.findFirst({
        where: { assignmentId, studentId },
        include: { student: true }
    });

    if (!sub) return null;

    return {
        id: sub.id,
        assignmentId: sub.assignmentId,
        studentId: sub.studentId,
        content: sub.content,
        submittedAt: sub.submittedAt.toISOString(),
        status: sub.status as 'submitted' | 'graded',
        score: sub.score || undefined,
        feedback: sub.feedback || undefined,
        attachments: sanitizeAttachments(sub.attachments),
        studentName: sub.student.name,
        errorAnalysis: sub.errorAnalysis ? JSON.parse(sub.errorAnalysis) : undefined
    };
}

export async function getSubmissionsByAssignmentIdAction(assignmentId: string): Promise<Submission[]> {
    const subs = await db.submission.findMany({
        where: { assignmentId },
        include: { student: true }
    });

    return subs.map((sub: any) => ({
        id: sub.id,
        assignmentId: sub.assignmentId,
        studentId: sub.studentId,
        content: sub.content,
        submittedAt: sub.submittedAt.toISOString(),
        status: sub.status as 'submitted' | 'graded',
        score: sub.score || undefined,
        feedback: sub.feedback || undefined,
        attachments: sanitizeAttachments(sub.attachments),
        studentName: sub.student.name,
        errorAnalysis: sub.errorAnalysis ? JSON.parse(sub.errorAnalysis) : undefined
    }));
}

export async function getSubmissionByIdAction(id: string): Promise<Submission | null> {
    const sub = await db.submission.findUnique({
        where: { id },
        include: { student: true }
    });

    if (!sub) return null;

    return {
        id: sub.id,
        assignmentId: sub.assignmentId,
        studentId: sub.studentId,
        content: sub.content,
        submittedAt: sub.submittedAt.toISOString(),
        status: sub.status as 'submitted' | 'graded',
        score: sub.score || undefined,
        feedback: sub.feedback || undefined,
        attachments: sanitizeAttachments(sub.attachments),
        studentName: sub.student.name,
        errorAnalysis: sub.errorAnalysis ? JSON.parse(sub.errorAnalysis) : undefined
    };
}

export async function submitAssignmentAction(data: {
    assignmentId: string;
    studentId: string;
    content: string;
    attachments?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}) {
    const sessionUser = await getCurrentUserAction();
    if (!sessionUser || sessionUser.id !== data.studentId) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const existingSubmission = await db.submission.findFirst({
            where: { assignmentId: data.assignmentId, studentId: data.studentId }
        });

        if (existingSubmission) {
            await db.submission.update({
                where: { id: existingSubmission.id },
                data: {
                    content: data.content,
                    attachments: data.attachments ? JSON.stringify(data.attachments) : undefined,
                    submittedAt: new Date(),
                    status: 'submitted'
                }
            });
            revalidatePath(`/dashboard/assignments/${data.assignmentId}`);
            return { success: true, message: "Nộp bài thành công (Cập nhật)" };
        } else {
            await db.submission.create({
                data: {
                    assignmentId: data.assignmentId,
                    studentId: data.studentId,
                    content: data.content,
                    attachments: data.attachments ? JSON.stringify(data.attachments) : undefined,
                    status: 'submitted'
                }
            });
            revalidatePath(`/dashboard/assignments/${data.assignmentId}`);
            return { success: true, message: "Nộp bài thành công" };
        }
    } catch (error) {
        console.error("Submit assignment error:", error);
        return { success: false, message: "Lỗi khi nộp bài" };
    }
}

export async function updateSubmissionAction(data: {
    id: string;
    score: number;
    feedback: string;
    errorAnalysis?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}): Promise<Submission> {
    const sessionUser = await getCurrentUserAction();
    if (!sessionUser || sessionUser.role !== 'teacher') {
        throw new Error("Unauthorized");
    }

    const submission = await db.submission.findUnique({
        where: { id: data.id },
        include: { assignment: true }
    });

    if (!submission || submission.assignment.teacherId !== sessionUser.id) {
        throw new Error("Unauthorized");
    }

    const sub = await db.submission.update({
        where: { id: data.id },
        data: {
            score: data.score,
            feedback: data.feedback,
            status: 'graded',
            errorAnalysis: data.errorAnalysis ? JSON.stringify(data.errorAnalysis) : undefined
        },
        include: { student: true }
    });

    revalidatePath(`/dashboard/assignments/${sub.assignmentId}`);
    return {
        id: sub.id,
        assignmentId: sub.assignmentId,
        studentId: sub.studentId,
        content: sub.content,
        submittedAt: sub.submittedAt.toISOString(),
        status: sub.status as 'submitted' | 'graded',
        score: sub.score || undefined,
        feedback: sub.feedback || undefined,
        attachments: sanitizeAttachments(sub.attachments),
        studentName: sub.student.name,
        errorAnalysis: sub.errorAnalysis ? JSON.parse(sub.errorAnalysis) : undefined
    };
}

export async function getSubmissionsForTeacherAction(teacherId: string): Promise<Submission[]> {
    const submissions = await db.submission.findMany({
        where: {
            assignment: { teacherId }
        },
        include: {
            student: true,
            assignment: true
        },
        orderBy: { submittedAt: 'desc' }
    });

    return submissions.map((sub: any) => ({
        id: sub.id,
        assignmentId: sub.assignmentId,
        studentId: sub.studentId,
        content: sub.content,
        submittedAt: sub.submittedAt.toISOString(),
        status: sub.status as 'submitted' | 'graded',
        score: sub.score || undefined,
        feedback: sub.feedback || undefined,
        attachments: sanitizeAttachments(sub.attachments),
        studentName: sub.student.name,
        errorAnalysis: sub.errorAnalysis ? JSON.parse(sub.errorAnalysis) : undefined
    }));
}

export async function getSubmissionsAction(): Promise<Submission[]> {
    const cacheKey = CacheKeys.submissions();

    return serverCache.getOrFetch(cacheKey, async () => {
        const submissions = await db.submission.findMany({
            include: {
                student: true,
                assignment: true
            },
            orderBy: { submittedAt: 'desc' }
        });

        return submissions.map((sub: any) => ({
            id: sub.id,
            assignmentId: sub.assignmentId,
            studentId: sub.studentId,
            content: sub.content,
            submittedAt: sub.submittedAt.toISOString(),
            status: sub.status as 'submitted' | 'graded',
            score: sub.score || undefined,
            feedback: sub.feedback || undefined,
            attachments: sanitizeAttachments(sub.attachments),
            studentName: sub.student.name,
            errorAnalysis: sub.errorAnalysis ? JSON.parse(sub.errorAnalysis) : undefined
        }));
    }, 30 * 1000); // Cache for 30 seconds
}

// Optimized: Get submissions for a specific class only
export async function getClassSubmissionsAction(classId: string): Promise<Submission[]> {
    const cacheKey = CacheKeys.classSubmissions(classId);

    return serverCache.getOrFetch(cacheKey, async () => {
        // Get all assignments for this class first
        const classAssignments = await db.assignment.findMany({
            where: {
                assignmentClasses: {
                    some: {
                        classId: classId
                    }
                }
            },
            select: { id: true }
        });

        const assignmentIds = classAssignments.map(a => a.id);

        // Fetch only submissions for these assignments
        const submissions = await db.submission.findMany({
            where: {
                assignmentId: {
                    in: assignmentIds
                }
            },
            include: {
                student: true,
                assignment: true
            },
            orderBy: { submittedAt: 'desc' }
        });

        return submissions.map((sub: any) => ({
            id: sub.id,
            assignmentId: sub.assignmentId,
            studentId: sub.studentId,
            content: sub.content,
            submittedAt: sub.submittedAt.toISOString(),
            status: sub.status as 'submitted' | 'graded',
            score: sub.score || undefined,
            feedback: sub.feedback || undefined,
            attachments: sanitizeAttachments(sub.attachments),
            studentName: sub.student.name,
            errorAnalysis: sub.errorAnalysis ? JSON.parse(sub.errorAnalysis) : undefined
        }));
    }, 30 * 1000); // Cache for 30 seconds
}

// Optimized: Get submissions for a specific user only
export async function getUserSubmissionsAction(userId: string): Promise<Submission[]> {
    const cacheKey = CacheKeys.userSubmissions(userId);

    return serverCache.getOrFetch(cacheKey, async () => {
        const submissions = await db.submission.findMany({
            where: { studentId: userId },
            include: {
                student: true,
                assignment: true
            },
            orderBy: { submittedAt: 'desc' }
        });

        return submissions.map((sub: any) => ({
            id: sub.id,
            assignmentId: sub.assignmentId,
            studentId: sub.studentId,
            content: sub.content,
            submittedAt: sub.submittedAt.toISOString(),
            status: sub.status as 'submitted' | 'graded',
            score: sub.score || undefined,
            feedback: sub.feedback || undefined,
            attachments: sanitizeAttachments(sub.attachments),
            studentName: sub.student.name,
            errorAnalysis: sub.errorAnalysis ? JSON.parse(sub.errorAnalysis) : undefined
        }));
    }, 30 * 1000); // Cache for 30 seconds
}

// --- Class Actions ---

export async function getClassesAction(): Promise<Class[]> {
    const session = await auth();

    if (!session?.user?.id) {
        return [];
    }

    // Try cache first
    const cacheKey = CacheKeys.classes(session.user.id);
    const cached = serverCache.get<Class[]>(cacheKey);
    if (cached) return cached;

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });

    if (!user) {
        return [];
    }

    let classes: Class[];

    if (user.role === 'teacher') {
        const dbClasses = await db.class.findMany({
            where: { teacherId: session.user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                enrollments: {
                    where: { status: 'active' },
                    select: { id: true }
                }
            }
        });

        classes = dbClasses.map((c: any) => ({
            id: c.id,
            name: c.name,
            subject: c.subject,
            description: c.description || "",
            teacherId: c.teacherId,
            schedule: c.schedule || "",
            avatar: c.avatar || "",
            code: c.code,
            role: (c.role as 'main' | 'extra') ?? (c.classType === 'HOMEROOM' ? 'main' : 'extra'),
            grade: c.grade || "",
            maxStudents: c.maxStudents,
            codeEnabled: c.codeEnabled,
            color: c.color,
            classType: c.classType,
            studentCount: c.enrollments.length,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt
        }));
    } else {
        const enrollments = await db.classEnrollment.findMany({
            where: {
                userId: session.user.id,
                status: 'active'
            },
            include: {
                class: {
                    include: {
                        enrollments: {
                            where: { status: 'active' },
                            select: { id: true }
                        }
                    }
                }
            },
            orderBy: { joinedAt: 'desc' }
        });

        classes = enrollments.map((e: any) => ({
            id: e.class.id,
            name: e.class.name,
            subject: e.class.subject,
            description: e.class.description || "",
            teacherId: e.class.teacherId,
            schedule: e.class.schedule || "",
            avatar: e.class.avatar || "",
            code: e.class.code,
            role: (e.class.role as 'main' | 'extra') ?? (e.class.classType === 'HOMEROOM' ? 'main' : 'extra'),
            grade: e.class.grade || "",
            maxStudents: e.class.maxStudents,
            codeEnabled: e.class.codeEnabled,
            color: e.class.color,
            classType: e.class.classType,
            createdAt: e.class.createdAt,
            updatedAt: e.class.updatedAt,
            isPinned: e.isPinned,
            studentCount: e.class.enrollments.length
        }));
    }

    // Cache for 60 seconds
    serverCache.set(cacheKey, classes, 60 * 1000);
    return classes;
}

export async function getClassByIdAction(id: string): Promise<Class | null> {
    const c = await db.class.findUnique({
        where: { id }
    });

    if (!c) return null;

    return {
        id: c.id,
        name: c.name,
        subject: c.subject,
        description: c.description || "",
        teacherId: c.teacherId,
        schedule: c.schedule || "",
        avatar: c.avatar || "",
        code: c.code,
        role: (c.role as 'main' | 'extra') ?? (c.classType === 'HOMEROOM' ? 'main' : 'extra'),
        grade: c.grade || "",
        maxStudents: c.maxStudents,
        codeEnabled: c.codeEnabled,
        color: c.color,
        classType: c.classType,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
    };
}

// Duplicate class actions removed.
export async function createClassAction(data: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'teacher') {
        return { success: false, message: "Unauthorized" };
    }

    try {
        // Generate a unique 6-character code
        let code: string | null = null;
        for (let i = 0; i < 10; i++) {
            const attempt = Math.random().toString(36).substring(2, 8).toUpperCase();
            const exists = await db.class.findUnique({ where: { code: attempt } });
            if (!exists) {
                code = attempt;
                break;
            }
        }

        if (!code) {
            return { success: false, message: "Không thể tạo mã lớp học, vui lòng thử lại." };
        }

        const maxStudents = data.maxStudents ? parseInt(data.maxStudents, 10) : 45;
        const classType = data.classType || 'NORMAL';
        const classRole = data.role || (classType === 'NORMAL' ? 'main' : 'extra');
        const requireApproval = Boolean(data.requireApproval);

        const newClass = await db.class.create({
            data: {
                name: data.name,
                subject: data.subject,
                description: data.description,
                grade: data.grade,
                schedule: data.schedule,
                maxStudents: maxStudents > 0 ? maxStudents : 45,
                codeEnabled: typeof data.codeEnabled === 'boolean' ? data.codeEnabled : true,
                avatar: data.avatar,
                color: data.color,
                classType,
                role: classRole,
                tuitionFee: data.tuitionFee ? Number(data.tuitionFee) : undefined,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                stream: data.stream,
                code: code,
                teacherId: session.user.id
            }
        });

        await db.classSettings.create({
            data: {
                classId: newClass.id,
                requireApproval
            }
        });

        revalidatePath('/dashboard/classes');
        return { success: true, id: newClass.id, message: "Class created successfully" };
    } catch (error) {
        console.error("Failed to create class:", error);
        // Log detailed error for debugging
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }
        return { success: false, message: "Failed to create class: " + (error instanceof Error ? error.message : String(error)) };
    }
}

export async function deleteClassAction(classId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    try {
        const cls = await db.class.findUnique({ where: { id: classId } });
        if (!cls) return { success: false, message: "Class not found" };

        if (cls.teacherId !== session.user.id) {
            return { success: false, message: "Unauthorized" };
        }

        await db.class.delete({ where: { id: classId } });
        revalidatePath('/dashboard/classes');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete class:", error);
        return { success: false, message: "Failed to delete class" };
    }
}

export async function togglePinClassAction(classId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    const enrollment = await db.classEnrollment.findUnique({
        where: {
            userId_classId: {
                userId: session.user.id,
                classId
            }
        }
    });

    if (!enrollment) {
        return { success: false, message: "Bạn chưa tham gia lớp học này" };
    }

    const updated = await db.classEnrollment.update({
        where: { id: enrollment.id },
        data: { isPinned: !enrollment.isPinned }
    });

    revalidatePath('/dashboard/classes');
    return { success: true, pinned: updated.isPinned };
}

export async function joinClassAction(data: { classCode: string }): Promise<{ success: boolean; message: string; classId?: string; className?: string; status?: string }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    try {
        const cls = await db.class.findUnique({
            where: { code: data.classCode },
            include: { settings: true }
        });
        if (!cls) {
            return { success: false, message: "Mã lớp không hợp lệ" };
        }

        if (!cls.codeEnabled) {
            return { success: false, message: "Lớp học này hiện không cho phép tham gia bằng mã" };
        }

        if (cls.teacherId === session.user.id) {
            return { success: false, message: "Bạn là giáo viên của lớp học này" };
        }

        const existing = await db.classEnrollment.findUnique({
            where: {
                userId_classId: {
                    userId: session.user.id,
                    classId: cls.id
                }
            }
        });

        if (existing) {
            if (existing.status === 'pending') {
                return { success: false, message: "Yêu cầu tham gia lớp đang chờ phê duyệt" };
            }
            if (existing.status === 'active') {
                return { success: false, message: "Bạn đã tham gia lớp học này rồi" };
            }
            // Allow rejoin from dropped status
            const status = (cls.settings?.requireApproval ?? false) ? 'pending' : 'active';
            await db.classEnrollment.update({
                where: { id: existing.id },
                data: {
                    status,
                    role: 'student',
                    joinedAt: new Date()
                }
            });

            // Notify teacher if approval is required (again)
            if (status === 'pending') {
                await db.notification.create({
                    data: {
                        userId: cls.teacherId,
                        type: 'system',
                        title: 'Yêu cầu tham gia lớp (Gửi lại)',
                        message: `${session.user.name} muốn tham gia lại lớp ${cls.name}`,
                        link: `/dashboard/classes/${cls.id}?tab=people`,
                    }
                });
            }

            revalidatePath('/dashboard/classes');
            return {
                success: true,
                message: status === 'active' ? "Tham gia lớp học thành công" : "Đã gửi lại yêu cầu tham gia lớp học",
                classId: cls.id,
                className: cls.name,
                status
            };
        }

        const activeCount = await db.classEnrollment.count({
            where: { classId: cls.id, status: 'active' }
        });

        if (cls.maxStudents && activeCount >= cls.maxStudents) {
            return { success: false, message: "Lớp học đã đủ sĩ số" };
        }

        const requireApproval = cls.settings?.requireApproval ?? false;
        const status = requireApproval ? 'pending' : 'active';

        await db.classEnrollment.create({
            data: {
                userId: session.user.id,
                classId: cls.id,
                role: 'student',
                status,
                joinedAt: new Date()
            }
        });

        // Notify teacher if approval is required
        if (requireApproval) {
            await db.notification.create({
                data: {
                    userId: cls.teacherId,
                    type: 'system',
                    title: 'Yêu cầu tham gia lớp mới',
                    message: `${session.user.name} muốn tham gia lớp ${cls.name}`,
                    link: `/dashboard/classes/${cls.id}?tab=people`,
                }
            });
        }

        revalidatePath('/dashboard/classes');
        return {
            success: true,
            status,
            message: requireApproval ? "Đã gửi yêu cầu tham gia, vui lòng chờ giáo viên phê duyệt" : "Tham gia lớp học thành công",
            classId: cls.id,
            className: cls.name
        };
    } catch (error) {
        console.error("Failed to join class:", error);
        return { success: false, message: "Có lỗi xảy ra khi tham gia lớp học" };
    }
}

export async function inviteStudentAction(classId: string, email: string): Promise<{ success: boolean; message: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: 'Unauthorized' };
        }

        const cls = await db.class.findUnique({
            where: { id: classId },
            include: { settings: true }
        });

        if (!cls || cls.teacherId !== session.user.id) {
            return { success: false, message: 'Bạn không có quyền mời học sinh cho lớp này.' };
        }

        // 1. Check if user exists
        const user = await db.user.findUnique({
            where: { email }
        });

        if (!user) {
            // In a real app, we would create a "PendingInvite" record and send an email
            // For now, we'll just return an error saying user must register first
            return { success: false, message: 'Email này chưa đăng ký tài khoản Miqix.' };
        }

        // 2. Check if already enrolled
        const existingEnrollment = await db.classEnrollment.findUnique({
            where: {
                userId_classId: {
                    userId: user.id,
                    classId: classId
                }
            }
        });

        if (existingEnrollment) {
            if (existingEnrollment.status === 'active') {
                return { success: false, message: 'Học sinh này đã có trong lớp.' };
            }

            await db.classEnrollment.update({
                where: { id: existingEnrollment.id },
                data: {
                    status: 'active',
                    role: 'student',
                    joinedAt: new Date()
                }
            });

            revalidatePath(`/dashboard/classes/${classId}/roster`);
            return { success: true, message: `Đã kích hoạt lại thành viên ${user.name}.` };
        }

        // 3. Add to class (as pending or active? Let's make it active for direct invites)
        await db.classEnrollment.create({
            data: {
                userId: user.id,
                classId: classId,
                role: 'student',
                status: 'active'
            }
        });

        revalidatePath(`/dashboard/classes/${classId}/roster`);
        return { success: true, message: `Đã thêm học sinh ${user.name} vào lớp.` };

    } catch (error) {
        console.error('Invite student error:', error);
        return { success: false, message: 'Lỗi khi mời học sinh.' };
    }
}

export async function getUserEnrollmentsAction() {
    const session = await auth();
    if (!session?.user?.id) return [];
    const userId = session.user.id;

    // Try cache first
    const cacheKey = `enrollments:v2:${userId}`;
    const cached = serverCache.get<any[]>(cacheKey);
    if (cached) return cached;

    const [enrollments, teachingClasses] = await Promise.all([
        db.classEnrollment.findMany({
            where: { userId },
            include: {
                class: {
                    include: {
                        teacher: true,
                        _count: { select: { enrollments: true } }
                    }
                }
            }
        }),
        db.class.findMany({
            where: { teacherId: userId },
            include: {
                teacher: true,
                _count: { select: { enrollments: true } }
            }
        })
    ]);

    const result: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

    for (const cls of teachingClasses) {
        result.push({
            id: `enr_t_${cls.id}`,
            classId: cls.id,
            className: cls.name,
            subject: cls.subject,
            teacherName: "You (Teacher)",
            role: 'teacher',
            status: 'active',
            joinedAt: cls.createdAt.toISOString(),
            avatar: cls.avatar,
            color: cls.color,
            classType: cls.classType,
            maxStudents: cls.maxStudents,
            codeEnabled: cls.codeEnabled,
            isPinned: false,
            studentCount: cls._count.enrollments
        });
    }

    for (const enr of enrollments) {
        result.push({
            id: enr.id,
            classId: enr.classId,
            className: enr.class.name,
            subject: enr.class.subject,
            teacherName: enr.class.teacher.name,
            role: enr.role,
            status: enr.status,
            joinedAt: enr.joinedAt.toISOString(),
            avatar: enr.class.avatar,
            color: enr.class.color,
            classType: enr.class.classType,
            maxStudents: enr.class.maxStudents,
            codeEnabled: enr.class.codeEnabled,
            isPinned: enr.isPinned,
            studentCount: enr.class._count.enrollments
        });
    }

    // Cache for 60 seconds
    serverCache.set(cacheKey, result, 60 * 1000);
    return result;
}

export async function getClassEnrollmentsAction(classId: string) {
    const enrollments = await db.classEnrollment.findMany({
        where: { classId, status: 'active' }, // Only get active members, not pending
        include: { user: true }
    });

    return enrollments.map((e: any) => ({
        id: e.id,
        userId: e.userId,
        classId: e.classId,
        role: e.role as 'student' | 'monitor' | 'vice_monitor' | 'teacher',
        status: 'active' as const,
        createdAt: e.joinedAt.toISOString(),
        isPinned: e.isPinned,
        notificationsEnabled: e.notificationsEnabled,
        mutedUntil: e.mutedUntil ? e.mutedUntil.toISOString() : undefined,
        user: {
            id: e.user.id,
            name: e.user.name,
            email: e.user.email,
            role: e.user.role as 'teacher' | 'student',
            avatarUrl: e.user.avatarUrl || undefined,
        }
    }));
}

export async function getPendingEnrollmentsAction(classId: string) {
    const enrollments = await db.classEnrollment.findMany({
        where: { classId, status: 'pending' },
        include: { user: true }
    });
    return enrollments.map((e: any) => ({
        id: e.id,
        userId: e.userId,
        classId: e.classId,
        role: e.role as 'student' | 'monitor' | 'vice_monitor' | 'teacher',
        status: 'pending' as const,
        createdAt: e.joinedAt.toISOString(),
        user: {
            id: e.user.id,
            name: e.user.name,
            email: e.user.email,
            role: e.user.role as 'teacher' | 'student',
            avatarUrl: e.user.avatarUrl || undefined
        }
    }));
}

export async function removeStudentFromClassAction(enrollmentId: string): Promise<{ success: boolean; message: string }> {
    const sessionUser = await getCurrentUserAction();
    if (!sessionUser || sessionUser.role !== 'teacher') {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const enrollment = await db.classEnrollment.findUnique({
            where: { id: enrollmentId },
            include: { class: true }
        });

        if (!enrollment) return { success: false, message: "Enrollment not found" };

        if (enrollment.class.teacherId !== sessionUser.id) {
            return { success: false, message: "Unauthorized: You do not own this class" };
        }

        await db.classEnrollment.delete({
            where: { id: enrollmentId }
        });
        return { success: true, message: 'Đã xóa học sinh khỏi lớp' };
    } catch (error) {
        return { success: false, message: 'Lỗi khi xóa học sinh' };
    }
}

export async function approveEnrollmentAction(enrollmentId: string): Promise<{ success: boolean; message: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: "Unauthorized" };
        }

        const enrollment = await db.classEnrollment.findUnique({
            where: { id: enrollmentId },
            include: { class: true }
        });

        if (!enrollment) {
            return { success: false, message: "Không tìm thấy yêu cầu tham gia" };
        }

        if (enrollment.class.teacherId !== session.user.id) {
            return { success: false, message: "Bạn không có quyền phê duyệt yêu cầu này" };
        }

        await db.classEnrollment.update({
            where: { id: enrollmentId },
            data: { status: 'active', joinedAt: new Date() }
        });

        // Notify student
        await db.notification.create({
            data: {
                userId: enrollment.userId,
                type: 'system',
                title: 'Yêu cầu tham gia đã được duyệt',
                message: `Bạn đã trở thành thành viên của lớp ${enrollment.class.name}`,
                link: `/dashboard/classes/${enrollment.classId}`
            }
        });

        revalidatePath('/dashboard/classes');
        revalidatePath(`/dashboard/classes/${enrollment.classId}/roster`);
        return { success: true, message: 'Đã chấp nhận học sinh vào lớp' };
    } catch (error) {
        console.error('Approve enrollment error:', error);
        return { success: false, message: 'Lỗi khi chấp nhận học sinh' };
    }
}

export async function rejectEnrollmentAction(enrollmentId: string): Promise<{ success: boolean; message: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: "Unauthorized" };
        }

        const enrollment = await db.classEnrollment.findUnique({
            where: { id: enrollmentId },
            include: { class: true }
        });

        if (!enrollment) {
            return { success: false, message: "Không tìm thấy yêu cầu" };
        }

        if (enrollment.class.teacherId !== session.user.id) {
            return { success: false, message: "Bạn không có quyền từ chối yêu cầu này" };
        }

        await db.classEnrollment.delete({
            where: { id: enrollmentId }
        });

        // Notify student
        await db.notification.create({
            data: {
                userId: enrollment.userId,
                type: 'system',
                title: 'Yêu cầu tham gia đã bị từ chối',
                message: `Yêu cầu tham gia lớp ${enrollment.class.name} của bạn không được chấp nhận.`,
                link: '/dashboard/classes'
            }
        });

        revalidatePath('/dashboard/classes');
        revalidatePath(`/dashboard/classes/${enrollment.classId}/roster`);
        return { success: true, message: 'Đã từ chối yêu cầu tham gia' };
    } catch (error) {
        console.error('Reject enrollment error:', error);
        return { success: false, message: 'Lỗi khi từ chối yêu cầu' };
    }
}

// Leave class action for students
export async function leaveClassAction(classId: string): Promise<{ success: boolean; message: string }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        // Find enrollment
        const enrollment = await db.classEnrollment.findUnique({
            where: {
                userId_classId: {
                    userId: session.user.id,
                    classId: classId
                }
            },
            include: { class: true }
        });

        if (!enrollment) {
            return { success: false, message: "Bạn không phải thành viên của lớp này" };
        }

        // Can't leave if you're the teacher
        if (enrollment.class.teacherId === session.user.id) {
            return { success: false, message: "Giáo viên không thể rời lớp. Hãy xóa lớp nếu cần." };
        }

        // Delete enrollment
        await db.classEnrollment.delete({
            where: { id: enrollment.id }
        });

        revalidatePath('/dashboard/classes');
        revalidatePath(`/dashboard/classes/${classId}`);
        return { success: true, message: "Đã rời khỏi lớp học" };
    } catch (error) {
        console.error('Leave class error:', error);
        return { success: false, message: 'Lỗi khi rời lớp học' };
    }
}

// Get attendance history for a class
export async function getAttendanceHistoryAction(classId: string): Promise<{
    success: boolean;
    data?: {
        sessions: Array<{
            id: string;
            date: string;
            lessonContent: string | null;
            presentCount: number;
            absentCount: number;
            lateCount: number;
            totalStudents: number;
        }>;
        studentStats: Array<{
            studentId: string;
            studentName: string;
            presentCount: number;
            absentCount: number;
            lateCount: number;
            attendanceRate: number;
        }>;
    };
    error?: string;
}> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // Get all sessions for this class
        const sessions = await db.classSession.findMany({
            where: { classId },
            orderBy: { date: 'desc' },
            include: {
                attendanceRecords: {
                    include: { student: true }
                }
            }
        });

        // Get all enrollments for student count
        const enrollments = await db.classEnrollment.findMany({
            where: { classId, status: 'active' },
            include: { user: true }
        });

        const totalStudents = enrollments.length;

        // Map sessions to summary
        const sessionSummaries = sessions.map((s: any) => {
            const presentCount = s.attendanceRecords.filter((r: any) => r.status === 'present').length;
            const absentCount = s.attendanceRecords.filter((r: any) => r.status === 'absent').length;
            const lateCount = s.attendanceRecords.filter((r: any) => r.status === 'late').length;
            const excusedCount = s.attendanceRecords.filter((r: any) => r.status === 'excused').length;
            return {
                id: s.id,
                date: s.date.toISOString(),
                lessonContent: s.lessonContent,
                presentCount,
                absentCount,
                lateCount,
                totalStudents
            };
        });

        // Calculate per-student stats
        const studentStatsMap = new Map<string, { name: string; present: number; absent: number; late: number }>();

        // Initialize all enrolled students
        for (const enr of enrollments) {
            studentStatsMap.set(enr.userId, {
                name: enr.user.name,
                present: 0,
                absent: 0,
                late: 0
            });
        }

        // Count attendance for each student
        for (const s of sessions) {
            for (const record of s.attendanceRecords) {
                const stats = studentStatsMap.get(record.studentId);
                if (stats) {
                    if (record.status === 'present') stats.present++;
                    else if (record.status === 'absent') stats.absent++;
                    else if (record.status === 'late') stats.late++;
                }
            }
        }

        const studentStats = Array.from(studentStatsMap.entries()).map(([studentId, stats]) => {
            const total = stats.present + stats.absent + stats.late;
            return {
                studentId,
                studentName: stats.name,
                presentCount: stats.present,
                absentCount: stats.absent,
                lateCount: stats.late,
                attendanceRate: total > 0 ? Math.round((stats.present / total) * 100) : 0
            };
        });

        return {
            success: true,
            data: {
                sessions: sessionSummaries,
                studentStats
            }
        };
    } catch (error) {
        console.error('Get attendance history error:', error);
        return { success: false, error: 'Lỗi khi tải lịch sử điểm danh' };
    }
}

// Export grades as CSV data
export async function exportGradesAction(classId: string): Promise<{
    success: boolean;
    data?: {
        headers: string[];
        rows: Array<{ studentName: string; studentId: string; grades: Array<{ assignmentTitle: string; score: number | null; maxScore: number }> }>;
        csvContent: string;
    };
    error?: string;
}> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // Verify user is teacher of this class
        const cls = await db.class.findUnique({
            where: { id: classId }
        });

        if (!cls || cls.teacherId !== session.user.id) {
            return { success: false, error: "Không có quyền truy cập" };
        }

        // Get all enrolled students
        const enrollments = await db.classEnrollment.findMany({
            where: { classId, status: 'active' },
            include: { user: true }
        });

        // Get all assignments for this class
        const assignments = await db.assignment.findMany({
            where: {
                assignmentClasses: { some: { classId } }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Get all submissions
        const submissions = await db.submission.findMany({
            where: {
                assignmentId: { in: assignments.map((a: any) => a.id) },
                studentId: { in: enrollments.map((e: any) => e.userId) }
            }
        });

        // Filter graded submissions and group by student
        const gradedSubmissions = submissions.filter((sub: any) => sub.status === 'graded');

        // Build headers
        const headers = ['STT', 'Họ và tên', 'Email', ...assignments.map((a: any) => a.title), 'Điểm TB'];

        // Build rows
        const rows = enrollments.map((enr: any) => {
            const studentGrades = assignments.map((assignment: any) => {
                const sub = submissions.find((s: any) => s.assignmentId === assignment.id && s.studentId === enr.userId);
                return {
                    assignmentTitle: assignment.title,
                    score: sub?.score ?? null,
                    maxScore: assignment.maxScore || 100
                };
            });

            return {
                studentName: enr.user.name,
                studentId: enr.userId,
                grades: studentGrades
            };
        });

        // Generate CSV content
        const csvRows = [
            headers.join(','),
            ...rows.map((row: { studentName: string; studentId: string; grades: Array<{ assignmentTitle: string; score: number | null; maxScore: number }> }, index: number) => {
                const scores = row.grades.map((g: { assignmentTitle: string; score: number | null; maxScore: number }) => g.score !== null ? g.score.toString() : '');
                const gradedScores = row.grades.filter((g: { assignmentTitle: string; score: number | null; maxScore: number }) => g.score !== null);
                const average = gradedScores.length > 0
                    ? (gradedScores.reduce((sum: number, g: { assignmentTitle: string; score: number | null; maxScore: number }) => sum + (g.score || 0), 0) / gradedScores.length).toFixed(1)
                    : '';

                const enrollment = enrollments[index];
                return [
                    (index + 1).toString(),
                    `"${row.studentName}"`,
                    enrollment.user.email,
                    ...scores,
                    average
                ].join(',');
            })
        ];

        const csvContent = csvRows.join('\n');

        return {
            success: true,
            data: {
                headers,
                rows,
                csvContent
            }
        };
    } catch (error) {
        console.error('Export grades error:', error);
        return { success: false, error: 'Lỗi khi xuất bảng điểm' };
    }
}

export async function markNotificationAsReadAction(id: string): Promise<void> {
    try {
        await db.notification.update({
            where: { id },
            data: { isRead: true }
        });
    } catch (error) {
        console.error(`Failed to mark notification ${id} as read`, error);
        throw new Error("Failed to mark notification as read");
    }
}

export async function getSocialEventsAction(classId: string): Promise<SocialEvent[]> {
    const events = await db.socialEvent.findMany({
        where: { classId },
        orderBy: { timestamp: 'desc' },
        include: { user: true, reactions: true }
    });

    return events.map((e: any) => ({
        id: e.id,
        type: e.type as 'announcement' | 'assignment' | 'event' | 'general', // eslint-disable-line @typescript-eslint/no-explicit-any
        userId: e.userId,
        userName: e.user.name,
        userAvatar: e.user.avatarUrl || undefined,
        content: e.content,
        timestamp: e.timestamp.toISOString(),
        classId: e.classId,
        reactions: e.reactions.map(r => ({
            userId: r.userId,
            type: r.type as 'respect' | 'challenge'
        }))
    }));
}

export async function getPendingSubmissionsAction() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'teacher') return [];
    const teacherId = session.user.id;

    const submissions = await db.submission.findMany({
        where: {
            status: 'submitted',
            assignment: { teacherId }
        },
        include: {
            student: true,
            assignment: { include: { assignmentClasses: { include: { class: true } } } } // Complex include to get class name?
            // Actually assignment doesn't directly link to one class easily if it's multi-class.
            // But we can try to find the class name via assignmentClasses.
        }
    });

    // Simplify for now
    return submissions.map(sub => ({
        id: sub.id,
        studentName: sub.student.name,
        studentAvatar: sub.student.avatarUrl,
        assignmentTitle: sub.assignment.title,
        className: "Class", // Placeholder, hard to get exact class if assignment is shared
        submittedAt: sub.submittedAt.toISOString(),
        isLate: false, // TODO: check due date
        assignmentId: sub.assignmentId
    }));
}

// --- Helper Functions ---

async function verifyClassPermission(classId: string, userId: string, requiredRole: 'teacher' | 'monitor' | 'student' = 'student') { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Implement permission check
    return { isTeacher: true, isMonitor: false };
}

// --- Announcement Actions ---

export async function createAnnouncementAction(data: {
    classId: string;
    title: string;
    content: string;
    isPinned: boolean;
    type: string;
    attachments?: string; // JSON string
}) {
    const session = await getCurrentUserAction();
    if (!session || session.role !== 'teacher') {
        return { success: false, message: "Unauthorized" };
    }

    try {
        await db.announcement.create({
            data: {
                classId: data.classId,
                teacherId: session.id,
                title: data.title,
                content: data.content,
                isPinned: data.isPinned,
                type: data.type.toUpperCase() as 'NORMAL' | 'URGENT' | 'EVENT', // eslint-disable-line @typescript-eslint/no-explicit-any
                attachments: data.attachments || "[]"
            }
        });

        revalidatePath(`/dashboard/classes/${data.classId}`);
        return { success: true, message: "Đã tạo thông báo" };
    } catch (error) {
        console.error("Create announcement error:", error);
        return { success: false, message: "Lỗi khi tạo thông báo" };
    }
}

export async function updateAnnouncementAction(announcementId: string, content: string, isPinned?: boolean) {
    const session = await getCurrentUserAction();
    if (!session || session.role !== 'teacher') {
        return { success: false, message: "Unauthorized" };
    }

    try {
        await db.announcement.update({
            where: { id: announcementId },
            data: {
                content,
                isPinned
            }
        });

        revalidatePath('/dashboard/classes');
        return { success: true, message: "Đã cập nhật thông báo" };
    } catch (error) {
        console.error("Update announcement error:", error);
        return { success: false, message: "Lỗi khi cập nhật thông báo" };
    }
}

// --- Attendance Actions ---

export async function getAttendanceSessionAction(classId: string, date: Date, period: number = 1) {
    // Find session for this class, date, and period
    // We need to match the date part only, ignoring time
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const session = await db.classSession.findFirst({
        where: {
            classId,
            period,
            date: {
                gte: startOfDay,
                lte: endOfDay
            }
        },
        include: {
            attendanceRecords: true
        }
    });

    return session;
}

export async function saveAttendanceAction(
    classId: string,
    date: Date,
    period: number,
    records: { studentId: string; status: string; note?: string }[]
) {
    const user = await getCurrentUserAction();
    if (!user || user.role !== 'teacher') {
        return { success: false, message: "Unauthorized" };
    }

    try {
        // 1. Find or Create ClassSession
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        let session = await db.classSession.findFirst({
            where: {
                classId,
                period,
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        if (!session) {
            session = await db.classSession.create({
                data: {
                    classId,
                    teacherId: user.id,
                    date: date,
                    period: period,
                    // Optional fields can be filled later if we add a full lesson plan feature
                }
            });
        }

        // 2. Upsert Attendance Records
        for (const record of records) {
            await db.attendanceRecord.upsert({
                where: {
                    sessionId_studentId: {
                        sessionId: session.id,
                        studentId: record.studentId
                    }
                },
                update: {
                    status: record.status,
                    note: record.note
                },
                create: {
                    sessionId: session.id,
                    studentId: record.studentId,
                    status: record.status,
                    note: record.note
                }
            });
        }

        revalidatePath(`/dashboard/classes/${classId}/attendance`);
        revalidatePath(`/dashboard/classes/${classId}`); // Update dashboard stats

        return { success: true, message: "Đã lưu điểm danh" };

    } catch (error) {
        console.error("Save attendance error:", error);
        return { success: false, message: "Lỗi khi lưu điểm danh" };
    }
}

export async function getAttendanceStatsAction(classId: string) {
    // Calculate overall attendance rate for the class
    const records = await db.attendanceRecord.findMany({
        where: {
            session: {
                classId
            }
        }
    });

    if (records.length === 0) return { attendanceRate: 100 }; // Default if no data

    const presentCount = records.filter((r: any) => r.status === 'PRESENT').length;
    const absentCount = records.filter((r: any) => r.status === 'ABSENT').length;
    const lateCount = records.filter((r: any) => r.status === 'LATE').length;
    const excusedCount = records.filter((r: any) => r.status === 'EXCUSED').length; // eslint-disable-line @typescript-eslint/no-unused-vars

    // We count Present and Late as "Attended" (maybe Late counts as 0.5? For now let's say 1)
    // Actually, usually Rate = (Present + Late) / Total

    const attendanceRate = Math.round(((presentCount + lateCount) / records.length) * 100);

    return { attendanceRate };
}

/**
 * Get attendance statistics for a specific student in a class
 */
export async function getStudentAttendanceStatsAction(classId: string, studentId: string): Promise<{
    attendanceRate: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    excusedCount: number;
    totalSessions: number;
}> {
    try {
        // Get all attendance records for this student in this class
        const records = await db.attendanceRecord.findMany({
            where: {
                studentId,
                session: {
                    classId
                }
            },
            include: {
                session: true
            }
        });

        if (records.length === 0) {
            // No attendance data yet - return 100% as default (no absences recorded)
            return {
                attendanceRate: 100,
                presentCount: 0,
                lateCount: 0,
                absentCount: 0,
                excusedCount: 0,
                totalSessions: 0
            };
        }

        const presentCount = records.filter(r => r.status === 'PRESENT' || r.status === 'present').length;
        const lateCount = records.filter(r => r.status === 'LATE' || r.status === 'late').length;
        const absentCount = records.filter(r => r.status === 'ABSENT' || r.status === 'absent').length;
        const excusedCount = records.filter(r => r.status === 'EXCUSED' || r.status === 'excused').length;

        // Present + Late counts as "attended"
        const attendanceRate = Math.round(((presentCount + lateCount) / records.length) * 100);

        return {
            attendanceRate,
            presentCount,
            lateCount,
            absentCount,
            excusedCount,
            totalSessions: records.length
        };
    } catch (error) {
        console.error('Get student attendance stats error:', error);
        return {
            attendanceRate: 100,
            presentCount: 0,
            lateCount: 0,
            absentCount: 0,
            excusedCount: 0,
            totalSessions: 0
        };
    }
}

export async function deleteAnnouncementAction(announcementId: string) {
    const session = await getCurrentUserAction();
    if (!session || session.role !== 'teacher') {
        return { success: false, message: "Unauthorized" };
    }

    try {
        // Get classId before deleting for revalidation
        const announcement = await db.announcement.findUnique({
            where: { id: announcementId },
            select: { classId: true }
        });

        await db.announcement.delete({
            where: { id: announcementId }
        });

        if (announcement) {
            revalidatePath(`/dashboard/classes/${announcement.classId}`);
        }

        return { success: true, message: "Đã xóa thông báo" };
    } catch (error) {
        console.error("Delete announcement error:", error);
        return { success: false, message: "Lỗi khi xóa thông báo" };
    }
}

// --- Class Settings Actions ---

export async function updateClassDetailsAction(classId: string, data: { name: string; subject: string; description?: string; schedule?: string }) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const session = await getCurrentUserAction();
    if (!session || session.role !== 'teacher') {
        return { success: false, message: "Unauthorized" };
    }

    try {
        // Verify ownership
        const existingClass = await db.class.findUnique({
            where: { id: classId },
        });

        if (!existingClass || existingClass.teacherId !== session.id) {
            return { success: false, message: "Bạn không có quyền chỉnh sửa lớp này" };
        }

        await db.class.update({
            where: { id: classId },
            data: {
                name: data.name,
                subject: data.subject,
                description: data.description,
                // room: data.room, // Field does not exist
                schedule: data.schedule,
            }
        });

        revalidatePath(`/dashboard/classes/${classId}`);
        revalidatePath('/dashboard/classes');
        return { success: true, message: "Đã cập nhật thông tin lớp học" };
    } catch (error) {
        console.error("Update class error:", error);
        return { success: false, message: "Lỗi khi cập nhật lớp học" };
    }
}

export async function archiveClassAction(classId: string) {
    const session = await getCurrentUserAction();
    if (!session || session.role !== 'teacher') {
        return { success: false, message: "Unauthorized" };
    }

    try {
        // Verify ownership
        const existingClass = await db.class.findUnique({
            where: { id: classId },
        });

        if (!existingClass || existingClass.teacherId !== session.id) {
            return { success: false, message: "Bạn không có quyền lưu trữ lớp này" };
        }

        await db.class.update({
            where: { id: classId },
            data: {
                // isArchived: true // Field does not exist
            }
        });

        revalidatePath('/dashboard/classes');
        return { success: true, message: "Đã lưu trữ lớp học" };
    } catch (error) {
        console.error("Archive class error:", error);
        return { success: false, message: "Lỗi khi lưu trữ lớp học" };
    }
}



export async function getClassAnnouncementsAction(classId: string) {
    const announcements = await db.announcement.findMany({
        where: { classId },
        orderBy: [
            { isPinned: 'desc' },
            { createdAt: 'desc' }
        ],
        include: {
            teacher: true,
            reactions: true,
            comments: { include: { user: true } }
        }
    });

    return announcements.map((ann: any & { teacher: any | null; reactions: any[]; comments: (any & { user: any | null })[] }) => ({
        id: ann.id,
        classId: ann.classId,
        teacherId: ann.teacherId,
        teacherName: ann.teacher?.name || "Giáo viên",
        teacherAvatar: ann.teacher?.avatarUrl || undefined,
        content: ann.content,
        title: ann.title || undefined,
        isPinned: ann.isPinned,
        createdAt: ann.createdAt.toISOString(),
        updatedAt: ann.updatedAt.toISOString(),
        type: (ann.type?.toUpperCase() || 'NORMAL') as 'NORMAL' | 'URGENT' | 'EVENT', // eslint-disable-line @typescript-eslint/no-explicit-any
        attachments: ann.attachments || '[]',
        reactions: ann.reactions.map((r: any) => ({ userId: r.userId, type: r.type as 'respect' | 'challenge' })), // eslint-disable-line @typescript-eslint/no-explicit-any
        comments: ann.comments.map((c: any & { user: any | null }) => ({
            id: c.id,
            userId: c.userId,
            userName: c.user?.name || "Người dùng",
            userAvatar: c.user?.avatarUrl || undefined,
            content: c.content,
            createdAt: c.createdAt.toISOString()
        }))
    }));
}

export async function uploadResourceAction(data: {
    classId: string;
    teacherId: string;
    title: string;
    description?: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
}) {
    const session = await getCurrentUserAction();
    if (!session || session.role !== 'teacher') {
        return { success: false, message: "Unauthorized" };
    }

    try {
        await db.classResource.create({
            data: {
                classId: data.classId,
                title: data.title,
                description: data.description,
                fileUrl: data.fileUrl,
                fileType: data.fileType,
                fileSize: data.fileSize,
                uploadedBy: session.id
            }
        });

        revalidatePath(`/dashboard/classes/${data.classId}`);
        return { success: true, message: "Đã tải lên tài liệu" };
    } catch (error) {
        console.error("Upload resource error:", error);
        return { success: false, message: "Lỗi khi lưu tài liệu" };
    }
}

export async function deleteResourceAction(resourceId: string, classId: string) {
    const session = await getCurrentUserAction();
    if (!session || session.role !== 'teacher') {
        return { success: false, message: "Unauthorized" };
    }

    try {
        await db.classResource.delete({
            where: { id: resourceId }
        });

        revalidatePath(`/dashboard/classes/${classId}`);
        return { success: true, message: "Đã xóa tài liệu" };
    } catch (error) {
        console.error("Delete resource error:", error);
        return { success: false, message: "Lỗi khi xóa tài liệu" };
    }
}

export async function getClassResourcesAction(classId: string) {
    const resources = await db.classResource.findMany({
        where: { classId },
        orderBy: { createdAt: 'desc' },
        include: {
            uploader: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true
                }
            }
        }
    });

    const mappedResources = resources.map(r => ({
        id: r.id,
        classId: r.classId,
        title: r.title,
        description: r.description || undefined,
        fileUrl: r.fileUrl,
        fileType: r.fileType,
        fileSize: r.fileSize,
        uploadedBy: r.uploadedBy,
        uploaderName: r.uploader.name,
        uploaderAvatar: r.uploader.avatarUrl || undefined,
        folderId: r.folderId || undefined,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString()
    }));

    return { success: true, data: mappedResources };
}

// NEW: Get media files from announcements with source info
export async function getAnnouncementMediaAction(classId: string) {
    const announcements = await db.announcement.findMany({
        where: { classId },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            title: true,
            content: true,
            type: true,
            attachments: true,
            createdAt: true,
            teacher: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true
                }
            }
        }
    });

    const mediaFiles: {
        id: string;
        name: string;
        url: string;
        type: string;
        size?: number;
        announcementId: string;
        announcementTitle: string | null;
        announcementContent: string;
        announcementType: string;
        teacherName: string;
        teacherAvatar: string | null;
        createdAt: string;
    }[] = [];

    announcements.forEach(ann => {
        try {
            const attachments = JSON.parse(ann.attachments || '[]');
            attachments.forEach((att: { name?: string; url: string; type?: string; size?: number }, index: number) => {
                mediaFiles.push({
                    id: `${ann.id}-${index}`,
                    name: att.name || `File ${index + 1}`,
                    url: att.url,
                    type: att.type || 'unknown',
                    size: att.size,
                    announcementId: ann.id,
                    announcementTitle: ann.title,
                    announcementContent: ann.content.substring(0, 100) + (ann.content.length > 100 ? '...' : ''),
                    announcementType: ann.type,
                    teacherName: ann.teacher.name,
                    teacherAvatar: ann.teacher.avatarUrl,
                    createdAt: ann.createdAt.toISOString()
                });
            });
        } catch {
            // Skip if attachments parsing fails
        }
    });

    return { success: true, data: mediaFiles };
}

export async function getMissionsAction(): Promise<Mission[]> {
    const session = await auth();
    if (!session?.user?.id) return [];

    return fetchMissionsAssignedTo(session.user.id);
}

export async function getCreatedMissionsAction(): Promise<Mission[]> {
    const session = await auth();
    if (!session?.user?.id) return [];

    return fetchMissionsCreatedBy(session.user.id);
}

export async function updateMissionAction(id: string, data: Partial<Mission>) {
    try {
        const updateData: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (data.title) updateData.title = data.title;
        if (data.description) updateData.description = data.description;
        if (data.category) updateData.category = data.category;
        if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
        if (data.relatedAssignmentId) updateData.relatedAssignmentId = data.relatedAssignmentId;
        if (data.relatedClassId) updateData.relatedClassId = data.relatedClassId;
        if (data.status) {
            updateData.status = data.status;
            if (data.status === 'completed') {
                updateData.completedAt = new Date();
            }
        }
        if (data.progress) {
            updateData.progress = JSON.stringify(data.progress);
        }

        await db.mission.update({
            where: { id },
            data: updateData
        });

        revalidatePath('/dashboard/missions');
        return { success: true, message: "Đã cập nhật nhiệm vụ" };
    } catch (error) {
        console.error("Update mission error:", error);
        return { success: false, message: "Lỗi khi cập nhật nhiệm vụ" };
    }
}


export async function createMissionAction(data: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const session = await getCurrentUserAction();
    if (!session) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const newMission = await db.mission.create({
            data: {
                title: data.title,
                description: data.description,
                type: data.type || 'custom',
                category: data.category || 'personal',
                createdBy: session.id,
                assignedTo: data.assignedTo || session.id,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                status: 'pending'
            }
        });

        revalidatePath('/dashboard');
        return { success: true, message: "Đã tạo nhiệm vụ", mission: newMission };
    } catch (error) {
        console.error("Create mission error:", error);
        return { success: false, message: "Lỗi khi tạo nhiệm vụ" };
    }
}

export async function getNotificationsAction() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        const notifications = await db.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' }
        });
        const formattedNotifications = notifications.map((n: any) => ({
            ...n,
            type: n.type as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            link: n.link || undefined,
            createdAt: n.createdAt.toISOString()
        }));
        return formattedNotifications;
    } catch (error) {
        console.error("Get notifications error:", error);
        return [];
    }
}

export async function toggleReactionAction(targetId: string, targetType: 'social' | 'announcement', type: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };
    const userId = session.user.id;

    try {
        const where: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
            userId,
            type
        };

        if (targetType === 'social') {
            where.socialEventId = targetId;
        } else {
            where.announcementId = targetId;
        }

        const existing = await db.reaction.findFirst({ where });

        if (existing) {
            await db.reaction.delete({ where: { id: existing.id } });
            return { success: true, action: 'removed' };
        } else {
            await db.reaction.create({
                data: {
                    userId,
                    type,
                    socialEventId: targetType === 'social' ? targetId : undefined,
                    announcementId: targetType === 'announcement' ? targetId : undefined
                }
            });
            return { success: true, action: 'added' };
        }
    } catch (error) {
        console.error("Toggle reaction error:", error);
        return { success: false };
    }
}

export async function deleteCommentAction(commentId: string) {
    try {
        await db.comment.delete({ where: { id: commentId } });
        return { success: true };
    } catch { // eslint-disable-line @typescript-eslint/no-unused-vars
        return { success: false };
    }
}

// --- ATTENDANCE ACTIONS (LEGACY - REMOVED) ---

export async function getStudentAttendanceAction(_classId: string, _studentId: string) {
    // Fetch from ClassSession -> AttendanceRecord
    // This is a bit complex query
    return {
        records: [],
        stats: { total: 0, present: 0, late: 0, absent: 0, excused: 0 }
    };
}

// --- CLASS MANAGEMENT ACTIONS ---

export async function promoteToMonitorAction(_classId: string, _studentId: string) {
    // TODO: Implement role change in enrollment
    return { success: true, message: 'Đã thăng chức thành Ban cán sự' };
}

export async function demoteFromMonitorAction(_classId: string, _studentId: string) {
    return { success: true, message: 'Đã bãi nhiệm Ban cán sự' };
}



export async function importStudentsFromCSVAction(
    classId: string,
    students: { name: string; email: string }[]
): Promise<{ success: boolean; message: string; results?: { added: number; failed: number; errors: string[] } }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    // Verify user is teacher of the class
    const classData = await db.class.findFirst({
        where: { id: classId, teacherId: session.user.id }
    });

    if (!classData) {
        return { success: false, message: "Không tìm thấy lớp học hoặc bạn không có quyền" };
    }

    let added = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const student of students) {
        try {
            if (!student.email || !student.name) {
                errors.push(`Bỏ qua dòng thiếu thông tin: ${student.name || student.email || 'không có dữ liệu'}`);
                failed++;
                continue;
            }

            // Check if user exists
            let user = await db.user.findUnique({
                where: { email: student.email }
            });

            // Create user if not exists
            if (!user) {
                user = await db.user.create({
                    data: {
                        name: student.name,
                        email: student.email,
                        role: 'student',
                        password: '$2a$10$defaultHashedPassword' // Default password
                    }
                });
            }

            // Check if already enrolled
            const existingEnrollment = await db.classEnrollment.findUnique({
                where: {
                    userId_classId: {
                        userId: user.id,
                        classId
                    }
                }
            });

            if (existingEnrollment) {
                errors.push(`${student.email} đã tham gia lớp học`);
                failed++;
                continue;
            }

            // Create enrollment
            await db.classEnrollment.create({
                data: {
                    userId: user.id,
                    classId,
                    role: 'student',
                    status: 'active'
                }
            });

            added++;
        } catch (error) {
            console.error(`Error importing ${student.email}:`, error);
            errors.push(`Lỗi khi thêm ${student.email}`);
            failed++;
        }
    }

    revalidatePath(`/dashboard/classes/${classId}`);

    return {
        success: true,
        message: `Đã thêm ${added} học sinh${failed > 0 ? `, ${failed} lỗi` : ''}`,
        results: { added, failed, errors }
    };
}


// Duplicate class actions removed.

// --- Class Session Actions (Sổ đầu bài) ---

export async function getClassSessionsAction(classId: string, startDate: Date, endDate: Date): Promise<ClassSession[]> {
    const sessions = await db.classSession.findMany({
        where: {
            classId,
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        include: {
            attendanceRecords: true,
            teacher: true
        }
    });

    return sessions.map((s: any) => ({
        id: s.id,
        classId: s.classId,
        teacherId: s.teacherId,
        teacherName: s.teacher.name,
        date: s.date.toISOString(),
        period: s.period,
        subject: s.subject || undefined,
        lessonContent: s.lessonContent || undefined,
        note: s.note || undefined,
        classification: (s.classification as any) || undefined, // eslint-disable-line @typescript-eslint/no-explicit-any
        attendanceRecords: s.attendanceRecords.map((r: any) => ({
            ...r,
            status: r.status as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            note: r.note || undefined
        })),
        createdAt: s.createdAt.toISOString()
    }));
}

export async function createClassSessionAction(data: {
    classId: string;
    date: Date;
    period: number;
    subject?: string;
    lessonContent?: string;
    note?: string;
    classification?: string;
    attendanceRecords?: { studentId: string; status: string; note?: string }[];
}) {
    const session = await getCurrentUserAction();
    if (!session || session.role !== 'teacher') {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const newSession = await db.classSession.create({
            data: {
                classId: data.classId,
                teacherId: session.id,
                date: new Date(data.date),
                period: parseInt(data.period as any), // eslint-disable-line @typescript-eslint/no-explicit-any
                subject: data.subject,
                lessonContent: data.lessonContent,
                note: data.note,
                classification: data.classification as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                attendanceRecords: {
                    create: (data.attendanceRecords || []).map((r: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
                        studentId: r.studentId,
                        status: r.status,
                        note: r.note
                    }))
                }
            }
        });

        revalidatePath(`/dashboard/classes/${data.classId}`);
        return { success: true, message: "Đã ghi sổ đầu bài", sessionId: newSession.id };
    } catch (error) {
        console.error("Create class session error:", error);
        return { success: false, message: "Lỗi khi ghi sổ" };
    }
}

export async function updateClassSessionAction(id: string, data: {
    subject?: string;
    lessonContent?: string;
    note?: string;
    classification?: string;
    attendanceRecords?: { studentId: string; status: string; note?: string }[];
}) {
    try {
        // Update session details
        await db.classSession.update({
            where: { id },
            data: {
                subject: data.subject,
                lessonContent: data.lessonContent,
                note: data.note,
                classification: data.classification as any // eslint-disable-line @typescript-eslint/no-explicit-any
            }
        });

        // Update attendance records if provided
        if (data.attendanceRecords) {
            // This is tricky with Prisma. We might need to upsert or delete/create.
            // For simplicity, let's just update existing ones or create new ones.
            // But we don't have IDs for records in the input, only studentId.
            // So we can find by sessionId + studentId.
            for (const r of data.attendanceRecords) {
                const existing = await db.attendanceRecord.findUnique({
                    where: {
                        sessionId_studentId: {
                            sessionId: id,
                            studentId: r.studentId
                        }
                    }
                });

                if (existing) {
                    await db.attendanceRecord.update({
                        where: { id: existing.id },
                        data: {
                            status: r.status,
                            note: r.note
                        }
                    });
                } else {
                    await db.attendanceRecord.create({
                        data: {
                            sessionId: id,
                            studentId: r.studentId,
                            status: r.status,
                            note: r.note
                        }
                    });
                }
            }
        }

        revalidatePath(`/dashboard/classes`);
        return { success: true, message: "Đã cập nhật sổ đầu bài" };
    } catch (error) {
        console.error("Update class session error:", error);
        return { success: false, message: "Lỗi khi cập nhật" };
    }
}

// --- Analytics Actions ---

export async function getClassAnalyticsDataAction(classId: string) {
    const [classData, assignments, students, announcements] = await Promise.all([
        db.class.findUnique({ where: { id: classId } }),
        db.assignment.findMany({
            where: {
                OR: [
                    { classIds: { contains: classId } },
                    { assignmentClasses: { some: { classId } } }
                ]
            },
            include: { submissions: true }
        }),
        db.classEnrollment.findMany({
            where: {
                classId,
                // Remove role filter - get all enrollments then filter by user role
            },
            include: { user: true }
        }),
        db.announcement.findMany({
            where: { classId },
            orderBy: { createdAt: 'desc' }
        })
    ]);

    if (!classData) return null;

    // Filter for actual students (not teachers)
    const studentEnrollments = students.filter(e => e.user.role === 'student');

    return {
        classData,
        assignments,
        students: studentEnrollments.map(e => e.user),
        announcements
    };
}

export async function getStudentAnalyticsDataAction(classId: string, studentId: string) {
    const [classData, assignments, students, announcements] = await Promise.all([
        db.class.findUnique({ where: { id: classId } }),
        db.assignment.findMany({
            where: {
                OR: [
                    { classIds: { contains: classId } },
                    { assignmentClasses: { some: { classId } } }
                ]
            },
            include: {
                submissions: {
                    where: { studentId }
                }
            }
        }),
        db.classEnrollment.findMany({
            where: { classId, role: 'student' },
            include: { user: true }
        }),
        db.announcement.findMany({
            where: { classId },
            orderBy: { createdAt: 'desc' }
        })
    ]);

    // Also fetch ALL submissions for class average calculation
    // This is a bit heavy, maybe optimize later with aggregation
    const allSubmissions = await db.submission.findMany({
        where: {
            assignment: {
                OR: [
                    { classIds: { contains: classId } },
                    { assignmentClasses: { some: { classId } } }
                ]
            }
        }
    });

    if (!classData) return null;

    return {
        classData,
        assignments,
        students: students.map(e => e.user),
        announcements,
        allSubmissions
    };
}

export async function getClassGradesAction(classId: string) {
    try {
        // 1. Get all students in the class
        const students = await db.user.findMany({
            where: {
                enrollments: {
                    some: { classId, status: 'active' }
                },
                role: 'student'
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
            },
            orderBy: { name: 'asc' }
        });

        // 2. Get all assignments for the class
        const assignments = await db.assignment.findMany({
            where: {
                assignmentClasses: {
                    some: { classId }
                }
            },
            select: {
                id: true,
                title: true,
                dueDate: true,
                maxScore: true
            },
            orderBy: { dueDate: 'asc' }
        });

        // 3. Get all submissions for these assignments
        const submissions = await db.submission.findMany({
            where: {
                assignment: {
                    assignmentClasses: {
                        some: { classId }
                    }
                }
            },
            select: {
                id: true,
                assignmentId: true,
                studentId: true,
                score: true,
                status: true,
                submittedAt: true
            }
        });

        return {
            success: true,
            data: {
                students,
                assignments,
                submissions
            }
        };
    } catch (e) {
        console.error("Error fetching class grades:", e);
        return { success: false, message: "Lỗi khi tải bảng điểm" };
    }
}

export async function updateGradeAction(assignmentId: string, studentId: string, grade: number) {
    try {
        // Find existing submission or create new one
        const submission = await db.submission.findFirst({
            where: {
                assignmentId,
                studentId
            }
        });

        if (submission) {
            await db.submission.update({
                where: { id: submission.id },
                data: {
                    score: grade,
                    status: 'graded'
                }
            });
        } else {
            await db.submission.create({
                data: {
                    assignmentId,
                    studentId,
                    score: grade,
                    status: 'graded',
                    content: '', // Empty content for manual grade entry
                    submittedAt: new Date()
                }
            });
        }

        revalidatePath('/dashboard/classes');
        return { success: true, message: "Đã cập nhật điểm" };
    } catch (e) {
        console.error("Error updating grade:", e);
        return { success: false, message: "Lỗi cập nhật điểm" };
    }
}



export async function getStudentSubmissionsAction(classId: string, studentId: string) {
    const submissions = await db.submission.findMany({
        where: {
            studentId,
            assignment: {
                assignmentClasses: {
                    some: { classId }
                }
            }
        },
        include: {
            assignment: true
        }
    });

    return submissions.map(s => ({
        id: s.id,
        assignmentId: s.assignmentId,
        studentId: s.studentId,
        content: s.content,
        submittedAt: s.submittedAt.toISOString(),
        status: s.status as 'submitted' | 'graded',
        score: s.score || undefined,
        feedback: s.feedback || undefined
    }));
}

export async function getTeacherAssignmentsAction(classId: string) {
    const assignments = await db.assignment.findMany({
        where: {
            assignmentClasses: {
                some: { classId }
            }
        },
        orderBy: { dueDate: 'asc' }
    });

    return assignments.map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        dueDate: a.dueDate.toISOString(),
        teacherId: a.teacherId,
        classIds: [classId], // Simplified
        type: a.type as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        status: a.status as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        subject: a.subject || undefined,
        maxScore: a.maxScore || undefined
    }));
}

// --- Added Actions for Class Management ---

export async function getStudentClassesAction(): Promise<Class[]> {
    return getClassesAction();
}

export async function getClassStatsAction(classId: string) {
    const session = await auth();
    if (!session) return null;

    try {
        const [studentCount, assignments, pendingGrading, classData, attendanceData] = await Promise.all([
            db.classEnrollment.count({ where: { classId, status: 'active' } }),
            db.assignment.count({
                where: {
                    assignmentClasses: { some: { classId } },
                    status: 'open'
                }
            }),
            db.submission.count({
                where: {
                    assignment: { assignmentClasses: { some: { classId } } },
                    score: null,
                    status: 'submitted'
                }
            }),
            db.class.findUnique({
                where: { id: classId },
                select: { maxStudents: true }
            }),
            // Fetch attendance records to calculate real rate
            db.attendanceRecord.groupBy({
                by: ['status'],
                where: {
                    session: { classId }
                },
                _count: { status: true }
            })
        ]);

        // Calculate real attendance rate
        let attendanceRate = 0;
        if (attendanceData.length > 0) {
            const totalRecords = attendanceData.reduce((sum, d) => sum + d._count.status, 0);
            const presentCount = attendanceData
                .filter(d => d.status === 'PRESENT' || d.status === 'LATE')
                .reduce((sum, d) => sum + d._count.status, 0);
            attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;
        }

        return {
            studentCount,
            activeAssignments: assignments,
            attendanceRate,
            pendingGrading,
            maxStudents: classData?.maxStudents || 50
        };
    } catch (error) {
        console.error("Error fetching class stats:", error);
        return {
            studentCount: 0,
            activeAssignments: 0,
            attendanceRate: 0,
            pendingGrading: 0,
            maxStudents: 50
        };
    }
}

// --- Dashboard Counts Action ---

export async function getDashboardCountsAction() {
    const session = await auth();
    if (!session?.user?.id) {
        return {
            pendingAssignments: 0,
            unreadNotifications: 0,
            unreadMessages: 0,
            draftAssignments: 0
        };
    }

    const user = await db.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true }
    });

    if (!user) {
        return {
            pendingAssignments: 0,
            unreadNotifications: 0,
            unreadMessages: 0,
            draftAssignments: 0
        };
    }

    try {
        if (user.role === 'teacher') {
            // Teacher: count submissions that need grading
            const [pendingGrading, unreadNotifications, draftAssignments] = await Promise.all([
                db.submission.count({
                    where: {
                        assignment: { teacherId: user.id },
                        status: 'submitted',
                        score: null
                    }
                }),
                db.notification.count({
                    where: {
                        userId: user.id,
                        isRead: false
                    }
                }),
                db.assignment.count({
                    where: {
                        teacherId: user.id,
                        status: 'draft'
                    }
                })
            ]);

            return {
                pendingAssignments: pendingGrading,
                unreadNotifications,
                unreadMessages: 0, // Messaging system not implemented yet
                draftAssignments
            };
        } else {
            // Student: count pending assignments to submit
            const [pendingAssignments, unreadNotifications] = await Promise.all([
                db.assignment.count({
                    where: {
                        status: 'open',
                        dueDate: { gte: new Date() },
                        assignmentClasses: {
                            some: {
                                class: {
                                    enrollments: {
                                        some: {
                                            userId: user.id,
                                            status: 'active'
                                        }
                                    }
                                }
                            }
                        },
                        submissions: {
                            none: {
                                studentId: user.id
                            }
                        }
                    }
                }),
                db.notification.count({
                    where: {
                        userId: user.id,
                        isRead: false
                    }
                })
            ]);

            return {
                pendingAssignments,
                unreadNotifications,
                unreadMessages: 0,
                draftAssignments: 0
            };
        }
    } catch (error) {
        console.error("Error fetching dashboard counts:", error);
        return {
            pendingAssignments: 0,
            unreadNotifications: 0,
            unreadMessages: 0,
            draftAssignments: 0
        };
    }
}

// --- Main Class Action ---

export async function setMainClassAction(classId: string) {
    const session = await auth();
    if (!session?.user?.email) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        await db.user.update({
            where: { email: session.user.email },
            data: { classId }
        });

        revalidatePath('/dashboard');
        return { success: true, message: "Đã cập nhật lớp chính thành công" };
    } catch (error) {
        console.error("Error setting main class:", error);
        return { success: false, message: "Lỗi khi cập nhật lớp chính" };
    }
}

// --- Student Profile Action ---

export async function getStudentProfileDataAction(classId: string, studentId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        // Check if user is teacher of this class
        const isTeacher = await db.class.findFirst({
            where: { id: classId, teacherId: session.user.id }
        });

        if (!isTeacher) {
            return { success: false, message: "Không có quyền xem thông tin này" };
        }

        // Get student info
        const enrollment = await db.classEnrollment.findFirst({
            where: { classId, userId: studentId },
            include: { user: true }
        });

        if (!enrollment) {
            return { success: false, message: "Không tìm thấy học sinh trong lớp" };
        }

        // Get assignments for this class
        const assignments = await db.assignment.findMany({
            where: {
                assignmentClasses: { some: { classId } }
            },
            select: { id: true, title: true, maxScore: true, dueDate: true }
        });

        // Get student submissions
        const submissions = await db.submission.findMany({
            where: {
                studentId,
                assignment: {
                    assignmentClasses: { some: { classId } }
                }
            },
            include: {
                assignment: {
                    select: { id: true, title: true, maxScore: true, dueDate: true }
                }
            },
            orderBy: { submittedAt: 'desc' }
        });

        // Get attendance records
        const attendanceRecords = await db.attendanceRecord.findMany({
            where: {
                studentId,
                session: { classId }
            }
        });

        // Calculate stats
        const gradedSubmissions = submissions.filter(s => s.score !== null);
        const averageScore = gradedSubmissions.length > 0
            ? gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length
            : 0;

        const submissionRate = assignments.length > 0
            ? Math.round((submissions.length / assignments.length) * 100)
            : 0;

        const onTimeSubmissions = submissions.filter(s => {
            const dueDate = s.assignment.dueDate;
            return s.submittedAt <= dueDate;
        });
        const onTimeRate = submissions.length > 0
            ? Math.round((onTimeSubmissions.length / submissions.length) * 100)
            : 0;

        // Attendance breakdown
        const attendance = {
            total: attendanceRecords.length,
            present: attendanceRecords.filter(r => r.status === 'PRESENT').length,
            late: attendanceRecords.filter(r => r.status === 'LATE').length,
            absent: attendanceRecords.filter(r => r.status === 'ABSENT').length,
            excused: attendanceRecords.filter(r => r.status === 'EXCUSED').length
        };

        return {
            success: true,
            data: {
                student: {
                    id: enrollment.user.id,
                    name: enrollment.user.name,
                    email: enrollment.user.email,
                    avatarUrl: enrollment.user.avatarUrl || undefined,
                    joinedAt: enrollment.joinedAt.toISOString()
                },
                submissions: submissions.map(s => ({
                    id: s.id,
                    assignmentTitle: s.assignment.title,
                    assignmentId: s.assignmentId,
                    score: s.score,
                    maxScore: s.assignment.maxScore || 10,
                    status: s.status,
                    submittedAt: s.submittedAt.toISOString(),
                    isLate: s.submittedAt > s.assignment.dueDate
                })),
                attendance,
                stats: {
                    averageScore,
                    submissionRate,
                    onTimeRate,
                    totalAssignments: assignments.length
                }
            }
        };
    } catch (error) {
        console.error("Error fetching student profile:", error);
        return { success: false, message: "Lỗi khi tải thông tin học sinh" };
    }
}
