"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    // Clean up existing data
    await prisma.reaction.deleteMany();
    await prisma.socialEvent.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.badge.deleteMany();
    await prisma.mission.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.class.deleteMany();
    await prisma.user.deleteMany();
    // Create Users
    const u1 = await prisma.user.create({
        data: {
            id: 'u1',
            name: 'Nguyễn Văn A',
            email: 'student@ergonix.edu',
            role: 'student',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
            level: 5,
            xp: 1250,
            streak: 12,
            classId: 'c1',
        },
    });
    const u2 = await prisma.user.create({
        data: {
            id: 'u2',
            name: 'Trần Thị B',
            email: 'teacher@ergonix.edu',
            role: 'teacher',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
            level: 1,
            xp: 0,
            streak: 0,
        },
    });
    // Create Classes
    const c1 = await prisma.class.create({
        data: {
            id: 'c1',
            name: 'Lớp 12A1 - GVCN: Cô Hạnh',
            subject: 'Chủ Nhiệm',
            grade: '12',
            teacherId: 'u2',
            description: 'Lớp chọn Toán - Lý - Hóa',
            schedule: 'T2-T7 (7:00 - 11:30)',
            role: 'main',
            code: '12A1MAIN',
            avatar: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80',
        },
    });
    const c2 = await prisma.class.create({
        data: {
            id: 'c2',
            name: 'Lớp Học Thêm Toán',
            subject: 'Toán',
            grade: '12',
            teacherId: 'u2',
            description: 'Luyện thi Đại học cấp tốc',
            schedule: 'T3, T5 (18:00 - 20:00)',
            role: 'extra',
            code: 'MATHEXTRA',
            avatar: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80',
        },
    });
    // Create Assignments
    const a1 = await prisma.assignment.create({
        data: {
            id: 'a1',
            title: 'Đạo hàm và Ứng dụng',
            description: 'Hoàn thành bài tập trang 45-50 SGK. Chú ý các bài toán về cực trị và tính đơn điệu.',
            dueDate: new Date('2025-12-15T23:59:59Z'),
            status: 'open',
            type: 'exercise',
            xpReward: 500,
            teacherId: 'u2',
            classIds: JSON.stringify(['c1']),
            subject: 'Toán',
            attachments: JSON.stringify([
                {
                    id: 'att1',
                    name: 'Bai_tap_dao_ham.pdf',
                    url: '#',
                    type: 'application/pdf',
                    size: 1024 * 1024 * 2.5,
                    uploadedAt: '2025-11-10T08:00:00Z'
                }
            ]),
        },
    });
    // Create Submissions
    await prisma.submission.create({
        data: {
            id: 'sub_a1_u1',
            assignmentId: 'a1',
            studentId: 'u1',
            content: 'Bài làm về Đạo hàm:\n\n1. Đạo hàm của x^2 là 2x\n2. Đạo hàm của sin(x) là cos(x)\n3. Ứng dụng: Tính vận tốc tức thời.',
            submittedAt: new Date('2025-01-15T10:30:00Z'),
            status: 'graded',
            score: 85,
            feedback: 'Làm tốt lắm! Cần chú ý trình bày rõ ràng hơn ở phần ứng dụng.',
            errorAnalysis: JSON.stringify({
                categories: {
                    understanding: 15,
                    calculation: 10,
                    presentation: 35,
                    logic: 5
                },
                mainIssues: [
                    "Phần ứng dụng viết hơi vắn tắt"
                ],
                suggestions: [
                    "Nên liệt kê thêm ví dụ cụ thể về ứng dụng của đạo hàm",
                    "Giải thích chi tiết hơn cách áp dụng vào bài toán thực tế",
                    "Bổ sung hình vẽ minh họa nếu có thể"
                ]
            }),
        },
    });
    console.log('Seeding completed.');
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
