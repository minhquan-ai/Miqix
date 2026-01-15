const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = "postgresql://neondb_owner:npg_r4RgBP0LCwiM@ep-still-dust-ahixippp-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
    datasources: {
        db: { url: DATABASE_URL }
    }
});

async function main() {
    console.log('🌱 Seeding production-ready demo data...');
    console.log('DATABASE:', DATABASE_URL.substring(0, 30) + '...');

    // ============================================
    // 1. CREATE DEMO ACCOUNTS
    // ============================================

    // Teacher: Trần Thị Hồng Hà
    let teacher = await prisma.user.findUnique({
        where: { email: 'demo@miqix.vn' }
    });

    if (!teacher) {
        console.log('Creating teacher...');
        teacher = await prisma.user.create({
            data: {
                id: 'demo-teacher-001',
                name: 'Trần Thị Hồng Hà',
                email: 'demo@miqix.vn',
                password: 'demo2026',
                role: 'teacher',
                avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HongHa&backgroundColor=ffdfbf',
            }
        });
        console.log('✅ Teacher created:', teacher.name);
    } else {
        console.log('✅ Teacher exists:', teacher.name);
    }

    // Student: Nguyễn Minh Quân
    let mainStudent = await prisma.user.findUnique({
        where: { email: 'hocsinh@miqix.vn' }
    });

    if (!mainStudent) {
        console.log('Creating main student...');
        mainStudent = await prisma.user.create({
            data: {
                id: 'demo-student-001',
                name: 'Nguyễn Minh Quân',
                email: 'hocsinh@miqix.vn',
                password: 'demo2026',
                role: 'student',
                avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MinhQuan&backgroundColor=c0aede',
            }
        });
        console.log('✅ Student created:', mainStudent.name);
    } else {
        console.log('✅ Student exists:', mainStudent.name);
    }

    // ============================================
    // 2. CREATE ADDITIONAL STUDENTS
    // ============================================
    const additionalStudents = [
        { id: 'demo-student-002', name: 'Lê Văn Đức', email: 'levanduc@student.miqix.vn' },
        { id: 'demo-student-003', name: 'Phạm Thu Hà', email: 'phamthuha@student.miqix.vn' },
        { id: 'demo-student-004', name: 'Hoàng Quốc Bảo', email: 'hoangquocbao@student.miqix.vn' },
        { id: 'demo-student-005', name: 'Vũ Thị Mai', email: 'vuthimai@student.miqix.vn' },
        { id: 'demo-student-006', name: 'Đặng Văn Kiên', email: 'dangvankien@student.miqix.vn' },
        { id: 'demo-student-007', name: 'Bùi Thanh Tùng', email: 'buithanhtung@student.miqix.vn' },
        { id: 'demo-student-008', name: 'Đinh Thị Ngọc', email: 'dinhthingoc@student.miqix.vn' },
        { id: 'demo-student-009', name: 'Trịnh Văn Hải', email: 'trinhvanhai@student.miqix.vn' },
        { id: 'demo-student-010', name: 'Ngô Thị Linh', email: 'ngothilinh@student.miqix.vn' },
    ];

    const allStudents = [mainStudent];
    for (const student of additionalStudents) {
        const existing = await prisma.user.findUnique({ where: { email: student.email } });
        if (!existing) {
            const newStudent = await prisma.user.create({
                data: {
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    password: 'demo2026',
                    role: 'student',
                    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name.replace(/\s/g, '')}`,
                }
            });
            allStudents.push(newStudent);
        } else {
            allStudents.push(existing);
        }
    }
    console.log(`✅ Total students: ${allStudents.length}`);

    // ============================================
    // 3. CREATE CLASSES
    // ============================================
    const classesData = [
        {
            name: '12A1 - Toán Nâng cao',
            subject: 'Toán học',
            code: 'TOAN12A1',
            description: 'Lớp Toán nâng cao dành cho học sinh khối 12 ôn thi THPTQG.',
            classType: 'NORMAL',
            grade: '12',
            teacherId: teacher.id,
            color: '#3B82F6'
        },
        {
            name: '11B5 - Vật Lý Ứng dụng',
            subject: 'Vật Lý',
            code: 'VALY11B5',
            description: 'Lớp Vật lý với các thí nghiệm thực hành và ứng dụng.',
            classType: 'NORMAL',
            grade: '11',
            teacherId: teacher.id,
            color: '#8B5CF6'
        },
        {
            name: '10C2 - Ngữ Văn',
            subject: 'Ngữ Văn',
            code: 'VAN10C2',
            description: 'Lớp Ngữ văn với trọng tâm Văn học Việt Nam hiện đại.',
            classType: 'NORMAL',
            grade: '10',
            teacherId: teacher.id,
            color: '#EC4899'
        }
    ];

    const createdClasses = [];
    for (const cls of classesData) {
        const existing = await prisma.class.findUnique({ where: { code: cls.code } });
        if (!existing) {
            const newClass = await prisma.class.create({ data: cls });
            createdClasses.push(newClass);
            console.log(`✅ Class created: ${newClass.name}`);
        } else {
            createdClasses.push(existing);
            console.log(`Class exists: ${existing.name}`);
        }
    }

    // ============================================
    // 4. ENROLL STUDENTS TO CLASSES
    // ============================================
    let enrollmentCount = 0;
    for (const cls of createdClasses) {
        for (const student of allStudents) {
            const existingEnrollment = await prisma.classEnrollment.findFirst({
                where: { classId: cls.id, userId: student.id }
            });
            if (!existingEnrollment) {
                await prisma.classEnrollment.create({
                    data: {
                        classId: cls.id,
                        userId: student.id,
                        status: 'APPROVED'
                    }
                });
                enrollmentCount++;
            }
        }
    }
    console.log(`✅ Enrollments created: ${enrollmentCount}`);

    // ============================================
    // 5. CREATE ASSIGNMENTS
    // ============================================
    const mathClass = createdClasses.find(c => c.code === 'TOAN12A1');
    const physicsClass = createdClasses.find(c => c.code === 'VALY11B5');
    const literatureClass = createdClasses.find(c => c.code === 'VAN10C2');

    const assignmentsData = [
        {
            title: 'Bài tập Đạo hàm và Ứng dụng',
            description: 'Hoàn thành 15 bài tập về đạo hàm.',
            type: 'exercise',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            teacherId: teacher.id,
            subject: 'Toán học',
            xpReward: 150,
            classId: mathClass?.id
        },
        {
            title: 'Kiểm tra 15 phút: Logarit',
            description: 'Bài kiểm tra trắc nghiệm nhanh.',
            type: 'quiz',
            dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            teacherId: teacher.id,
            subject: 'Toán học',
            xpReward: 50,
            classId: mathClass?.id
        },
        {
            title: 'Thí nghiệm: Chuyển động ném ngang',
            description: 'Thực hiện thí nghiệm và viết báo cáo.',
            type: 'essay',
            dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
            teacherId: teacher.id,
            subject: 'Vật Lý',
            xpReward: 180,
            classId: physicsClass?.id
        },
        {
            title: 'Phân tích nhân vật Huấn Cao',
            description: 'Viết bài văn nghị luận 1200-1500 chữ.',
            type: 'essay',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            teacherId: teacher.id,
            subject: 'Ngữ Văn',
            xpReward: 300,
            classId: literatureClass?.id
        }
    ];

    let createdAssignments = 0;
    for (const asm of assignmentsData) {
        if (asm.classId) {
            const existing = await prisma.assignment.findFirst({
                where: { title: asm.title, teacherId: asm.teacherId }
            });
            if (!existing) {
                await prisma.assignment.create({
                    data: {
                        title: asm.title,
                        description: asm.description,
                        type: asm.type,
                        dueDate: asm.dueDate,
                        teacherId: asm.teacherId,
                        subject: asm.subject,
                        xpReward: asm.xpReward,
                        classIds: asm.classId,
                        assignmentClasses: {
                            create: {
                                classId: asm.classId,
                                dueDate: asm.dueDate
                            }
                        }
                    }
                });
                createdAssignments++;
            }
        }
    }
    console.log(`✅ Assignments created: ${createdAssignments}`);

    // ============================================
    // 6. CREATE ANNOUNCEMENTS
    // ============================================
    for (const cls of createdClasses) {
        const existingAnnouncement = await prisma.announcement.findFirst({
            where: { classId: cls.id }
        });

        if (!existingAnnouncement) {
            await prisma.announcement.create({
                data: {
                    classId: cls.id,
                    userId: teacher.id,
                    content: `Chào mừng các em đến với lớp ${cls.name}! Hãy kiểm tra lịch học và bài tập được giao nhé.`,
                    type: 'ANNOUNCEMENT',
                    isPinned: true
                }
            });
        }
    }
    console.log('✅ Announcements created');

    console.log('\n🎉 Demo data seeding completed!');
    console.log('📋 Demo Accounts:');
    console.log('   Giáo viên: demo@miqix.vn / demo2026 (Trần Thị Hồng Hà)');
    console.log('   Học sinh:  hocsinh@miqix.vn / demo2026 (Nguyễn Minh Quân)');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e.message);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
