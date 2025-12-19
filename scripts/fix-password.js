
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const emailTeacher = 'hanh@school.edu';
    const emailStudent = 'student.c_10a1.0@school.edu';
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Updating password for ${emailTeacher}...`);
    try {
        await prisma.user.update({
            where: { email: emailTeacher },
            data: { password: hashedPassword }
        });
        console.log(`Success.`);
    } catch (e) {
        console.log(`Failed to update teacher: ${e.message}`);
    }

    console.log(`Updating password for ${emailStudent}...`);
    try {
        await prisma.user.update({
            where: { email: emailStudent },
            data: { password: hashedPassword }
        });
        console.log(`Success.`);
    } catch (e) {
        console.log(`Failed to update student: ${e.message}`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
