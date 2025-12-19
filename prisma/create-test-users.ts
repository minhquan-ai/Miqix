import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUsers() {
    const passwordHash = await bcrypt.hash('123456', 10);

    await prisma.user.upsert({
        where: { email: 'teacher@ergonix.com' },
        update: {},
        create: {
            id: 'test_teacher',
            name: 'Teacher Test',
            email: 'teacher@ergonix.com',
            role: 'teacher',
            password: passwordHash,
            xp: 500, level: 3, streak: 5
        }
    });

    await prisma.user.upsert({
        where: { email: 'student@ergonix.com' },
        update: {},
        create: {
            id: 'test_student',
            name: 'Student Test',
            email: 'student@ergonix.com',
            role: 'student',
            password: passwordHash,
            xp: 300, level: 2, streak: 3
        }
    });

    console.log('✓ teacher@ergonix.com / 123456');
    console.log('✓ student@ergonix.com / 123456');
}

createTestUsers().then(() => prisma.$disconnect()).catch((e) => { console.error(e); process.exit(1); });
