import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Debug log for Vercel
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
    if (!dbUrl.startsWith("postgres://") && !dbUrl.startsWith("postgresql://")) {
        console.error("❌ CRITICAL: DATABASE_URL does not start with postgres:// or postgresql://");
        console.error("Current value starts with:", dbUrl.substring(0, 15));
    } else {
        console.log("✅ DATABASE_URL protocol check passed:", dbUrl.substring(0, 15) + "...");
    }
} else {
    console.error("❌ CRITICAL: DATABASE_URL is undefined!");
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
