const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: { url: 'postgresql://neondb_owner:npg_r4RgBP0LCwiM@ep-still-dust-ahixippp-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require' }
    }
});

async function main() {
    console.log('Creating announcements...');

    const classes = await prisma.class.findMany({ where: { teacherId: 'demo-teacher-001' } });
    console.log('Found', classes.length, 'classes');

    for (const cls of classes) {
        const existing = await prisma.announcement.findFirst({ where: { classId: cls.id } });
        if (!existing) {
            await prisma.announcement.create({
                data: {
                    content: `Chào mừng các em đến với lớp ${cls.name}! Hãy kiểm tra lịch học và bài tập được giao nhé.`,
                    type: 'ANNOUNCEMENT',
                    isPinned: true,
                    teacher: { connect: { id: 'demo-teacher-001' } },
                    class: { connect: { id: cls.id } }
                }
            });
            console.log('✅ Announcement for', cls.name);
        } else {
            console.log('Announcement exists for', cls.name);
        }
    }
    console.log('\n🎉 All done!');
    console.log('📋 Demo Accounts:');
    console.log('   Giáo viên: demo@miqix.vn / demo2026');
    console.log('   Học sinh:  hocsinh@miqix.vn / demo2026');
}

main()
    .catch(e => console.error('Error:', e.message))
    .finally(() => prisma.$disconnect());
