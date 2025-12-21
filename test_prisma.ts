import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    let output = 'Connecting to database...\n';
    try {
        const userCount = await prisma.user.count();
        output += `Successfully connected! Found ${userCount} users.\n`;
    } catch (e: any) {
        output += `Error connecting to database: ${e.message}\n${e.stack}\n`;
    } finally {
        await prisma.$disconnect();
        fs.writeFileSync('db_test_result.txt', output);
    }
}

main();
