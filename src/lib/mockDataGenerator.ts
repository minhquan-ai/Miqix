import { Assignment, Class, Submission, User } from "@/types";

// Helper to generate random ID
const genId = (prefix: string) => `${prefix}_${Math.random().toString(36).substring(2, 9)}`;

// Helper to get random item from array
const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Helper to get random int
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to get random date within range
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();

export const generateMockData = () => {
    // 1. Create Classes
    const classes: Class[] = [
        {
            id: 'c_10a1',
            name: 'Lớp 10A1',
            subject: 'Toán',
            description: 'Lớp chọn Toán - Niên khóa 2025-2028',
            teacherId: 'u2',
            code: 'MATH10A1',
            schedule: "Thứ 2, 4, 6 (07:00 - 08:30)",
            avatar: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80",
            // studentCount: 0 // Will update later
        },
        {
            id: 'c2',
            name: 'Lý 11B2',
            subject: 'Vật Lý',
            description: 'Lớp Lý nâng cao',
            teacherId: 'u2',
            code: 'PHYS11B2',
            schedule: "Thứ 3, 5 (09:00 - 10:30)",
            avatar: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&q=80",
            // studentCount: 0
        },
        {
            id: 'c3',
            name: 'Hóa 12C3',
            subject: 'Hóa Học',
            description: 'Ôn thi THPT Quốc gia',
            teacherId: 'u2',
            code: 'CHEM12C3',
            schedule: "Thứ 2, 6 (14:00 - 15:30)",
            avatar: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80",
            // studentCount: 0
        }
    ];

    // 2. Create Students per Class
    const students: User[] = [];
    const submissions: Submission[] = [];
    const assignments: Assignment[] = [];

    // Generate random classes
    for (let i = 0; i < 5; i++) {
        const studentCount = randomInt(30, 40);
        const classStudents: User[] = [];
        const cls: Class = {
            id: `c_gen_${i}`,
            name: `Lớp ${random(['Toán', 'Lý', 'Hóa', 'Anh', 'Văn'])} ${10 + i}`,
            subject: random(['Toán', 'Lý', 'Hóa', 'Anh', 'Văn']),
            description: 'Mô tả lớp học...',
            teacherId: 'u2', // All assigned to our teacher for demo
            code: `GEN${i}${randomInt(100, 999)}`,
            schedule: "TBD",
            avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${i}`,
            // studentCount: studentCount
        };
        classes.push(cls);

        // Generate students for this class
        for (let j = 0; j < studentCount; j++) {
            const student: User = {
                id: genId('u'),
                name: `Học sinh ${cls.name.split(' ')[1]} - ${j + 1}`, // Changed i+1 to j+1 for unique student names within a class
                email: `student_${cls.id}_${j}@ergonix.com`, // Changed i to j for unique student emails
                role: 'student',
                classId: cls.id,
                xp: randomInt(100, 5000),
                level: randomInt(1, 10),
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cls.id}_${i}`
            };
            students.push(student);
            classStudents.push(student);
        }

        // Generate 5-8 Assignments per class
        const assignmentCount = randomInt(5, 8);
        for (let j = 0; j < assignmentCount; j++) {
            const type = random(['exercise', 'test', 'project'] as const);
            const assignment: Assignment = {
                id: genId('a'),
                title: `Bài tập ${j + 1}: ${cls.subject} - Chủ đề ${j + 1}`,
                description: `Mô tả chi tiết cho bài tập số ${j + 1} của môn ${cls.subject}.`,
                dueDate: randomDate(new Date('2025-11-01'), new Date('2025-12-30')),
                status: 'open',
                type: type,
                xpReward: type === 'project' ? 1000 : (type === 'test' ? 500 : 200),
                teacherId: 'u2',
                classIds: [cls.id],
                subject: cls.subject
            };
            assignments.push(assignment);

            // Generate Submissions for this assignment
            // Not everyone submits
            classStudents.forEach(student => {
                // 80% submission rate
                if (Math.random() > 0.2) {
                    const isGraded = Math.random() > 0.3; // 70% graded
                    const score = randomInt(4, 10); // Random score 4-10

                    const submission: Submission = {
                        id: genId('sub'),
                        assignmentId: assignment.id,
                        studentId: student.id,
                        // @ts-ignore
                        studentName: student.name,
                        content: 'Bài làm mẫu...',
                        submittedAt: randomDate(new Date('2025-11-01'), new Date()),
                        status: isGraded ? 'graded' : 'submitted',
                        score: isGraded ? score : undefined,
                        feedback: isGraded ? (score >= 8 ? 'Làm tốt lắm!' : 'Cần cố gắng hơn.') : undefined
                    };
                    submissions.push(submission);
                }
            });
        }
    }

    return { classes, students, assignments, submissions };
};
