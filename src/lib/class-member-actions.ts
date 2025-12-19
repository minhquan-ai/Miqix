'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";

/**
 * Get class members (students enrolled in a class)
 */
export async function getClassMembersAction(classId: string) {
    try {
        const enrollments = await db.classEnrollment.findMany({
            where: { classId, status: 'active' },
            include: { user: true },
            orderBy: { joinedAt: 'asc' }
        });

        return enrollments.map(e => ({
            id: e.user.id,
            name: e.user.name,
            email: e.user.email,
            role: e.user.role as 'teacher' | 'student',
            avatarUrl: e.user.avatarUrl || undefined,
            enrollmentId: e.id,
            joinedAt: e.joinedAt
        }));
    } catch (error) {
        console.error("Failed to get class members:", error);
        return [];
    }
}

/**
 * Get user enrollments
 */
export async function getUserEnrollmentsAction() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        const enrollments = await db.classEnrollment.findMany({
            where: { userId: session.user.id, status: 'active' },
            include: { class: true }
        });

        return enrollments.map(e => ({
            id: e.id,
            userId: e.userId,
            classId: e.classId,
            role: e.role,
            isPinned: e.isPinned,
            className: e.class.name
        }));
    } catch (error) {
        console.error("Failed to get user enrollments:", error);
        return [];
    }
}

/**
 * Remove student from class
 */
export async function removeStudentFromClassAction(enrollmentId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const enrollment = await db.classEnrollment.findUnique({
            where: { id: enrollmentId },
            include: { class: true }
        });

        if (!enrollment) {
            return { success: false, message: "Enrollment not found" };
        }

        // Check if user is teacher of the class or is removing themselves
        if (enrollment.class.teacherId !== session.user.id && enrollment.userId !== session.user.id) {
            return { success: false, message: "Unauthorized" };
        }

        await db.classEnrollment.delete({
            where: { id: enrollmentId }
        });

        return { success: true, message: "Student removed successfully" };
    } catch (error) {
        console.error("Failed to remove student:", error);
        return { success: false, message: "Failed to remove student" };
    }
}
