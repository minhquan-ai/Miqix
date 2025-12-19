'use server';

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

// =====================================================
// ANNOUNCEMENT ACTIONS (Class Stream)
// =====================================================

/**
 * Get all announcements for a class with comments and reactions
 */
export async function getClassAnnouncementsAction(classId: string) {
    try {
        const announcements = await db.announcement.findMany({
            where: { classId },
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                        email: true
                    }
                },
                comments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatarUrl: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                },
                reactions: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { isPinned: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        return announcements;
    } catch (error) {
        console.error("Get announcements error:", error);
        return [];
    }
}

/**
 * Create a new announcement (teacher only)
 */
export async function createAnnouncementAction(
    classId: string,
    teacherId: string,
    data: {
        title?: string;
        content: string;
        type?: 'NORMAL' | 'IMPORTANT' | 'URGENT' | 'EVENT';
        attachments?: Array<{ name: string; url: string; type: string }>;
    }
) {
    try {
        // Verify user is the teacher of this class
        const classData = await db.class.findUnique({
            where: { id: classId },
            select: { teacherId: true }
        });

        if (!classData || classData.teacherId !== teacherId) {
            return { success: false, message: "Bạn không có quyền đăng bài trong lớp này" };
        }

        const announcement = await db.announcement.create({
            data: {
                classId,
                teacherId,
                title: data.title || null,
                content: data.content,
                type: data.type || 'NORMAL',
                attachments: data.attachments ? JSON.stringify(data.attachments) : '[]'
            },
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                    }
                }
            }
        });

        revalidatePath(`/dashboard/classes/${classId}`);
        return { success: true, data: announcement };
    } catch (error) {
        console.error("Create announcement error:", error);
        return { success: false, message: "Lỗi khi tạo bài đăng" };
    }
}

/**
 * Add a comment to an announcement
 */
export async function addCommentAction(
    announcementId: string,
    userId: string,
    content: string
) {
    try {
        const comment = await db.comment.create({
            data: {
                announcementId,
                userId,
                content
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                    }
                }
            }
        });

        // Get class ID to revalidate
        const announcement = await db.announcement.findUnique({
            where: { id: announcementId },
            select: { classId: true }
        });

        if (announcement) {
            revalidatePath(`/dashboard/classes/${announcement.classId}`);
        }

        return { success: true, data: comment };
    } catch (error) {
        console.error("Add comment error:", error);
        return { success: false, message: "Lỗi khi thêm bình luận" };
    }
}

/**
 * Delete a comment (author or teacher only)
 */
export async function deleteCommentAction(commentId: string, userId: string) {
    try {
        const comment = await db.comment.findUnique({
            where: { id: commentId },
            include: {
                announcement: {
                    include: {
                        class: {
                            select: { teacherId: true }
                        }
                    }
                }
            }
        });

        if (!comment) {
            return { success: false, message: "Không tìm thấy bình luận" };
        }

        // Check permission: comment author or class teacher
        if (comment.userId !== userId && comment.announcement.class.teacherId !== userId) {
            return { success: false, message: "Bạn không có quyền xóa bình luận này" };
        }

        await db.comment.delete({
            where: { id: commentId }
        });

        revalidatePath(`/dashboard/classes/${comment.announcement.classId}`);
        return { success: true };
    } catch (error) {
        console.error("Delete comment error:", error);
        return { success: false, message: "Lỗi khi xóa bình luận" };
    }
}

/**
 * Toggle reaction on an announcement
 */
export async function toggleReactionAction(
    announcementId: string,
    userId: string,
    type: string = 'like'
) {
    try {
        // Check if user already reacted with this type
        const existingReaction = await db.reaction.findFirst({
            where: {
                announcementId,
                userId,
                type
            }
        });

        if (existingReaction) {
            // Remove reaction
            await db.reaction.delete({
                where: { id: existingReaction.id }
            });
        } else {
            // Add reaction
            await db.reaction.create({
                data: {
                    announcementId,
                    userId,
                    type
                }
            });
        }

        // Get class ID to revalidate
        const announcement = await db.announcement.findUnique({
            where: { id: announcementId },
            select: { classId: true }
        });

        if (announcement) {
            revalidatePath(`/dashboard/classes/${announcement.classId}`);
        }

        return { success: true };
    } catch (error) {
        console.error("Toggle reaction error:", error);
        return { success: false, message: "Lỗi khi thêm phản ứng" };
    }
}
