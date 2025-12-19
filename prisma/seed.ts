import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    // Clean up existing data
    await prisma.reaction.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.attendanceRecord.deleteMany();
    await prisma.classSession.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.classEnrollment.deleteMany();
    await prisma.class.deleteMany();
    await prisma.user.deleteMany();

    // 1. Create Teacher
    const teacher = await prisma.user.create({
        data: {
            id: 'u2',
            name: 'Cô Giáo Hạnh',
            email: 'hanh@school.edu',
            role: 'teacher',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hanh',
            xp: 1250,
            level: 5,
            streak: 15,
        },
    });

    console.log(`Created teacher: ${teacher.name}`);

    // 2. Create Classes
    const classesData = [
        {
            id: 'c_10a1',
            name: 'Lớp 10A1',
            subject: 'Toán',
            description: 'Lớp chọn Toán - Niên khóa 2025-2028',
            code: 'MATH10A1',
            schedule: "Thứ 2, 4, 6 (07:00 - 08:30)",
            avatar: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80",
            teacherId: teacher.id,
        },
        {
            id: 'c_11b2',
            name: 'Lý 11B2',
            subject: 'Vật Lý',
            description: 'Lớp Lý nâng cao',
            code: 'PHYS11B2',
            schedule: "Thứ 3, 5 (09:00 - 10:30)",
            avatar: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&q=80",
            teacherId: teacher.id,
        },
        {
            id: 'c_12c3',
            name: 'Hóa 12C3',
            subject: 'Hóa Học',
            description: 'Ôn thi THPT Quốc gia',
            code: 'CHEM12C3',
            schedule: "Thứ 2, 6 (14:00 - 15:30)",
            avatar: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80",
            teacherId: teacher.id,
        },
    ];

    for (const cls of classesData) {
        await prisma.class.create({ data: cls });
    }

    console.log(`Created ${classesData.length} classes`);

    // 3. Create Students & Enrollments
    const firstNames = ['An', 'Bình', 'Chi', 'Dũng', 'Em', 'Giang', 'Hà', 'Hiếu', 'Khánh', 'Lan', 'Minh', 'Nam', 'Oanh', 'Phúc', 'Quân', 'Sơn', 'Thảo', 'Uyên', 'Vinh', 'Yến'];
    const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'];

    const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    for (const cls of classesData) {
        const studentCount = cls.id === 'c_10a1' ? 35 : (cls.id === 'c_11b2' ? 32 : 30);

        for (let i = 0; i < studentCount; i++) {
            const firstName = random(firstNames);
            const lastName = random(lastNames);
            const fullName = `${lastName} ${firstName}`;
            const email = `student.${cls.id}.${i}@school.edu`;

            const student = await prisma.user.create({
                data: {
                    id: `s_${cls.id}_${i}`,
                    name: fullName,
                    email: email,
                    role: 'student',
                    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cls.id}_${i}`,
                    xp: randomInt(100, 2000),
                    level: randomInt(1, 5),
                    streak: randomInt(0, 10),
                    classId: cls.id, // Legacy field
                    enrollments: {
                        create: {
                            classId: cls.id,
                            role: 'main',
                        }
                    }
                }
            });
        }
    }

    console.log('Created students and enrollments');

    // 4. Create Assignments & Submissions
    for (const cls of classesData) {
        // 4.1 Homework 1
        const hw1 = await prisma.assignment.create({
            data: {
                id: `a_${cls.id}_hw1`,
                title: `Bài tập về nhà 1 - ${cls.subject}`,
                description: `Hoàn thành các bài tập chương 1 trong sách giáo khoa.`,
                dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                status: 'closed',
                type: 'exercise',
                xpReward: 100,
                teacherId: teacher.id,
                subject: cls.subject,
                maxScore: 10,
                classIds: JSON.stringify([cls.id]), // Legacy
                assignmentClasses: {
                    create: {
                        classId: cls.id
                    }
                }
            }
        });

        // 4.2 Test 1
        const test1 = await prisma.assignment.create({
            data: {
                id: `a_${cls.id}_test1`,
                title: `Kiểm tra 15 phút - ${cls.subject}`,
                description: `Kiểm tra kiến thức chương 1.`,
                dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                status: 'closed',
                type: 'test',
                xpReward: 200,
                teacherId: teacher.id,
                subject: cls.subject,
                maxScore: 10,
                classIds: JSON.stringify([cls.id]),
                assignmentClasses: {
                    create: {
                        classId: cls.id
                    }
                }
            }
        });

        // 4.3 Project
        await prisma.assignment.create({
            data: {
                id: `a_${cls.id}_proj`,
                title: `Dự án cuối kỳ - ${cls.subject}`,
                description: `Thực hiện dự án nhóm tìm hiểu về ứng dụng thực tế của môn học.`,
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                status: 'open',
                type: 'project',
                xpReward: 1000,
                teacherId: teacher.id,
                subject: cls.subject,
                maxScore: 100,
                classIds: JSON.stringify([cls.id]),
                assignmentClasses: {
                    create: {
                        classId: cls.id
                    }
                }
            }
        });

        // Submissions
        const students = await prisma.user.findMany({
            where: {
                enrollments: {
                    some: {
                        classId: cls.id
                    }
                }
            }
        });

        for (const assign of [hw1, test1]) {
            for (const student of students) {
                if (Math.random() > 0.1) {
                    const score = randomInt(5, 10);
                    await prisma.submission.create({
                        data: {
                            id: `sub_${assign.id}_${student.id}`,
                            assignmentId: assign.id,
                            studentId: student.id,
                            content: 'Em nộp bài ạ.',
                            submittedAt: new Date(assign.dueDate.getTime() - randomInt(1, 48) * 60 * 60 * 1000),
                            status: 'graded',
                            score: score,
                            feedback: score >= 8 ? 'Tốt' : 'Cần cố gắng'
                        }
                    });
                }
            }
        }
    }

    console.log('Created assignments and submissions');

    // 5. Create Class Sessions
    for (const cls of classesData) {
        const students = await prisma.user.findMany({
            where: { enrollments: { some: { classId: cls.id } } }
        });

        for (let week = 0; week < 4; week++) {
            for (let sessionNum = 1; sessionNum <= 3; sessionNum++) {
                const date = new Date();
                date.setDate(date.getDate() - (week * 7) + (sessionNum * 2));

                const session = await prisma.classSession.create({
                    data: {
                        id: `sess_${cls.id}_w${week}_${sessionNum}`,
                        classId: cls.id,
                        teacherId: teacher.id,
                        date: date,
                        period: sessionNum,
                        subject: cls.subject,
                        lessonContent: `Bài học tuần ${4 - week}, tiết ${sessionNum}: ${cls.subject} nâng cao`,
                        note: Math.random() > 0.8 ? 'Lớp sôi nổi' : '',
                        classification: random(['A', 'A', 'A', 'B']),
                    }
                });

                // Attendance
                for (const student of students) {
                    await prisma.attendanceRecord.create({
                        data: {
                            id: `ar_${cls.id}_w${week}_${sessionNum}_${student.id}`,
                            sessionId: session.id,
                            studentId: student.id,
                            status: Math.random() > 0.95 ? 'ABSENT' : (Math.random() > 0.9 ? 'LATE' : 'PRESENT'),
                        }
                    });
                }
            }
        }
    }

    console.log('Created class sessions');

    // 6. Announcements
    for (const cls of classesData) {
        await prisma.announcement.create({
            data: {
                id: `ann_${cls.id}_welcome`,
                classId: cls.id,
                teacherId: teacher.id,
                content: `Chào mừng các em đến với lớp ${cls.name}. Chúc các em một năm học thành công!`,
                title: "Chào mừng năm học mới",
                isPinned: true,
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                type: 'NORMAL',
            }
        });

        await prisma.announcement.create({
            data: {
                id: `ann_${cls.id}_reminder`,
                classId: cls.id,
                teacherId: teacher.id,
                content: "Các em nhớ hoàn thành bài tập về nhà trước thứ 6 nhé.",
                title: "Nhắc nhở bài tập",
                isPinned: false,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                type: 'URGENT',
            }
        });
    }

    console.log('Created announcements');
    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
