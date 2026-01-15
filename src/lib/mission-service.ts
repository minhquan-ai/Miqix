import { db } from '@/lib/db';
import { Mission } from '@/types';

type MissionRecord = Awaited<ReturnType<typeof db.mission.findMany>>[number];

const parseProgress = (progress?: string | null) => {
    if (!progress) return undefined;
    try {
        return JSON.parse(progress);
    } catch (error) {
        console.error('Failed to parse mission progress', error);
        return undefined;
    }
};

const mapMission = (mission: MissionRecord): Mission => {
    return {
        id: mission.id,
        title: mission.title,
        description: mission.description,
        type: mission.type as Mission['type'],
        category: mission.category as Mission['category'],
        createdBy: mission.createdBy,
        assignedTo: mission.assignedTo,
        relatedAssignmentId: mission.relatedAssignmentId || undefined,
        relatedClassId: mission.relatedClassId || undefined,
        dueDate: mission.dueDate ? mission.dueDate.toISOString() : undefined,
        status: mission.status as Mission['status'],
        completedAt: mission.completedAt ? mission.completedAt.toISOString() : undefined,
        progress: parseProgress(mission.progress)
    };
};

async function ensureSystemMissionsForTeacher(teacherId: string) {
    const assignments = await db.assignment.findMany({
        where: { teacherId },
        include: {
            submissions: true,
            assignmentClasses: {
                include: {
                    class: true
                }
            }
        }
    });

    await Promise.all(assignments.map(async (assignment) => {
        const totalSubmissions = assignment.submissions.length;

        if (totalSubmissions === 0) {
            return;
        }

        const graded = assignment.submissions.filter(s => s.status === 'graded').length;
        const pending = totalSubmissions - graded;

        const progress = {
            current: graded,
            total: totalSubmissions
        };

        const existingMission = await db.mission.findFirst({
            where: {
                type: 'system',
                relatedAssignmentId: assignment.id,
                assignedTo: teacherId
            }
        });

        const description = pending > 0
            ? `Còn ${pending} bài nộp đang chờ chấm cho "${assignment.title}"`
            : `Đã hoàn thành chấm bài cho "${assignment.title}"`;

        const baseData = {
            title: `Chấm bài "${assignment.title}"`,
            description,
            type: 'system' as const,
            category: 'grading' as const,
            createdBy: 'system',
            assignedTo: teacherId,
            relatedAssignmentId: assignment.id,
            relatedClassId: assignment.assignmentClasses[0]?.classId,
            dueDate: assignment.dueDate,
            progress: JSON.stringify(progress),
            status: pending === 0 ? 'completed' as const : (graded > 0 ? 'in_progress' as const : 'pending' as const),
            completedAt: pending === 0 ? new Date() : null
        };

        if (existingMission) {
            await db.mission.update({
                where: { id: existingMission.id },
                data: {
                    description: baseData.description,
                    progress: baseData.progress,
                    status: baseData.status,
                    dueDate: baseData.dueDate,
                    relatedClassId: baseData.relatedClassId,
                    completedAt: baseData.completedAt ?? undefined
                }
            });
        } else if (pending > 0) {
            await db.mission.create({
                data: {
                    ...baseData,
                    completedAt: undefined
                }
            });
        }
    }));
}

export async function fetchMissionsAssignedTo(userId: string): Promise<Mission[]> {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true }
    });

    if (user?.role === 'teacher') {
        await ensureSystemMissionsForTeacher(userId);
    }

    const missions = await db.mission.findMany({
        where: { assignedTo: userId },
        orderBy: [
            { status: 'asc' },
            { dueDate: 'asc' }
        ]
    });

    return missions.map(mapMission);
}

export async function fetchMissionsCreatedBy(userId: string): Promise<Mission[]> {
    const missions = await db.mission.findMany({
        where: { createdBy: userId },
        orderBy: { createdAt: 'desc' }
    });

    return missions.map(mapMission);
}
