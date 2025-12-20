import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Using a new key to force-refresh the client because the server wasn't restarted
const prismaKey = 'prisma_instance_v2';
const globalAny = globalThis as any;

export const db = globalAny[prismaKey] ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalAny[prismaKey] = db;
