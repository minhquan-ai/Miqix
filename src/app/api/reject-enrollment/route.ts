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

        // Update status to rejected
        await db.classEnrollment.update({
            where: { id: enrollmentId },
            data: { status: 'rejected' }
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
            message: 'Đã từ chối yêu cầu'
        });

    } catch (error) {
        console.error('Reject error:', error);
        return NextResponse.json(
            { success: false, message: 'Có lỗi xảy ra' },
            { status: 500 }
        );
    }
}
