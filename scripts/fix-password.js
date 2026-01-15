const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
    datasources: {
        db: { url: 'postgresql://neondb_owner:npg_r4RgBP0LCwiM@ep-still-dust-ahixippp-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require' }
    }
});

async function main() {
    console.log('Hashing passwords for demo accounts...');

    // Hash the password
    const hashedPassword = await bcrypt.hash('Demo2026!', 10);
    console.log('Hashed password created');

    // Update teacher account
    const teacher = await prisma.user.update({
        where: { email: 'demo@miqix.vn' },
        data: { password: hashedPassword }
    });
    console.log('✅ Teacher password updated:', teacher.name);

    // Update main student account
    const student = await prisma.user.update({
        where: { email: 'hocsinh@miqix.vn' },
        data: { password: hashedPassword }
    });
    console.log('✅ Student password updated:', student.name);

    console.log('\n🎉 Done!');
    console.log('📋 Demo Accounts (NEW PASSWORD):');
    console.log('   Giáo viên: demo@miqix.vn / Demo2026!');
    console.log('   Học sinh:  hocsinh@miqix.vn / Demo2026!');
}

main()
    .catch(e => console.error('Error:', e.message))
    .finally(() => prisma.$disconnect());
