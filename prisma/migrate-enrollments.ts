import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration script: Move User.classId to ClassEnrollment
 * 
 * This script migrates existing user-class relationships from the deprecated
 * User.classId field to the new ClassEnrollment pivot table.
 */
async function migrateUserClassToEnrollments() {
    console.log('Starting migration: User.classId → ClassEnrollment...\n');

    // Find all users with a classId
    const usersWithClass = await prisma.user.findMany({
        where: {
            classId: { not: null },
            role: 'student' // Only students have classId
        },
        select: {
            id: true,
            name: true,
            classId: true
        }
    });

    console.log(`Found ${usersWithClass.length} users with existing class assignments`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const user of usersWithClass) {
        try {
            // Check if enrollment already exists
            const existing = await prisma.classEnrollment.findUnique({
                where: {
                    userId_classId: {
                        userId: user.id,
                        classId: user.classId!
                    }
                }
            });

            if (existing) {
                console.log(`⏭️  Skip: ${user.name} - Already enrolled in class`);
                skipCount++;
                continue;
            }

            // Create new enrollment record
            await prisma.classEnrollment.create({
                data: {
                    userId: user.id,
                    classId: user.classId!,
                    role: 'main', // Assume existing class is the main class
                    status: 'active',
                    joinedAt: new Date() // Use current time as we don't have historic data
                }
            });

            console.log(`✅ Migrated: ${user.name} → Class ${user.classId}`);
            successCount++;

        } catch (error) {
            console.error(`❌ Error migrating ${user.name}:`, error);
            errorCount++;
        }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total processed: ${usersWithClass.length}`);
}

// Run migration
migrateUserClassToEnrollments()
    .then(async () => {
        await prisma.$disconnect();
        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    })
    .catch(async (e) => {
        console.error('\n❌ Migration failed:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
