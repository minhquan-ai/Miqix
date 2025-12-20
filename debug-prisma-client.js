
const { PrismaClient } = require('@prisma/client');

async function main() {
    console.log("Checking Prisma Client...");
    const prisma = new PrismaClient();

    // Check if the property exists
    if (prisma.personalEvent) {
        console.log("✅ prisma.personalEvent exists!");
        // Try a simple count operation
        try {
            const count = await prisma.personalEvent.count();
            console.log(`Current PersonalEvents count: ${count}`);
        } catch (e) {
            console.error("Error connecting/counting:", e.message);
        }
    } else {
        console.error("❌ prisma.personalEvent is UNDEFINED. The client was not generated correctly or is using an old version.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        // await prisma.$disconnect() 
    });
