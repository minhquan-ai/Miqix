import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// WORKAROUND: Force correct DATABASE_URL if Vercel cache returns wrong value
const CORRECT_DATABASE_URL = "postgresql://neondb_owner:npg_r4RgBP0LCwiM@ep-still-dust-ahixippp-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true";

let dbUrl = process.env.DATABASE_URL;

// Fix: Override if we detect the wrong SQLite URL from cache
if (!dbUrl || dbUrl.startsWith("file:") || !dbUrl.startsWith("postgres")) {
    console.warn("⚠️ DATABASE_URL was wrong or missing, using hardcoded PostgreSQL URL");
    dbUrl = CORRECT_DATABASE_URL;
} else {
    console.log("✅ DATABASE_URL looks correct:", dbUrl.substring(0, 15) + "...");
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
    datasources: {
        db: {
            url: dbUrl,
        },
    },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

