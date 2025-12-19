
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function testDb() {
    console.log("Current working directory:", process.cwd());

    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    console.log("Checking prisma/dev.db path:", dbPath);

    try {
        fs.accessSync(dbPath, fs.constants.R_OK | fs.constants.W_OK);
        console.log("prisma/dev.db is readable and writable");
    } catch (err) {
        console.error("prisma/dev.db permission error:", err);
    }

    const prisma = new PrismaClient();
    try {
        console.log("Attempting to connect to DB...");
        const count = await prisma.user.count();
        console.log("User count:", count);

        console.log("Attempting to write to DB...");
        const testUser = await prisma.user.create({
            data: {
                name: "Test Write",
                email: "test_write_" + Date.now() + "@example.com",
                role: "student",
                password: "hash"
            }
        });
        console.log("Successfully created user:", testUser.id);

        await prisma.user.delete({ where: { id: testUser.id } });
        console.log("Successfully deleted test user");

    } catch (error) {
        console.error("DB Operation failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testDb();
