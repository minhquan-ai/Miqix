import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🗑️  Xóa toàn bộ dữ liệu (giữ lại users)...')

    // Delete in correct order to respect foreign key constraints
    await prisma.submission.deleteMany()
    console.log('✓ Deleted submissions')

    await prisma.assignment.deleteMany()
    console.log('✓ Deleted assignments')

    await prisma.announcement.deleteMany()
    console.log('✓ Deleted announcements')

    await prisma.classEnrollment.deleteMany()
    console.log('✓ Deleted class enrollments')

    await prisma.classSession.deleteMany()
    console.log('✓ Deleted class sessions')

    await prisma.class.deleteMany()
    console.log('✓ Deleted classes')

    await prisma.notification.deleteMany()
    console.log('✓ Deleted notifications')

    await prisma.mission.deleteMany()
    console.log('✓ Deleted missions')

    // Keep users - count them
    const userCount = await prisma.user.count()
    console.log(`✓ Kept ${userCount} users`)

    console.log('✅ Done! All data cleared except users.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
