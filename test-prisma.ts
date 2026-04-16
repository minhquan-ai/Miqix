import { PrismaClient } from '@prisma/client';
console.log("Creating new PrismaClient...");
try {
  const prisma = new PrismaClient();
  console.log("Created successfully");
} catch(e) {
  console.error(e);
}
