import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
    try {
        const { enrollmentId } = await request.json();

        if (!enrollmentId) {
            return NextResponse.json(
                { success: false, message: 'Thiếu enrollment ID' },
                { status: 400 }
            );
        }

        // Update status to active
        await db.classEnrollment.update({
            where: { id: enrollmentId },
            data: { status: 'active' }
        });

        // Get class ID for revalidation
        const enrollment = await db.classEnrollment.findUnique({
            where: { id: enrollmentId },
            select: { classId: true }
        });

        if (enrollment) {
            revalidatePath(`/dashboard/classes/${enrollment.classId}/roster`);
        }

        return NextResponse.json({
            success: true,
            message: 'Đã duyệt học sinh vào lớp'
        });

    } catch (error) {
        console.error('Approve error:', error);
        return NextResponse.json(
            { success: false, message: 'Có lỗi xảy ra' },
            { status: 500 }
        );
    }
}
