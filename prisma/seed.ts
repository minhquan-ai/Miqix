import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const middleNames = ['Văn', 'Thị', 'Hữu', 'Đức', 'Minh', 'Thành', 'Quang', 'Anh', 'Ngọc', 'Khánh', 'Tuấn', 'Sơn', 'Tùng', 'Linh', 'Trang'];
const firstNames = ['Anh', 'Bảo', 'Cường', 'Dung', 'Em', 'Giang', 'Hoa', 'Hùng', 'Hương', 'Khanh', 'Lan', 'Nam', 'Phong', 'Quân', 'Sơn', 'Thảo', 'Tuấn', 'Vinh', 'Yến', 'Lợi', 'Kha', 'Duy', 'Hải', 'Hậu', 'Trực', 'Ân', 'Khoa', 'Kiên'];

function generateName() {
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const mn = middleNames[Math.floor(Math.random() * middleNames.length)];
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    return `${ln} ${mn} ${fn}`;
}

const subjects = [
    { name: 'Toán học', color: '#3B82F6', icon: 'Calculator' },
    { name: 'Vật Lý', color: '#8B5CF6', icon: 'Zap' },
    { name: 'Hóa Học', color: '#10B981', icon: 'Beaker' },
    { name: 'Ngữ Văn', color: '#EC4899', icon: 'BookOpen' },
    { name: 'Tiếng Anh', color: '#F59E0B', icon: 'Languages' },
    { name: 'Lịch Sử', color: '#EF4444', icon: 'History' },
    { name: 'Sinh Học', color: '#059669', icon: 'Leaf' },
];

async function main() {
    console.log('🌱 Starting massive Miqix demo seed (300 users)...');

    // Clean up existing data to avoid conflicts for the demo
    // WARNING: This clears the DB. 
    console.log('🧹 Cleaning up old data...');
    await prisma.attendanceRecord.deleteMany();
    await prisma.classSession.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.assignmentClass.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.classEnrollment.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.class.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await hash('Demo2026!', 10);

    // 1. Create Main Admin/Teacher
    const mainTeacher = await prisma.user.create({
        data: {
            id: 'demo-teacher-001',
            name: 'Trần Thị Hồng Hà',
            email: 'demo@miqix.vn',
            password: hashedPassword,
            role: 'teacher',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TeacherHa',
        }
    });

    // 2. Create 19 more teachers
    const teachersData: { id: string; name: string; email: string; password: string; role: string; avatarUrl: string; }[] = [];
    for (let i = 2; i <= 20; i++) {
        const name = generateName();
        teachersData.push({
            id: `teacher-${i}`,
            name,
            email: `teacher${i}@miqix.vn`,
            password: hashedPassword,
            role: 'teacher',
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher${i}`,
        });
    }
    await prisma.user.createMany({ data: teachersData });
    const allTeachers = await prisma.user.findMany({ where: { role: 'teacher' } });
    console.log(`✅ Created ${allTeachers.length} teachers`);

    // 3. Create 280 students
    const studentsData = [
        {
            id: 'demo-student-001',
            name: 'Nguyễn Minh Quân',
            email: 'hocsinh@miqix.vn',
            password: hashedPassword,
            role: 'student',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MinhQuan',
        }
    ];

    for (let i = 2; i <= 280; i++) {
        const name = generateName();
        studentsData.push({
            id: `student-${i}`,
            name,
            email: `student${i}@miqix.vn`,
            password: hashedPassword,
            role: 'student',
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=Student${i}`,
        });
    }
    await prisma.user.createMany({ data: studentsData });
    const allStudents = await prisma.user.findMany({ where: { role: 'student' } });
    console.log(`✅ Created ${allStudents.length} students`);

    // 4. Create Classes (2-3 per subject)
    const classes: any[] = [];
    for (let i = 0; i < 20; i++) {
        const subject = subjects[i % subjects.length];
        const teacher = allTeachers[i % allTeachers.length];
        const grade = Math.floor(Math.random() * 3) + 10; // 10, 11, 12
        const classNames = ['A1', 'A2', 'B1', 'B5', 'C2', 'D1'];
        const clsName = `${grade}${classNames[i % classNames.length]} - ${subject.name}`;

        const newClass = await prisma.class.create({
            data: {
                name: clsName,
                subject: subject.name,
                code: `${subject.name.substring(0, 2).toUpperCase()}${grade}${i}`,
                description: `Lớp ${subject.name} dành cho khối ${grade}. Tập trung nâng cao kiến thức và kỹ năng.`,
                teacherId: teacher.id,
                grade: grade.toString(),
                color: subject.color,
                classType: 'NORMAL'
            }
        });
        classes.push(newClass);
    }
    console.log(`✅ Created ${classes.length} classes`);

    // 5. Enrollments (Randomly distribute)
    console.log('📋 Enrolling students...');
    const enrollmentData: { userId: string; classId: string; status: string; role: string; }[] = [];
    for (const student of allStudents) {
        // Each student join 3-5 classes
        const numClasses = Math.floor(Math.random() * 3) + 3;
        const shuffledClasses = [...classes].sort(() => 0.5 - Math.random());
        const studentClasses = shuffledClasses.slice(0, numClasses);

        for (const cls of studentClasses) {
            enrollmentData.push({
                userId: student.id,
                classId: cls.id,
                status: 'active',
                role: 'student'
            });
        }
    }
    await prisma.classEnrollment.createMany({ data: enrollmentData });
    console.log(`✅ Created ${enrollmentData.length} enrollments`);

    // 6. Create Sessions & Attendance (Last 10 days)
    console.log('📅 Creating sessions and attendance...');
    const now = new Date();
    for (const cls of classes) {
        // Register 5-8 sessions per class
        const numSessions = Math.floor(Math.random() * 4) + 5;
        const enrolledInClass = enrollmentData.filter(e => e.classId === cls.id).map(e => e.userId);

        for (let s = 0; s < numSessions; s++) {
            const sessionDate = new Date(now);
            sessionDate.setDate(now.getDate() - (s * 2)); // Every 2 days

            const session = await prisma.classSession.create({
                data: {
                    classId: cls.id,
                    teacherId: cls.teacherId,
                    date: sessionDate,
                    period: 1,
                    subject: cls.subject,
                    lessonContent: `Nội dung buổi học số ${s + 1}`
                }
            });

            // Attendance for this session
            const attendanceRecords = enrolledInClass.map(studentId => {
                let status = 'PRESENT';
                const rand = Math.random();
                if (rand < 0.05) status = 'ABSENT';
                else if (rand < 0.1) status = 'LATE';

                return {
                    sessionId: session.id,
                    studentId: studentId,
                    status: status
                };
            });
            await prisma.attendanceRecord.createMany({ data: attendanceRecords });
        }
    }
    console.log('✅ Attendance records created');

    // 7. Create Assignments (3 per class)
    console.log('📝 Creating assignments and submissions...');
    for (const cls of classes) {
        const enrolledInClass = enrollmentData.filter(e => e.classId === cls.id).map(e => e.userId);

        for (let a = 1; a <= 3; a++) {
            const dueDate = new Date();
            dueDate.setDate(now.getDate() + (a * 2));

            const assignment = await prisma.assignment.create({
                data: {
                    title: `Bài tập ${cls.subject} số ${a}`,
                    description: `Yêu cầu học sinh hoàn thành các câu hỏi trong chương ${a}.`,
                    type: 'exercise',
                    dueDate: dueDate,
                    teacherId: cls.teacherId,
                    subject: cls.subject,
                    xpReward: 100,
                    classIds: cls.id,
                    assignmentClasses: {
                        create: {
                            classId: cls.id,
                            dueDate: dueDate
                        }
                    }
                }
            });

            // Submissions (Some students submitted, some graded)
            const submissionData: any[] = [];
            // Random students who already submitted (let's say 80% submission rate)
            const submitters = enrolledInClass.filter(() => Math.random() < 0.8);

            for (const studentId of submitters) {
                const isGraded = Math.random() < 0.7; // 70% of submissions are graded
                submissionData.push({
                    assignmentId: assignment.id,
                    studentId: studentId,
                    content: `Nội dung bài làm của học sinh cho bài tập ${a}.`,
                    submittedAt: new Date(now.getTime() - Math.random() * 86400000),
                    status: isGraded ? 'graded' : 'submitted',
                    score: isGraded ? (Math.random() * 4 + 6) : null, // Score 6-10
                    feedback: isGraded ? 'Bài làm khá tốt, cần chú ý trình bày.' : null
                });
            }
            if (submissionData.length > 0) {
                await prisma.submission.createMany({ data: submissionData });
            }
        }
    }
    console.log('✅ Assignments and submissions created');

    // 8. Announcements
    console.log('📢 Creating class stream activity...');
    const announcements: any[] = [];
    for (const cls of classes) {
        announcements.push({
            classId: cls.id,
            teacherId: cls.teacherId,
            content: `Chào mọi người, tuần này chúng ta sẽ tập trung vào mục tiêu mới. Đừng quên nộp bài tập đúng hạn nhé!`,
            type: 'NORMAL',
            isPinned: true
        });
    }
    await prisma.announcement.createMany({ data: announcements });

    console.log('\n🚀 SEED COMPLETED SUCCESSFULLY!');
    console.log(`- Teachers: 20`);
    console.log(`- Students: 280`);
    console.log(`- Classes: 20`);
    console.log(`- Total Users: 300`);
    console.log('\nMiqix is now ready for a high-traffic stability demo.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
