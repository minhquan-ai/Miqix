"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ============================================================
// CLASS SETTINGS ACTIONS
// ============================================================

export type AnnouncementPermission = "TEACHER_ONLY" | "TEACHER_AND_MONITOR" | "ALL";
export type AttachmentPermission = "TEACHER_ONLY" | "TEACHER_AND_MONITOR" | "ALL";
export type StudentRole = "student" | "monitor" | "vice_monitor" | "teacher";

export interface ClassSettingsData {
    // Stream/Announcement permissions
    announcementPermission: AnnouncementPermission;
    attachmentPermission: AttachmentPermission;
    allowComments: boolean;
    allowReactions: boolean;

    // Assignment settings
    defaultMaxScore: number;
    allowLateSubmission: boolean;
    latePenaltyPercent: number;
    autoReminder: boolean;
    reminderDaysBefore: number;

    // Resource settings
    resourceUploadPermission: AttachmentPermission;
    maxFileSizeMB: number;

    // Member settings
    requireApproval: boolean;
    allowStudentDirectory: boolean;

    // Grade settings
    hideGradesFromStudents: boolean;
    showGradeStatistics: boolean;

    // Notification settings
    emailNotifications: boolean;
    pushNotifications: boolean;
    newAnnouncementNotify: boolean;
    newAssignmentNotify: boolean;
    deadlineReminderNotify: boolean;
    gradePostedNotify: boolean;
}
/**
 * Get class settings. Creates default settings if not exists.
 */
export async function getClassSettingsAction(classId: string) {
    try {
        let settings = await db.classSettings.findUnique({
            where: { classId },
        });

        // Create default settings if not exists
        if (!settings) {
            settings = await db.classSettings.create({
                data: {
                    classId,
                    // Stream permissions
                    announcementPermission: "TEACHER_ONLY",
                    attachmentPermission: "TEACHER_ONLY",
                    allowComments: true,
                    allowReactions: true,
                    // Assignment settings
                    defaultMaxScore: 10,
                    allowLateSubmission: true,
                    latePenaltyPercent: 10,
                    autoReminder: true,
                    reminderDaysBefore: 1,
                    // Resource settings
                    resourceUploadPermission: "TEACHER_ONLY",
                    maxFileSizeMB: 50,
                    // Member settings
                    requireApproval: false,
                    allowStudentDirectory: true,
                    // Grade settings
                    hideGradesFromStudents: false,
                    showGradeStatistics: true,
                    // Notification settings
                    emailNotifications: true,
                    pushNotifications: true,
                    newAnnouncementNotify: true,
                    newAssignmentNotify: true,
                    deadlineReminderNotify: true,
                    gradePostedNotify: true,
                },
            });
        }

        return { success: true, settings };
    } catch (error) {
        console.error("getClassSettingsAction error:", error);
        return { success: false, error: "Failed to get class settings" };
    }
}

/**
 * Update class settings. Only teacher can update.
 */
export async function updateClassSettingsAction(
    classId: string,
    teacherId: string,
    data: Partial<ClassSettingsData>
) {
    try {
        // Verify teacher owns this class
        const classData = await db.class.findUnique({
            where: { id: classId },
            select: { teacherId: true },
        });

        if (!classData || classData.teacherId !== teacherId) {
            return { success: false, error: "Không có quyền thực hiện" };
        }

        const settings = await db.classSettings.upsert({
            where: { classId },
            create: {
                classId,
                ...data,
            },
            update: data,
        });

        revalidatePath(`/dashboard/classes/${classId}`);
        return { success: true, settings };
    } catch (error) {
        console.error("updateClassSettingsAction error:", error);
        return { success: false, error: "Cập nhật thất bại" };
    }
}

/**
 * Get full class info with settings, members, pinned announcements
 */
export async function getClassInfoAction(classId: string, userId: string) {
    try {
        // Get class with settings and teacher
        const classData = await db.class.findUnique({
            where: { id: classId },
            include: {
                teacher: {
                    select: { id: true, name: true, avatarUrl: true },
                },
                settings: true,
            },
        });

        if (!classData) {
            return { success: false, error: "Lớp học không tồn tại" };
        }

        // Auto-create settings if not exists (for existing classes)
        let settings = classData.settings;
        if (!settings) {
            settings = await db.classSettings.create({
                data: {
                    classId,
                    announcementPermission: "TEACHER_ONLY",
                    allowComments: true,
                    allowReactions: true,
                    attachmentPermission: "TEACHER_ONLY",
                    requireApproval: false,
                },
            });
        }

        // Get enrollments with user details
        const enrollments = await db.classEnrollment.findMany({
            where: { classId, status: "active" },
            include: {
                user: {
                    select: { id: true, name: true, avatarUrl: true, role: true },
                },
            },
            orderBy: [
                { role: "asc" }, // monitor, student, vice_monitor
                { joinedAt: "asc" },
            ],
        });

        // Get pinned announcements (limit 5)
        const pinnedAnnouncements = await db.announcement.findMany({
            where: { classId, isPinned: true },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
                id: true,
                title: true,
                content: true,
                type: true,
                createdAt: true,
            },
        });

        // Get recent announcements with attachments (for media/files)
        const recentWithAttachments = await db.announcement.findMany({
            where: {
                classId,
                attachments: { not: "[]" },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
                id: true,
                attachments: true,
                createdAt: true,
            },
        });

        // Parse attachments
        const recentMedia: { name: string; url: string; type: string; announcementId: string }[] = [];
        recentWithAttachments.forEach((a) => {
            try {
                const attachments = JSON.parse(a.attachments || "[]");
                attachments.forEach((att: { name: string; url: string; type: string }) => {
                    recentMedia.push({ ...att, announcementId: a.id });
                });
            } catch { }
        });

        // Stats
        const stats = {
            studentCount: enrollments.length,
            announcementCount: await db.announcement.count({ where: { classId } }),
            assignmentCount: await db.assignmentClass.count({ where: { classId } }),
            resourceCount: await db.classResource.count({ where: { classId } }),
        };

        // Check user's enrollment
        const userEnrollment = enrollments.find((e) => e.userId === userId);
        const isTeacher = classData.teacherId === userId;

        return {
            success: true,
            data: {
                classInfo: {
                    id: classData.id,
                    name: classData.name,
                    subject: classData.subject,
                    description: classData.description,
                    code: classData.code,
                    codeEnabled: classData.codeEnabled,
                    color: classData.color,
                    avatar: classData.avatar,
                },
                teacher: classData.teacher,
                settings: classData.settings,
                members: enrollments.map((e) => ({
                    ...e.user,
                    role: e.role,
                    joinedAt: e.joinedAt,
                    isPinned: e.isPinned,
                    notificationsEnabled: e.notificationsEnabled,
                })),
                pinnedAnnouncements,
                recentMedia: recentMedia.slice(0, 12),
                stats,
                userRole: isTeacher ? "teacher" : (userEnrollment?.role || null),
                isMember: isTeacher || !!userEnrollment,
            },
        };
    } catch (error) {
        console.error("getClassInfoAction error:", error);
        return { success: false, error: "Lỗi khi lấy thông tin lớp" };
    }
}

/**
 * Assign role to a student. Only teacher can assign.
 */
export async function assignStudentRoleAction(
    classId: string,
    teacherId: string,
    studentId: string,
    role: StudentRole
) {
    try {
        // Verify teacher owns this class
        const classData = await db.class.findUnique({
            where: { id: classId },
            select: { teacherId: true },
        });

        if (!classData || classData.teacherId !== teacherId) {
            return { success: false, error: "Không có quyền thực hiện" };
        }

        // If assigning monitor, demote current monitor
        if (role === "monitor") {
            await db.classEnrollment.updateMany({
                where: { classId, role: "monitor" },
                data: { role: "student" },
            });
        }

        // Update student role
        const enrollment = await db.classEnrollment.update({
            where: {
                userId_classId: {
                    userId: studentId,
                    classId,
                },
            },
            data: { role },
        });

        revalidatePath(`/dashboard/classes/${classId}`);
        return { success: true, enrollment };
    } catch (error) {
        console.error("assignStudentRoleAction error:", error);
        return { success: false, error: "Gán vai trò thất bại" };
    }
}

/**
 * Toggle notifications for a member. User can only toggle their own.
 */
export async function toggleMemberNotificationsAction(
    classId: string,
    userId: string,
    enabled: boolean
) {
    try {
        const enrollment = await db.classEnrollment.update({
            where: {
                userId_classId: {
                    userId,
                    classId,
                },
            },
            data: {
                notificationsEnabled: enabled,
                mutedUntil: enabled ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            },
        });

        revalidatePath(`/dashboard/classes/${classId}`);
        return { success: true, enrollment };
    } catch (error) {
        console.error("toggleMemberNotificationsAction error:", error);
        return { success: false, error: "Cập nhật thất bại" };
    }
}

/**
 * Check if user can post announcement based on class settings
 */
export async function canPostAnnouncementAction(
    classId: string,
    userId: string
): Promise<{ canPost: boolean; reason?: string }> {
    try {
        const classData = await db.class.findUnique({
            where: { id: classId },
            include: { settings: true },
        });

        if (!classData) {
            return { canPost: false, reason: "Lớp không tồn tại" };
        }

        // Teacher can always post
        if (classData.teacherId === userId) {
            return { canPost: true };
        }

        const permission = classData.settings?.announcementPermission || "TEACHER_ONLY";

        if (permission === "ALL") {
            return { canPost: true };
        }

        if (permission === "TEACHER_AND_MONITOR") {
            const enrollment = await db.classEnrollment.findUnique({
                where: { userId_classId: { userId, classId } },
            });

            if (enrollment?.role === "monitor" || enrollment?.role === "vice_monitor") {
                return { canPost: true };
            }
        }

        return { canPost: false, reason: "Bạn không có quyền đăng thông báo" };
    } catch (error) {
        console.error("canPostAnnouncementAction error:", error);
        return { canPost: false, reason: "Lỗi hệ thống" };
    }
}

/**
 * Regenerate class join code. Only teacher can regenerate.
 */
export async function regenerateClassCodeAction(classId: string, teacherId: string) {
    try {
        // Verify teacher owns this class
        const classData = await db.class.findUnique({
            where: { id: classId },
            select: { teacherId: true },
        });

        if (!classData || classData.teacherId !== teacherId) {
            return { success: false, error: "Không có quyền thực hiện" };
        }

        // Generate new 6-char code
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const updatedClass = await db.class.update({
            where: { id: classId },
            data: { code: newCode },
        });

        revalidatePath(`/dashboard/classes/${classId}`);
        revalidatePath(`/dashboard/classes/${classId}/settings`);

        return { success: true, newCode: updatedClass.code };
    } catch (error) {
        console.error("regenerateClassCodeAction error:", error);
        return { success: false, error: "Tạo mã mới thất bại" };
    }
}

/**
 * Export class roster as CSV data. Only teacher can export.
 */
export async function exportClassRosterAction(classId: string, teacherId: string) {
    try {
        // Verify teacher owns this class
        const classData = await db.class.findUnique({
            where: { id: classId },
            select: { teacherId: true, name: true },
        });

        if (!classData || classData.teacherId !== teacherId) {
            return { success: false, error: "Không có quyền thực hiện" };
        }

        // Get all enrollments with user details
        const enrollments = await db.classEnrollment.findMany({
            where: { classId, status: "active" },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: [
                { role: "asc" },
                { user: { name: "asc" } },
            ],
        });

        // Build CSV content
        const headers = ["STT", "Họ và tên", "Email", "Vai trò", "Ngày tham gia"];
        const rows = enrollments.map((e, index) => {
            const roleName = e.role === "monitor" ? "Lớp trưởng"
                : e.role === "vice_monitor" ? "Lớp phó"
                    : "Học sinh";
            return [
                (index + 1).toString(),
                e.user.name,
                e.user.email,
                roleName,
                new Date(e.joinedAt).toLocaleDateString("vi-VN"),
            ];
        });

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        return {
            success: true,
            csvContent,
            filename: `danh-sach-${classData.name.replace(/\s+/g, "-").toLowerCase()}.csv`
        };
    } catch (error) {
        console.error("exportClassRosterAction error:", error);
        return { success: false, error: "Xuất danh sách thất bại" };
    }
}
