"use server";

import { db } from "@/lib/db";
import { getCurrentUserAction } from "@/lib/actions";
import { revalidatePath } from "next/cache";

// ============ WORKSHEET ACTIONS ============

/**
 * Create a worksheet-type assignment
 */
export async function createWorksheetAction(data: {
    title: string;
    description?: string;
    worksheetCode?: string;
    subject?: string;
    worksheetFileUrl: string;
    worksheetFileType: string;
    classIds: string[];
    dueDate?: string;
    requirePhoto?: boolean;
}) {
    const user = await getCurrentUserAction();
    if (!user || user.role !== 'teacher') {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const assignment = await db.assignment.create({
            data: {
                title: data.title,
                description: data.description || '',
                worksheetCode: data.worksheetCode,
                subject: data.subject,
                worksheetFileUrl: data.worksheetFileUrl,
                worksheetFileType: data.worksheetFileType,
                dueDate: data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week
                teacherId: user.id,
                type: 'worksheet',
                isWorksheetMode: true,
                requirePhoto: data.requirePhoto || false,
                status: 'open',
                classIds: JSON.stringify(data.classIds),
                assignmentClasses: {
                    create: data.classIds.map(classId => ({ classId }))
                }
            }
        });

        revalidatePath('/dashboard/assignments');
        revalidatePath('/dashboard/missions');

        return { success: true, assignment };
    } catch (error) {
        console.error("Create worksheet error:", error);
        return { success: false, message: "Lỗi khi tạo đề cương" };
    }
}

/**
 * Get worksheet progress for a class
 */
export async function getWorksheetProgressAction(assignmentId: string) {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, message: "Unauthorized" };

    try {
        const assignment = await db.assignment.findUnique({
            where: { id: assignmentId },
            include: {
                worksheetProgress: {
                    include: {
                        student: {
                            select: { id: true, name: true, avatarUrl: true }
                        }
                    }
                },
                assignmentClasses: {
                    include: {
                        class: {
                            include: {
                                enrollments: {
                                    where: { status: 'active' },
                                    include: {
                                        user: {
                                            select: { id: true, name: true, avatarUrl: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!assignment) {
            return { success: false, message: "Không tìm thấy bài tập" };
        }

        // Build progress map
        const progressMap = new Map(
            assignment.worksheetProgress.map(p => [p.studentId, p])
        );

        // Get all students from all classes
        const allStudents: { id: string; name: string; avatarUrl: string | null; status: string; completedAt?: Date | null }[] = [];

        for (const ac of assignment.assignmentClasses) {
            for (const enrollment of ac.class.enrollments) {
                const progress = progressMap.get(enrollment.user.id) as any;
                allStudents.push({
                    id: enrollment.user.id,
                    name: enrollment.user.name,
                    avatarUrl: enrollment.user.avatarUrl,
                    status: progress?.status || 'not_started',
                    completedAt: progress?.completedAt
                });
            }
        }

        const completed = allStudents.filter(s => s.status === 'completed').length;
        const total = allStudents.length;

        return {
            success: true,
            data: {
                assignmentId: assignment.id,
                title: assignment.title,
                worksheetCode: assignment.worksheetCode,
                dueDate: assignment.dueDate,
                total,
                completed,
                percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
                students: allStudents
            }
        };
    } catch (error) {
        console.error("Get worksheet progress error:", error);
        return { success: false, message: "Lỗi khi lấy tiến độ" };
    }
}

/**
 * Mark worksheet as completed (student action)
 */
export async function markWorksheetCompleteAction(assignmentId: string, photoUrl?: string) {
    const user = await getCurrentUserAction();
    if (!user || user.role !== 'student') {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const assignment = await db.assignment.findUnique({
            where: { id: assignmentId }
        });

        if (!assignment) {
            return { success: false, message: "Không tìm thấy bài tập" };
        }

        if (assignment.requirePhoto && !photoUrl) {
            return { success: false, message: "Vui lòng chụp ảnh bài làm" };
        }

        // Upsert progress
        const progress = await db.worksheetProgress.upsert({
            where: {
                assignmentId_studentId: {
                    assignmentId,
                    studentId: user.id
                }
            },
            update: {
                status: 'completed',
                completedAt: new Date(),
                photoUrl: photoUrl || undefined,
                photoUploadedAt: photoUrl ? new Date() : undefined
            },
            create: {
                assignmentId,
                studentId: user.id,
                status: 'completed',
                completedAt: new Date(),
                photoUrl: photoUrl || undefined,
                photoUploadedAt: photoUrl ? new Date() : undefined
            }
        });

        // Award XP
        await db.user.update({
            where: { id: user.id },
            data: {
                xp: { increment: assignment.xpReward || 50 }
            }
        });

        revalidatePath('/dashboard/missions');
        revalidatePath('/dashboard/assignments');

        return { success: true, progress };
    } catch (error) {
        console.error("Mark worksheet complete error:", error);
        return { success: false, message: "Lỗi khi đánh dấu hoàn thành" };
    }
}

/**
 * Mark worksheet as viewed (student action)
 */
export async function markWorksheetViewedAction(assignmentId: string) {
    const user = await getCurrentUserAction();
    if (!user) return { success: false };

    try {
        await db.worksheetProgress.upsert({
            where: {
                assignmentId_studentId: {
                    assignmentId,
                    studentId: user.id
                }
            },
            update: {
                viewedAt: new Date(),
                status: 'viewed'
            },
            create: {
                assignmentId,
                studentId: user.id,
                status: 'viewed',
                viewedAt: new Date()
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Mark worksheet viewed error:", error);
        return { success: false };
    }
}

/**
 * Get student's worksheet progress
 */
export async function getStudentWorksheetProgressAction(assignmentId: string) {
    const user = await getCurrentUserAction();
    if (!user) return null;

    try {
        const progress = await db.worksheetProgress.findUnique({
            where: {
                assignmentId_studentId: {
                    assignmentId,
                    studentId: user.id
                }
            }
        });

        return progress;
    } catch (error) {
        console.error("Get student worksheet progress error:", error);
        return null;
    }
}

/**
 * Send reminder to students who haven't completed
 */
export async function sendWorksheetReminderAction(assignmentId: string) {
    const user = await getCurrentUserAction();
    if (!user || user.role !== 'teacher') {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const progressData = await getWorksheetProgressAction(assignmentId);
        if (!progressData.success || !progressData.data) {
            return { success: false, message: "Không lấy được dữ liệu" };
        }

        const notCompleted = progressData.data.students.filter(s => s.status !== 'completed');

        // Create notifications for each student
        for (const student of notCompleted) {
            await db.notification.create({
                data: {
                    userId: student.id,
                    type: 'academic',
                    title: '📝 Nhắc nhở làm bài',
                    message: `Bạn chưa hoàn thành "${progressData.data.title}". Hãy làm ngay nhé!`,
                    link: `/dashboard/assignments/${assignmentId}`
                }
            });
        }

        return {
            success: true,
            message: `Đã gửi nhắc nhở cho ${notCompleted.length} học sinh`
        };
    } catch (error) {
        console.error("Send worksheet reminder error:", error);
        return { success: false, message: "Lỗi khi gửi nhắc nhở" };
    }
}

/**
 * Get worksheets for a class
 */
export async function getClassWorksheetsAction(classId: string) {
    try {
        const worksheets = await db.assignment.findMany({
            where: {
                isWorksheetMode: true,
                assignmentClasses: {
                    some: { classId }
                }
            },
            include: {
                teacher: {
                    select: { name: true }
                },
                worksheetProgress: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return worksheets.map(w => ({
            id: w.id,
            title: w.title,
            worksheetCode: w.worksheetCode,
            subject: w.subject,
            dueDate: w.dueDate,
            fileUrl: w.worksheetFileUrl,
            fileType: w.worksheetFileType,
            teacherName: w.teacher.name,
            completedCount: w.worksheetProgress.filter(p => p.status === 'completed').length,
            totalProgress: w.worksheetProgress.length
        }));
    } catch (error) {
        console.error("Get class worksheets error:", error);
        return [];
    }
}
