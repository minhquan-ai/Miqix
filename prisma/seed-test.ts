
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding test class...');

    // 1. Find or create a teacher
    let teacher = await prisma.user.findFirst({
        where: { role: 'teacher' }
    });

    if (!teacher) {
        console.log('No teacher found, creating one...');
        teacher = await prisma.user.create({
            data: {
                id: 'test-teacher-1',
                name: 'Teacher Demo',
                email: 'teacher@demo.com',
                role: 'teacher',
                avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher',
            }
        });
    }

    // 2. Create a test class
    const testClass = await prisma.class.create({
        data: {
            name: 'Lớp Học Thử Nghiệm (Demo)',
            subject: 'Khoa Học Máy Tính',
            description: 'Lớp học mẫu để kiểm tra tính năng.',
            code: 'DEMO2024',
            teacherId: teacher.id,
        }
    });

    console.log(`Created class: ${testClass.name} with code: ${testClass.code}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
