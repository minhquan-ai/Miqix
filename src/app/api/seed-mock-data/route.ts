import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        console.log('🌱 Seeding production-ready demo data...');

        // ============================================
        // 1. CREATE DEMO ACCOUNTS
        // ============================================

        // Teacher: Trần Thị Hồng Hà
        let teacher = await db.user.findUnique({
            where: { email: 'demo@miqix.vn' }
        });

        if (!teacher) {
            teacher = await db.user.create({
                data: {
                    id: 'demo-teacher-001',
                    name: 'Trần Thị Hồng Hà',
                    email: 'demo@miqix.vn',
                    password: 'demo2026',
                    role: 'teacher',
                    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HongHa&backgroundColor=ffdfbf',
                }
            });
        }

        // Student: Nguyễn Minh Quân
        let mainStudent = await db.user.findUnique({
            where: { email: 'hocsinh@miqix.vn' }
        });

        if (!mainStudent) {
            mainStudent = await db.user.create({
                data: {
                    id: 'demo-student-001',
                    name: 'Nguyễn Minh Quân',
                    email: 'hocsinh@miqix.vn',
                    password: 'demo2026',
                    role: 'student',
                    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MinhQuan&backgroundColor=c0aede',
                }
            });
        }

        // ============================================
        // 2. CREATE ADDITIONAL STUDENTS (9 more)
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
            const existing = await db.user.findUnique({ where: { email: student.email } });
            if (!existing) {
                const newStudent = await db.user.create({
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

        // ============================================
        // 3. CREATE CLASSES
        // ============================================
        const classesData = [
            {
                name: '12A1 - Toán Nâng cao',
                subject: 'Toán học',
                code: 'TOAN12A1',
                description: 'Lớp Toán nâng cao dành cho học sinh khối 12 ôn thi THPTQG. Tập trung vào Giải tích, Hình học không gian và Tổ hợp - Xác suất.',
                classType: 'NORMAL',
                grade: '12',
                teacherId: teacher.id,
                color: '#3B82F6'
            },
            {
                name: '11B5 - Vật Lý Ứng dụng',
                subject: 'Vật Lý',
                code: 'VALY11B5',
                description: 'Lớp Vật lý với các thí nghiệm thực hành và ứng dụng trong đời sống. Cơ học, Điện học và Quang học.',
                classType: 'NORMAL',
                grade: '11',
                teacherId: teacher.id,
                color: '#8B5CF6'
            },
            {
                name: '10C2 - Ngữ Văn',
                subject: 'Ngữ Văn',
                code: 'VAN10C2',
                description: 'Lớp Ngữ văn với trọng tâm Văn học Việt Nam hiện đại, nghị luận văn học và nghị luận xã hội.',
                classType: 'NORMAL',
                grade: '10',
                teacherId: teacher.id,
                color: '#EC4899'
            }
        ];

        const createdClasses: any[] = [];
        for (const cls of classesData) {
            const existing = await db.class.findUnique({ where: { code: cls.code } });
            if (!existing) {
                const newClass = await db.class.create({ data: cls });
                createdClasses.push(newClass);
            } else {
                createdClasses.push(existing);
            }
        }

        // ============================================
        // 4. ENROLL STUDENTS TO CLASSES
        // ============================================
        for (const cls of createdClasses) {
            for (const student of allStudents) {
                const existingEnrollment = await db.classEnrollment.findFirst({
                    where: { classId: cls.id, userId: student.id }
                });
                if (!existingEnrollment) {
                    await db.classEnrollment.create({
                        data: {
                            classId: cls.id,
                            userId: student.id,
                            status: 'APPROVED'
                        }
                    });
                }
            }
        }

        // ============================================
        // 5. CREATE ASSIGNMENTS
        // ============================================
        const mathClass = createdClasses.find(c => c.code === 'TOAN12A1');
        const physicsClass = createdClasses.find(c => c.code === 'VALY11B5');
        const literatureClass = createdClasses.find(c => c.code === 'VAN10C2');

        const assignmentsData = [
            // Math assignments
            {
                title: 'Bài tập Đạo hàm và Ứng dụng',
                description: 'Hoàn thành 15 bài tập về đạo hàm và ứng dụng trong khảo sát hàm số. Yêu cầu trình bày chi tiết các bước giải.',
                type: 'exercise',
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                teacherId: teacher.id,
                subject: 'Toán học',
                xpReward: 150,
                classId: mathClass?.id
            },
            {
                title: 'Kiểm tra 15 phút: Logarit',
                description: 'Bài kiểm tra trắc nghiệm nhanh về hàm số mũ và logarit. 15 câu hỏi, thời gian 15 phút.',
                type: 'quiz',
                dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                teacherId: teacher.id,
                subject: 'Toán học',
                xpReward: 50,
                classId: mathClass?.id
            },
            {
                title: 'Bài tập Tích phân - Phần 1',
                description: 'Làm các bài tập nguyên hàm và tích phân cơ bản. Chuẩn bị cho bài kiểm tra giữa kỳ.',
                type: 'exercise',
                dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                teacherId: teacher.id,
                subject: 'Toán học',
                xpReward: 200,
                classId: mathClass?.id
            },
            // Physics assignments
            {
                title: 'Thí nghiệm: Chuyển động ném ngang',
                description: 'Thực hiện thí nghiệm ném ngang, ghi chép số liệu và viết báo cáo. Vẽ đồ thị quỹ đạo.',
                type: 'essay',
                dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
                teacherId: teacher.id,
                subject: 'Vật Lý',
                xpReward: 180,
                classId: physicsClass?.id
            },
            {
                title: 'Bài tập Định luật bảo toàn động lượng',
                description: 'Giải 10 bài tập về va chạm đàn hồi và không đàn hồi.',
                type: 'exercise',
                dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
                teacherId: teacher.id,
                subject: 'Vật Lý',
                xpReward: 120,
                classId: physicsClass?.id
            },
            // Literature assignments
            {
                title: 'Phân tích nhân vật Huấn Cao',
                description: 'Viết bài văn nghị luận về vẻ đẹp của nhân vật Huấn Cao trong truyện ngắn "Chữ người tử tù" của Nguyễn Tuân. Độ dài: 1200-1500 chữ.',
                type: 'essay',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                teacherId: teacher.id,
                subject: 'Ngữ Văn',
                xpReward: 300,
                classId: literatureClass?.id
            },
            {
                title: 'Đọc hiểu: Văn học hiện thực 1930-1945',
                description: 'Trả lời câu hỏi đọc hiểu về các tác phẩm văn học hiện thực phê phán.',
                type: 'quiz',
                dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                teacherId: teacher.id,
                subject: 'Ngữ Văn',
                xpReward: 80,
                classId: literatureClass?.id
            }
        ];

        let createdAssignments = 0;
        for (const asm of assignmentsData) {
            if (asm.classId) {
                const existing = await db.assignment.findFirst({
                    where: { title: asm.title, teacherId: asm.teacherId }
                });
                if (!existing) {
                    await db.assignment.create({
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

        // ============================================
        // 6. CREATE SOME ATTENDANCE RECORDS
        // ============================================
        // NOTE: Attendance model has been refactored to AttendanceRecord with sessionId relationship
        // Skipping attendance seeding until proper ClassSession creation is implemented

        // ============================================
        // 7. CREATE ANNOUNCEMENTS
        // ============================================
        for (const cls of createdClasses) {
            const existingAnnouncement = await db.announcement.findFirst({
                where: { classId: cls.id }
            });

            if (!existingAnnouncement) {
                await db.announcement.create({
                    data: {
                        classId: cls.id,
                        teacherId: teacher.id,
                        content: `Chào mừng các em đến với lớp ${cls.name}! Hãy kiểm tra lịch học và bài tập được giao nhé. Nếu có thắc mắc, các em có thể hỏi AI Tutor hoặc liên hệ trực tiếp với cô.`,
                        type: 'ANNOUNCEMENT',
                        isPinned: true
                    }
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: "🎉 Demo data seeded successfully!",
            data: {
                teacher: `${teacher.name} (demo@miqix.vn)`,
                mainStudent: `${mainStudent.name} (hocsinh@miqix.vn)`,
                totalStudents: allStudents.length,
                classes: createdClasses.length,
                assignments: createdAssignments
            },
            credentials: {
                teacher: "demo@miqix.vn / demo2026",
                student: "hocsinh@miqix.vn / demo2026"
            }
        });

    } catch (error: any) {
        console.error("Seeding error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
