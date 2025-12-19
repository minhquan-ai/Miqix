import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        // 1. Create Teacher (no password field in schema)
        const teacher = await db.user.upsert({
            where: { email: 'teacher@ergonix.edu' },
            update: {},
            create: {
                name: 'Cô Giáo Hạnh',
                email: 'teacher@ergonix.edu',
                role: 'teacher',
                avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hanh'
            }
        });

        // 2. Create Students
        const studentsData = [
            { name: 'Nguyễn Văn An', email: 'an@ergonix.edu', seed: 'An' },
            { name: 'Trần Thị Bình', email: 'binh@ergonix.edu', seed: 'Binh' },
            { name: 'Lê Văn Cường', email: 'cuong@ergonix.edu', seed: 'Cuong' },
        ];

        const students = [];
        for (const s of studentsData) {
            const student = await db.user.upsert({
                where: { email: s.email },
                update: {},
                create: {
                    name: s.name,
                    email: s.email,
                    role: 'student',
                    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.seed}`,
                    xp: 0,
                    level: 1,
                    streak: 0
                }
            });
            students.push(student);
        }

        // 3. Create Class
        const mathClass = await db.class.create({
            data: {
                name: 'Toán Cao Cấp A1',
                subject: 'Toán học',
                description: 'Lớp học dành cho các thiên tài toán học tương lai.',
                teacherId: teacher.id,
                code: 'MATH101A',
                codeEnabled: true,
                schedule: 'Thứ 2, 4, 6 (08:00 - 10:00)',
                avatar: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=60'
            }
        });

        // 4. Enroll Students
        for (const s of students) {
            await db.classEnrollment.create({
                data: {
                    userId: s.id,
                    classId: mathClass.id,
                    role: 'main',
                    status: 'active'
                }
            });
        }

        // 5. Create Assignments (use classIds as JSON string)
        const assignment1 = await db.assignment.create({
            data: {
                title: 'Bài tập về nhà: Đạo hàm',
                description: 'Làm bài tập 1 đến 10 trang 45 SGK. Chụp ảnh nộp lại.',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                classIds: JSON.stringify([mathClass.id]),
                teacherId: teacher.id,
                type: 'homework',
                xpReward: 100
            }
        });

        const assignment2 = await db.assignment.create({
            data: {
                title: 'Kiểm tra 15 phút: Tích phân',
                description: 'Làm bài trên giấy và nộp ngay tại lớp.',
                dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                classIds: JSON.stringify([mathClass.id]),
                teacherId: teacher.id,
                type: 'quiz',
                xpReward: 50
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Database seeded successfully!',
            data: {
                teacher: teacher.email,
                students: students.map(s => s.email),
                class: mathClass.code,
                assignments: [assignment1.title, assignment2.title]
            }
        });

    } catch (error) {
        console.error('Seeding error:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
