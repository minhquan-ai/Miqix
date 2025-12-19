import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Kiểm tra Classes và Users...\n')

    // List all classes
    const classes = await prisma.class.findMany({
        select: {
            id: true,
            name: true,
            teacherId: true,
            createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
    })

    console.log('📚 Các lớp học gần đây:')
    classes.forEach(c => {
        console.log(`  - ${c.name} (ID: ${c.id})`)
        console.log(`    Teacher ID: ${c.teacherId}`)
        console.log(`    Created: ${c.createdAt}`)
        console.log('')
    })

    // List teachers
    const teachers = await prisma.user.findMany({
        where: { role: 'teacher' },
        select: {
            id: true,
            name: true,
            email: true
        },
        take: 5
    })

    console.log('\n👨‍🏫 Các giáo viên:')
    teachers.forEach(t => {
        console.log(`  - ${t.name} (${t.email})`)
        console.log(`    User ID: ${t.id}`)
        console.log('')
    })

    // Check mismatch
    const classTeacherIds = new Set(classes.map(c => c.teacherId))
    const teacherIds = new Set(teachers.map(t => t.id))

    const orphanClasses = [...classTeacherIds].filter(id => !teacherIds.has(id))

    if (orphanClasses.length > 0) {
        console.log('\n⚠️  CẢNH BÁO: Có lớp học với teacherId không tồn tại:')
        orphanClasses.forEach(id => console.log(`  - ${id}`))
    } else {
        console.log('\n✅ Tất cả lớp học đều có teacher hợp lệ')
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
