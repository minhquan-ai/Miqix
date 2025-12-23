
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed for Literature Teacher scenario...');

    // 1. CLEANUP (Delete in correct order)
    console.log('🧹 Cleaning database...');
    // Delete dependent records first
    await prisma.notification.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.reaction.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.attendanceRecord.deleteMany();
    await prisma.classSession.deleteMany();
    await prisma.worksheetProgress.deleteMany();
    await prisma.assignmentClass.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.classResource.deleteMany();
    await prisma.classEnrollment.deleteMany();
    await prisma.behaviorRecord.deleteMany();
    await prisma.classSettings.deleteMany();
    await prisma.class.deleteMany();
    await prisma.studentGuardian.deleteMany();
    await prisma.guardian.deleteMany();
    await prisma.user.deleteMany(); // Delete users last

    console.log('✅ Database cleaned.');

    // 2. CREATE USERS

    // --- Teacher ---
    const teacher = await prisma.user.create({
        data: {
            name: 'Cô Nguyễn Thu Hà',
            email: 'teacher@ergonix.edu.vn',
            password: '$2b$10$.5Sxswbn6jmRTmm1ye/lS.YqQo8ea6WMmMG8WJ5tagD9g4W8Z.ihq', // password123
            role: 'teacher',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThuHa&gender=female',
            schoolName: 'THPT Chuyên Hà Nội - Amsterdam',
            teachingSubjects: 'LITERATURE',
            bio: 'Giáo viên Ngữ Văn với 15 năm kinh nghiệm. Yêu thơ ca và nghệ thuật.',
            phoneNumber: '0912345678',
        }
    });

    console.log(`👩‍🏫 Created Teacher: ${teacher.name}`);

    // --- Students ---
    const studentNames = [
        'Trần Minh Quân', 'Lê Bảo Ngọc', 'Nguyễn Gia Huy', 'Phạm Quỳnh Anh',
        'Hoàng Đức Anh', 'Vũ Thị Mai', 'Đỗ Quang Khải', 'Lý Lan Nhi',
        'Bùi Tiến Dũng', 'Ngô Phương Thảo', 'Đặng Văn Lâm', 'Trịnh Thu Trang'
    ];

    const students: any[] = [];
    for (let i = 0; i < studentNames.length; i++) {
        const student = await prisma.user.create({
            data: {
                name: studentNames[i],
                email: `student${i + 1}@ergonix.edu.vn`,
                password: '$2b$10$.5Sxswbn6jmRTmm1ye/lS.YqQo8ea6WMmMG8WJ5tagD9g4W8Z.ihq', // password123
                role: 'student',
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentNames[i]}`,
                schoolName: 'THPT Chuyên Hà Nội - Amsterdam',
                studentGuardians: {
                    create: {
                        guardian: {
                            create: {
                                // userId handled automatically by user create below
                                user: {
                                    create: {
                                        name: `Phụ huynh ${studentNames[i]}`,
                                        email: `guardian${i + 1}@ergonix.edu.vn`,
                                        role: 'parent',
                                        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=Guardian${i}`,
                                    }
                                }
                            }
                        },
                        relationship: 'Bố/Mẹ',
                        isPrimary: true
                    }
                }
            }
        });
        students.push(student);
    }
    console.log(`🎓 Created ${students.length} students.`);

    // 3. CREATE CLASSES
    const classesData = [
        {
            name: '12A5 - Ngữ Văn Nâng Cao',
            subject: 'Ngữ Văn 12',
            description: 'Lớp chuyên đề Văn học hiện đại Việt Nam và ôn thi THPTQG.',
            code: 'LIT12A5',
            grade: '12',
            color: 'rose',
            avatar: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=1000'
        },
        {
            name: '10B2 - Văn Học Dân Gian',
            subject: 'Ngữ Văn 10',
            description: 'Khám phá kho tàng ca dao, tục ngữ và truyện cổ tích.',
            code: 'LIT10B2',
            grade: '10',
            color: 'amber',
            avatar: 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?auto=format&fit=crop&q=80&w=1000'
        },
        {
            name: 'CLB Phóng Viên Nhỏ',
            subject: 'Báo Chí',
            description: 'Rèn luyện kỹ năng viết tin, bài và phỏng vấn.',
            code: 'JOURNO',
            grade: 'All',
            color: 'emerald',
            avatar: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1000',
            role: 'club'
        }
    ];

    const createdClasses: any[] = [];
    for (const cls of classesData) {
        const createdClass = await prisma.class.create({
            data: {
                name: cls.name,
                subject: cls.subject,
                description: cls.description,
                code: cls.code,
                grade: cls.grade,
                color: cls.color,
                avatar: cls.avatar,
                teacherId: teacher.id,
                settings: {
                    create: {
                        announcementPermission: 'TEACHER_ONLY',
                        allowComments: true
                    }
                }
            }
        });
        createdClasses.push(createdClass);
    }
    console.log(`🏫 Created ${createdClasses.length} classes.`);

    // 4. ENROLL STUDENTS
    // Enroll all students in the main class (12A5)
    const mainClass = createdClasses[0];
    for (const student of students) {
        await prisma.classEnrollment.create({
            data: {
                userId: student.id,
                classId: mainClass.id,
                role: 'student'
            }
        });
    }

    // Enroll half in 10B2
    const subClass = createdClasses[1];
    for (const student of students.slice(0, 6)) {
        await prisma.classEnrollment.create({
            data: {
                userId: student.id,
                classId: subClass.id,
                role: 'student'
            }
        });
    }

    // Enroll random few in Club
    const clubClass = createdClasses[2];
    for (const student of [students[0], students[2], students[5], students[8]]) {
        await prisma.classEnrollment.create({
            data: {
                userId: student.id,
                classId: clubClass.id,
                role: 'student'
            }
        });
    }
    console.log('📝 Enrolled students.');

    // 5. ASSIGNMENTS & SUBMISSIONS (Main Class)
    const assignmentsData = [
        {
            title: 'Phân tích bài thơ "Sóng" - Xuân Quỳnh',
            description: 'Viết bài văn nghị luận phân tích vẻ đẹp tâm hồn người phụ nữ trong tình yêu qua bài thơ Sóng.',
            type: 'essay',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
            maxScore: 10,
            status: 'open'
        },
        {
            title: 'Nghị luận xã hội: Sống xanh',
            description: 'Trình bày suy nghĩ của anh/chị về lối sống xanh trong giới trẻ hiện nay.',
            type: 'essay',
            dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Due 2 days ago
            maxScore: 10,
            status: 'closed'
        },
        {
            title: 'Đọc hiểu: Vợ chồng A Phủ',
            description: 'Trả lời các câu hỏi đọc hiểu trong tài liệu đính kèm.',
            type: 'exercise',
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Due in 2 days
            maxScore: 100,
            status: 'open'
        }
    ];

    for (const asm of assignmentsData) {
        const assignment = await prisma.assignment.create({
            data: {
                title: asm.title,
                description: asm.description,
                teacherId: teacher.id,
                dueDate: asm.dueDate,
                status: asm.status,
                type: asm.type,
                maxScore: asm.maxScore,
                assignmentClasses: {
                    create: {
                        classId: mainClass.id,
                        dueDate: asm.dueDate
                    }
                }
            }
        });

        // Create submissions for 'closed' assignment
        if (asm.status === 'closed') {
            for (const student of students) {
                // Randomize score and feedback
                const score = Math.floor(Math.random() * 4) + 6; // 6 to 9
                await prisma.submission.create({
                    data: {
                        assignmentId: assignment.id,
                        studentId: student.id,
                        content: 'Em xin nộp bài ạ.',
                        status: 'graded',
                        score: score,
                        feedback: score >= 8 ? 'Bài viết tốt, luận điểm rõ ràng.' : 'Cần trau chuốt thêm về diễn đạt.',
                        submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
                    }
                });
            }
        }

        // Create random submissions for 'open' assignment (some submitted, some not)
        if (asm.status === 'open' && asm.title.includes('Sóng')) {
            for (const student of students.slice(0, 5)) {
                await prisma.submission.create({
                    data: {
                        assignmentId: assignment.id,
                        studentId: student.id,
                        content: 'Bài làm của em...',
                        status: 'submitted',
                        submittedAt: new Date()
                    }
                });
            }
        }
    }
    console.log('📚 Created Assignments & Submissions.');

    // 6. ANNOUNCEMENTS
    const announcementsData = [
        {
            title: 'Lịch thi học kỳ I môn Ngữ Văn',
            content: 'Các em lưu ý lịch thi học kỳ I sẽ diễn ra vào sáng thứ 6 tuần sau. Nội dung ôn tập gồm các tác phẩm từ đầu năm.',
            isPinned: true,
            type: 'URGENT'
        },
        {
            title: 'Tài liệu tham khảo: Đất Nước (Nguyễn Khoa Điềm)',
            content: 'Cô gửi lớp tài liệu tham khảo bài Đất Nước. Các em nhớ đọc trước khi đến lớp nhé.',
            isPinned: false,
            type: 'NORMAL'
        },
        {
            title: 'Thông báo nghỉ học bù',
            content: 'Chiều mai lớp mình nghỉ học bù, các em tự ôn tập tại nhà.',
            isPinned: false,
            type: 'IMPORTANT'
        }
    ];

    for (const ann of announcementsData) {
        await prisma.announcement.create({
            data: {
                classId: mainClass.id,
                teacherId: teacher.id,
                title: ann.title,
                content: ann.content,
                isPinned: ann.isPinned,
                type: ann.type,
                createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000) // Random time in last 10 days
            }
        });
    }
    console.log('📢 Created Announcements.');

    // 7. ATTENDANCE & SESSIONS
    // Create 3 sessions
    const sessionDates = [
        new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    ];

    for (let i = 0; i < sessionDates.length; i++) {
        const session = await prisma.classSession.create({
            data: {
                classId: mainClass.id,
                teacherId: teacher.id,
                date: sessionDates[i],
                period: i + 1,
                subject: 'Ngữ Văn',
                lessonContent: `Bài giảng số ${i + 1}: Văn học hiện đại`
            }
        });

        // Add records
        for (const student of students) {
            let status = 'PRESENT';
            const rand = Math.random();
            if (rand > 0.95) status = 'ABSENT';
            else if (rand > 0.90) status = 'LATE';

            await prisma.attendanceRecord.create({
                data: {
                    sessionId: session.id,
                    studentId: student.id,
                    status: status,
                    note: status === 'ABSENT' ? 'Có phép' : undefined
                }
            });
        }
    }
    console.log('📅 Created Attendance Records.');

    console.log('🎉 Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
