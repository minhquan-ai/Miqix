
import { db } from '../src/lib/db';
import { createAssignmentAction } from '../src/lib/actions';

async function main() {
    console.log('Starting verification...');

    // 1. Create a dummy teacher
    const teacher = await db.user.create({
        data: {
            name: 'Test Teacher',
            email: `teacher-${Date.now()}@test.com`,
            role: 'teacher',
        }
    });
    console.log('Created teacher:', teacher.id);

    // 2. Create a dummy class
    const class1 = await db.class.create({
        data: {
            name: 'Test Class 1',
            subject: 'Math',
            code: `TEST${Date.now().toString().slice(-4)}`,
            teacherId: teacher.id
        }
    });
    console.log('Created class:', class1.id);

    // 3. Create an assignment using the action
    const assignmentData = {
        title: 'Test Assignment',
        description: 'Testing refactor',
        dueDate: new Date().toISOString(),
        classIds: [class1.id],
        status: 'open',
        type: 'exercise',
        xpReward: 100,
        subject: 'Math',
        maxScore: 10
    };

    // Mock session for action (since we can't easily mock next-auth session in script without more setup, 
    // we might need to call db directly or mock DataService.getCurrentUser)
    // Actually, createAssignmentAction calls DataService.getCurrentUser(). 
    // We can't easily mock that here.
    // So let's test the DB creation logic directly to verify the schema, 
    // or we can try to mock the module if we were using a test runner.

    // Instead of calling the action, let's manually replicate the create logic to verify Prisma works
    // This confirms the schema is correct and Prisma Client is generated correctly.

    console.log('Creating assignment directly via Prisma...');
    const newAssignment = await db.assignment.create({
        data: {
            title: assignmentData.title,
            description: assignmentData.description,
            dueDate: new Date(assignmentData.dueDate),
            teacherId: teacher.id,
            status: assignmentData.status,
            type: assignmentData.type,
            xpReward: assignmentData.xpReward,
            subject: assignmentData.subject,
            maxScore: assignmentData.maxScore,
            assignmentClasses: {
                create: assignmentData.classIds.map((id: string) => ({
                    classId: id,
                    dueDate: new Date(assignmentData.dueDate),
                    config: JSON.stringify({})
                }))
            }
        },
        include: {
            assignmentClasses: true
        }
    });

    console.log('Created assignment:', newAssignment.id);
    console.log('Assignment classes:', newAssignment.assignmentClasses);

    if (newAssignment.assignmentClasses.length === 1 && newAssignment.assignmentClasses[0].classId === class1.id) {
        console.log('SUCCESS: Assignment linked to class correctly via AssignmentClass!');
    } else {
        console.error('FAILURE: Assignment not linked correctly.');
    }

    // Cleanup
    await db.assignment.delete({ where: { id: newAssignment.id } });
    await db.class.delete({ where: { id: class1.id } });
    await db.user.delete({ where: { id: teacher.id } });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
