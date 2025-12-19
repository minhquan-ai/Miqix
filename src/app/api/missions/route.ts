import { NextResponse } from 'next/server';
import { fetchMissionsAssignedTo, fetchMissionsCreatedBy } from '@/lib/mission-service';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const assignedTo = searchParams.get('assignedTo');
    const createdBy = searchParams.get('createdBy');

    if (!assignedTo && !createdBy) {
        return NextResponse.json({
            success: false,
            message: 'Thiếu tham số assignedTo hoặc createdBy'
        }, { status: 400 });
    }

    try {
        const [assigned, created] = await Promise.all([
            assignedTo ? fetchMissionsAssignedTo(assignedTo) : Promise.resolve([]),
            createdBy ? fetchMissionsCreatedBy(createdBy) : Promise.resolve([])
        ]);

        return NextResponse.json({
            success: true,
            assignedMissions: assignedTo ? assigned : undefined,
            createdMissions: createdBy ? created : undefined
        });
    } catch (error) {
        console.error('Mission route error', error);
        return NextResponse.json({
            success: false,
            message: 'Không thể tải nhiệm vụ'
        }, { status: 500 });
    }
}
