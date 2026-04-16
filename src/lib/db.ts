import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

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

// Since Prisma 7 blocks direct URL injection in strict typescript generation without adapters
// We can securely override the environment variable directly before instantiation
process.env.DATABASE_URL = dbUrl;

// Setup Prisma adapter for Prisma 7
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
