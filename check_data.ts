import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    let output = '';
    try {
        const classCount = await prisma.class.count();
        const classes = await prisma.class.findMany({
            take: 5,
            select: { id: true, name: true, teacherId: true }
        });

        output += `Total Classes: ${classCount}\n`;
        output += `Sample Classes: ${JSON.stringify(classes, null, 2)}\n`;
    } catch (e: any) {
        output += `Error querying DB: ${e.message}\n${e.stack}\n`;
    } finally {
        await prisma.$disconnect();
        fs.writeFileSync('db_check_result.txt', output);
    }
}

main();
