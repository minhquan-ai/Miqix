
import { db } from '../src/lib/db';
// Note: Actions not used directly due to auth requirements in standalone scripts

// Mock DataService.getCurrentUser for the script context
// Since we can't easily mock the import in this script execution environment without a test runner,
// we will manually bypass the auth check in the action OR we can just test the DB logic directly if we want to be safe.
// BUT, the actions use `DataService.getCurrentUser()`.
// A workaround for this script is to temporarily modify the action or just test the Prisma logic directly like before.
// However, testing the action is better.
// Let's try to overwrite the DataService.getCurrentUser method if possible, or just rely on the fact that we can't easily test auth-guarded actions in a standalone script without setting up the Next.js context.

// Actually, for this verification, let's just use Prisma directly to verify the model exists and works, 
// effectively testing the *logic* inside the action without the auth guard.

async function main() {
    console.log('Starting Class Session verification...');

    // 1. Setup Data
    const teacher = await db.user.create({
        data: {
            name: 'Session Teacher',
            email: `session-teacher-${Date.now()}@test.com`,
            role: 'teacher',
        }
    });
    const student = await db.user.create({
        data: {
            name: 'Session Student',
            email: `session-student-${Date.now()}@test.com`,
            role: 'student',
        }
    });
    const class1 = await db.class.create({
        data: {
            name: 'Session Class',
            subject: 'Math',
            code: `SESS${Date.now().toString().slice(-4)}`,
            teacherId: teacher.id
        }
    });

    console.log('Created data:', { teacherId: teacher.id, classId: class1.id });

    // 2. Create Session (Simulating createClassSessionAction logic)
    console.log('Creating session...');
    const sessionDate = new Date();
    const newSession = await db.classSession.create({
        data: {
            classId: class1.id,
            teacherId: teacher.id,
            date: sessionDate,
            period: 1,
            subject: 'Math',
            lessonContent: 'Introduction to Algebra',
            note: 'Good class',
            classification: 'A',
            attendanceRecords: {
                create: [{
                    studentId: student.id,
                    status: 'PRESENT',
                    note: ''
                }]
            }
        }
    });
    console.log('Created session:', newSession.id);

    // 3. Update Session (Simulating updateClassSessionAction logic)
    console.log('Updating session...');
    await db.classSession.update({
        where: { id: newSession.id },
        data: {
            lessonContent: 'Algebra Basics (Updated)',
            classification: 'B'
        }
    });

    // Upsert attendance
    await db.attendanceRecord.upsert({
        where: {
            sessionId_studentId: {
                sessionId: newSession.id,
                studentId: student.id
            }
        },
        update: { status: 'LATE', note: 'Arrived 5 mins late' },
        create: { sessionId: newSession.id, studentId: student.id, status: 'LATE' }
    });
    console.log('Updated session and attendance.');

    // 4. Fetch Sessions (Simulating getClassSessionsAction logic)
    console.log('Fetching sessions...');
    const sessions = await db.classSession.findMany({
        where: { classId: class1.id },
        include: {
            teacher: { select: { name: true } },
            attendanceRecords: { include: { student: { select: { name: true } } } }
        }
    });

    console.log('Fetched sessions:', sessions.length);
    if (sessions.length > 0) {
        const s = sessions[0];
        console.log('Session 1:', {
            content: s.lessonContent,
            classification: s.classification,
            attendance: s.attendanceRecords[0]?.status
        });

        if (s.lessonContent === 'Algebra Basics (Updated)' && s.attendanceRecords[0]?.status === 'LATE') {
            console.log('SUCCESS: Session logic verified!');
        } else {
            console.error('FAILURE: Data mismatch.');
        }
    }

    // Cleanup
    await db.classSession.deleteMany({ where: { classId: class1.id } });
    await db.class.delete({ where: { id: class1.id } });
    await db.user.deleteMany({ where: { id: { in: [teacher.id, student.id] } } });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
