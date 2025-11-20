import { Assignment, Class, Mission, Submission, User, type Notification } from "@/types";

import { generateMockData } from "./mockDataGenerator";
import { updateStreak, checkBadgeUnlock, calculateLevel, calculateXP, BADGE_DEFINITIONS } from "./gamification";

// Generate Mock Data
const generatedData = generateMockData();

// Mock Data Store
const MOCK_USERS: User[] = [
    {
        id: "u1",
        name: "Nguyễn Văn A",
        email: "student@ergonix.com",
        role: "student",
        classId: "c_10a1", // Assign to generated class
        xp: 2450,
        level: 5,
        streak: 3,
        badges: [
            { id: 'b1', name: 'Chiến binh Chăm chỉ', icon: '🔥', description: 'Hoàn thành bài tập 3 ngày liên tiếp', earnedAt: '2025-11-18T10:00:00Z' },
            { id: 'b2', name: 'Khởi đầu Hoàn hảo', icon: '✨', description: 'Đạt điểm 100 bài tập đầu tiên', earnedAt: '2025-11-10T15:30:00Z' }
        ],
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
    },
    {
        id: "u2",
        name: "Cô Giáo Thảo",
        email: "teacher@ergonix.com",
        role: "teacher",
        subjects: ["Toán", "Lý", "Hóa"],
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka"
    },
    ...generatedData.students
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
    ...generatedData.assignments,
    // Keep original demo assignment for u1
    {
        id: 'a1',
        title: 'Đạo hàm và Ứng dụng',
        description: 'Hoàn thành bài tập trang 45-50 SGK. Chú ý các bài toán về cực trị và tính đơn điệu.',
        dueDate: '2025-12-15T23:59:59Z',
        status: 'open',
        type: 'exercise',
        xpReward: 500,
        teacherId: 'u2',
        classIds: ['c_10a1'],
        subject: 'Toán',
        attachments: [
            {
                id: 'att1',
                name: 'Bai_tap_dao_ham.pdf',
                url: '#',
                type: 'application/pdf',
                size: 1024 * 1024 * 2.5, // 2.5MB
                uploadedAt: '2025-11-10T08:00:00Z'
            },
            {
                id: 'att2',
                name: 'Huong_dan_giai.docx',
                url: '#',
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                size: 1024 * 500, // 500KB
                uploadedAt: '2025-11-10T08:05:00Z'
            }
        ]
    }
];


const MOCK_SUBMISSIONS: Submission[] = [
    ...generatedData.submissions
];

// Service Functions

// Helper to load submissions from localStorage
const loadSubmissions = (): Submission[] => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('ergonix_submissions');
        if (stored) {
            return JSON.parse(stored);
        }
    }
    return [
        // Real student submission for u1 - Assignment a1 (GRADED)
        {
            id: 'sub_a1_u1',
            assignmentId: 'a1',
            studentId: 'u1',
            studentName: 'Nguyễn Văn A',
            content: 'Bài làm về Đạo hàm:\n\n1. Đạo hàm của x^2 là 2x\n2. Đạo hàm của sin(x) là cos(x)\n3. Ứng dụng: Tính vận tốc tức thời.',
            submittedAt: new Date('2025-01-15T10:30:00Z').toISOString(),
            status: 'graded',
            score: 85,
            feedback: 'Làm tốt lắm! Cần chú ý trình bày rõ ràng hơn ở phần ứng dụng.',
            errorAnalysis: {
                categories: {
                    understanding: 15,
                    calculation: 10,
                    presentation: 35,
                    logic: 5
                },
                mainIssues: [
                    "Phần ứng dụng viết hơi vắn tắt"
                ],
                suggestions: [
                    "Nên liệt kê thêm ví dụ cụ thể về ứng dụng của đạo hàm",
                    "Giải thích chi tiết hơn cách áp dụng vào bài toán thực tế",
                    "Bổ sung hình vẽ minh họa nếu có thể"
                ]
            }
        },
        // Real student submission for u1 - Assignment a2 (SUBMITTED but not graded yet)
        {
            id: 'sub_a2_u1',
            assignmentId: 'a2',
            studentId: 'u1',
            studentName: 'Nguyễn Văn A',
            content: 'Mô hình 3D về sao Hỏa:\n\n- Đường kính: ~6,779 km\n- Màu đỏ do oxide sắt\n- Có 2 mặt trăng: Phobos và Deimos\n- Link mô hình: https://example.com/mars-model',
            submittedAt: new Date('2025-01-16T14:20:00Z').toISOString(),
            status: 'submitted',
            score: undefined,
            feedback: undefined,
        },

        // Mock submissions for other students (30 entries)
        ...Array.from({ length: 30 }, (_, i) => ({
            id: 'sub_a1_' + i,
            assignmentId: 'a1',
            studentId: 'student_' + i,
            studentName: 'Học sinh ' + (i + 1),
            content: 'Bài làm mẫu số ' + (i + 1),
            submittedAt: new Date('2025-01-01T00:00:00Z').toISOString(),
            status: (i % 2 === 0 ? 'graded' : 'submitted') as 'graded' | 'submitted',
            score: i % 2 === 0 ? 80 + (i % 20) : undefined,
            feedback: i % 2 === 0 ? 'Làm tốt lắm!' : undefined,
        }))
    ];
};

let MOCK_SUBMISSIONS_LIST: Submission[] = loadSubmissions();

const saveSubmissions = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('mockSubmissions', JSON.stringify(MOCK_SUBMISSIONS_LIST));
    }
};

const saveUsers = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('mockUsers', JSON.stringify(MOCK_USERS));
    }
};

// Helper to load missions from localStorage
const loadMissions = (): Mission[] => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('ergonix_missions');
        if (stored) {
            return JSON.parse(stored);
        }
    }
    return [
        // System mission: Grade assignment a1 (in progress)
        {
            id: 'm_grade_a1',
            title: 'Chấm bài tập "Đạo hàm và Ứng dụng"',
            description: 'Chấm tất cả bài nộp của học sinh lớp 12A1',
            type: 'system',
            category: 'grading',
            createdBy: 'u2',
            assignedTo: 'u2',
            relatedAssignmentId: 'a1',
            relatedClassId: 'c1',
            status: 'in_progress',
            progress: {
                current: 1,  // Currently 1 submission graded
                total: 2     // Total 2 submissions (u1's graded submission + u1's a2 submission counted)
            }
        } as Mission,

        // System mission: Grade assignment a2 (pending - no submissions yet)
        {
            id: 'm_grade_a2',
            title: 'Chấm bài tập "Khảo sát hàm số"',
            description: 'Chấm tất cả bài nộp của học sinh lớp 12A1',
            type: 'system',
            category: 'grading',
            createdBy: 'u2',
            assignedTo: 'u2',
            relatedAssignmentId: 'a2',
            relatedClassId: 'c1',
            status: 'in_progress',
            progress: {
                current: 0,  // Not graded yet (submitted but not graded)
                total: 1
            }
        } as Mission,

        // System mission: Grade assignment a3 (pending)
        {
            id: 'm_grade_a3',
            title: 'Chấm bài tập "Nguyên hàm tích phân"',
            description: 'Chấm tất cả bài nộp của học sinh lớp 12A1',
            type: 'system',
            category: 'grading',
            createdBy: 'u2',
            assignedTo: 'u2',
            relatedAssignmentId: 'a3',
            relatedClassId: 'c1',
            status: 'pending',
            progress: {
                current: 0,
                total: 0  // No submissions yet
            }
        } as Mission,

        // Custom missions (teacher-created)
        {
            id: 'm_custom_1',
            title: 'Soạn đề kiểm tra giữa kỳ',
            description: 'Chuẩn bị đề kiểm tra giữa kỳ môn Toán cho lớp 12A1 - chương Đạo hàm và Ứng dụng',
            type: 'custom',
            category: 'teaching',
            createdBy: 'u2',
            assignedTo: 'u2',
            dueDate: '2025-12-10T23:59:59Z',
            status: 'in_progress'
        } as Mission,

        {
            id: 'm_custom_2',
            title: 'Họp phụ huynh lớp 12A1',
            description: 'Chuẩn bị tài liệu và báo cáo kết quả học tập học kỳ 1 để họp phụ huynh',
            type: 'custom',
            category: 'admin',
            createdBy: 'u2',
            assignedTo: 'u2',
            dueDate: '2025-12-05T14:00:00Z',
            status: 'pending'
        } as Mission,

        {
            id: 'm_custom_3',
            title: 'Tham gia bồi dưỡng chuyên môn',
            description: 'Tham gia khóa bồi dưỡng "Ứng dụng AI trong giảng dạy Toán THPT" do Sở GD&ĐT tổ chức',
            type: 'custom',
            category: 'personal',
            createdBy: 'u2',
            assignedTo: 'u2',
            dueDate: '2025-11-25T09:00:00Z',
            status: 'completed',
            completedAt: '2025-11-20T16:30:00Z'
        } as Mission,

        {
            id: 'm_custom_4',
            title: 'Cập nhật sổ điểm học kỳ',
            description: 'Nhập điểm kiểm tra thường xuyên và định kỳ cho học sinh lớp 12A1 vào hệ thống',
            type: 'custom',
            category: 'admin',
            createdBy: 'u2',
            assignedTo: 'u2',
            dueDate: '2025-12-15T23:59:59Z',
            status: 'pending'
        } as Mission,

        // Student Personal Missions (for student u1)
        {
            id: 'm_student_1',
            title: 'Học 50 từ vựng Tiếng Anh',
            description: 'Học thuộc 50 từ vựng chủ đề "Environment" để chuẩn bị kiểm tra',
            type: 'custom',
            category: 'learning',
            createdBy: 'u1',
            assignedTo: 'u1',
            dueDate: '2025-11-22T23:59:59Z',
            status: 'in_progress'
        } as Mission,

        {
            id: 'm_student_2',
            title: 'Ôn tập chương Đạo hàm',
            description: 'Làm lại các bài tập trong SGK và SBT chương Đạo hàm để chuẩn bị kiểm tra',
            type: 'custom',
            category: 'learning',
            createdBy: 'u1',
            assignedTo: 'u1',
            dueDate: '2025-11-25T23:59:59Z',
            status: 'pending'
        } as Mission,

        {
            id: 'm_student_3',
            title: 'Đọc "Tắt đèn" của Ngô Tất Tố',
            description: 'Đọc và ghi chú nội dung, nhân vật, nghệ thuật của tác phẩm "Tắt đèn"',
            type: 'custom',
            category: 'personal',
            createdBy: 'u1',
            assignedTo: 'u1',
            dueDate: '2025-11-28T23:59:59Z',
            status: 'pending'
        } as Mission
    ];
};

let MOCK_MISSIONS: Mission[] = loadMissions();

const saveMissions = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('ergonix_missions', JSON.stringify(MOCK_MISSIONS));
    }
};

const MOCK_CLASSES: Class[] = [
    ...generatedData.classes
];

export const DataService = {
    // Helper for localStorage
    getFromStorage: <T>(key: string, defaultValue: T): T => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('ergonix_' + key);
            if (stored) {
                try {
                    return JSON.parse(stored);
                } catch (e) {
                    console.error('Error parsing storage key:', key, e);
                }
            }
        }
        return defaultValue;
    },

    saveToStorage: <T>(key: string, data: T): void => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('ergonix_' + key, JSON.stringify(data));
        }
    },
    getCurrentUser: async (): Promise<User | null> => {
        // Simulate network delay
        // await new Promise(resolve => setTimeout(resolve, 500));

        let role: 'teacher' | 'student' = 'student';

        if (typeof window !== 'undefined') {
            const storedRole = localStorage.getItem('ergonix_role');
            if (storedRole === 'teacher') {
                role = 'teacher';
            }
        }

        // Find user in MOCK_USERS
        const user = MOCK_USERS.find(u => u.role === role);

        if (user) {
            // Check for persisted classId in localStorage (to survive reloads in demo)
            if (typeof window !== 'undefined' && user.role === 'student') {
                const storedClassId = localStorage.getItem('ergonix_class_id');
                if (storedClassId) {
                    user.classId = storedClassId;
                }
            }
            return { ...user }; // Return copy to avoid direct mutation issues if any
        }

        return MOCK_USERS[0];
    },

    login: async (role: 'teacher' | 'student') => {

        if (typeof window !== 'undefined') {
            localStorage.setItem('ergonix_role', role);
        }
    },

    // Class Management
    getClasses: async (teacherId: string): Promise<Class[]> => {

        return MOCK_CLASSES.filter(c => c.teacherId === teacherId || teacherId === 't1'); // Mock: return all for t1
    },

    getClassById: async (id: string): Promise<Class | undefined> => {

        return MOCK_CLASSES.find(c => c.id === id);
    },

    // Legacy getClassMembers removed


    // Legacy methods removed
    getAssignments: async (classId?: string): Promise<Assignment[]> => {

        if (classId) {
            return MOCK_ASSIGNMENTS.filter(a => a.classIds.includes(classId));
        }
        return MOCK_ASSIGNMENTS;
    },

    getSubmissions: async (): Promise<Submission[]> => {

        return MOCK_SUBMISSIONS_LIST;
    },

    getSubmissionsForTeacher: async (teacherId: string): Promise<Submission[]> => {

        const assignments = MOCK_ASSIGNMENTS.filter(a => a.teacherId === teacherId);
        const assignmentIds = assignments.map(a => a.id);

        const submissions = MOCK_SUBMISSIONS_LIST.filter(s => assignmentIds.includes(s.assignmentId));

        // Join with user data
        return submissions.map(sub => {
            const student = MOCK_USERS.find(u => u.id === sub.studentId);
            return {
                ...sub,
                studentName: student ? student.name : (sub.studentName || "Unknown Student")
            };
        });
    },

    getAssignmentById: async (id: string): Promise<Assignment | undefined> => {

        return MOCK_ASSIGNMENTS.find((a) => a.id === id);
    },

    // New method to create an assignment
    createAssignment: async (newAssignment: Omit<Assignment, "id">) => {

        const assignment: Assignment = {
            ...newAssignment,
            id: 'a' + Math.floor(Math.random() * 10000),
        };
        MOCK_ASSIGNMENTS.push(assignment);

        // Auto-generate grading missions for each class
        for (const classId of assignment.classIds) {
            await DataService.generateGradingMission(assignment.id, assignment.teacherId, classId);
        }

        return assignment;
    },

    submitAssignment: async (submission: Omit<Submission, "id" | "submittedAt" | "status">) => {

        const newSubmission: Submission = {
            ...submission,
            id: 'sub_' + submission.assignmentId + '_' + Date.now(),
            submittedAt: new Date().toISOString(),
            status: "submitted",
        };
        MOCK_SUBMISSIONS_LIST.push(newSubmission);
        saveSubmissions();

        await DataService.updateUserGamification(submission.studentId, 'submission');

        return newSubmission;
    },

    updateUserGamification: async (userId: string, event: 'submission' | 'grading', score?: number) => {
        const user = MOCK_USERS.find(u => u.id === userId);
        if (!user || user.role !== 'student') return;

        let updated = false;

        if (event === 'submission') {
            const streakUpdate = updateStreak(user);
            Object.assign(user, streakUpdate);
            updated = true;
        }

        if (event === 'grading' && score !== undefined) {
            const xpGained = calculateXP(score);
            user.xp = (user.xp || 0) + xpGained;
            user.level = calculateLevel(user.xp);
            updated = true;
        }

        const newBadges = checkBadgeUnlock(user, MOCK_SUBMISSIONS_LIST);
        if (newBadges.length > 0) {
            const currentBadgeIds = (user.badges || []).map(b => typeof b === 'string' ? b : b.id);
            const badgesToAdd = newBadges.filter(bid => !currentBadgeIds.includes(bid));

            if (badgesToAdd.length > 0) {
                const badgeObjects = badgesToAdd.map(bid => {
                    const badgeDef = BADGE_DEFINITIONS.find(b => b.id === bid);
                    return {
                        id: bid,
                        name: badgeDef?.name || bid,
                        icon: badgeDef?.icon || '🏅',
                        description: badgeDef?.description || '',
                        earnedAt: new Date().toISOString()
                    };
                });

                user.badges = [...(user.badges || []), ...badgeObjects];
                updated = true;

                for (const badge of badgeObjects) {
                    MOCK_NOTIFICATIONS.push({
                        id: 'n_badge_' + Date.now() + '_' + Math.random(),
                        userId: userId,
                        type: 'gamification',
                        title: 'Huy hiệu mới! ' + badge.icon,
                        message: 'Chúc mừng! Bạn đã nhận được huy hiệu "' + badge.name + '".',
                        link: '/dashboard/achievements',
                        isRead: false,
                        createdAt: new Date().toISOString()
                    });
                }
            }
        }

        if (updated) {
            saveUsers();
        }
    },

    getSubmissionsByAssignmentId: async (assignmentId: string): Promise<Submission[]> => {

        // Return all submissions for this assignment
        const submissions = MOCK_SUBMISSIONS_LIST.filter((s) => s.assignmentId === assignmentId);

        // Join with user data to ensure studentName is populated
        return submissions.map(sub => {
            const student = MOCK_USERS.find(u => u.id === sub.studentId);
            return {
                ...sub,
                studentName: student ? student.name : (sub.studentName || "Unknown Student")
            };
        });
    },

    getSubmissionById: async (submissionId: string): Promise<Submission | undefined> => {

        const sub = MOCK_SUBMISSIONS_LIST.find((s) => s.id === submissionId);
        if (sub) {
            const student = MOCK_USERS.find(u => u.id === sub.studentId);
            return {
                ...sub,
                studentName: student ? student.name : (sub.studentName || "Unknown Student")
            };
        }
        return undefined;
    },

    // Get a specific student's submission for an assignment
    getStudentSubmission: async (assignmentId: string, studentId: string): Promise<Submission | undefined> => {

        const sub = MOCK_SUBMISSIONS_LIST.find((s) =>
            s.assignmentId === assignmentId && s.studentId === studentId
        );
        if (sub) {
            const student = MOCK_USERS.find(u => u.id === sub.studentId);
            return {
                ...sub,
                studentName: student ? student.name : (sub.studentName || "Unknown Student")
            };
        }
        return undefined;
    },


    // Mission Management
    getMissions: async (userId: string): Promise<Mission[]> => {

        return MOCK_MISSIONS.filter(m => m.assignedTo === userId);
    },

    createMission: async (data: Omit<Mission, 'id'>): Promise<Mission> => {

        const mission: Mission = {
            ...data,
            id: 'm' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        };
        MOCK_MISSIONS.push(mission);
        saveMissions();
        return mission;
    },

    updateMission: async (missionId: string, updates: Partial<Mission>): Promise<Mission | undefined> => {

        const mission = MOCK_MISSIONS.find(m => m.id === missionId);
        if (mission) {
            Object.assign(mission, updates);
            saveMissions();
            return mission;
        }
        return undefined;
    },

    updateSubmission: async (submission: Submission): Promise<Submission> => {

        const index = MOCK_SUBMISSIONS_LIST.findIndex(s => s.id === submission.id);
        if (index !== -1) {
            MOCK_SUBMISSIONS_LIST[index] = submission;
            saveSubmissions();

            // Update gamification if graded with score
            if (submission.status === 'graded' && submission.score !== undefined) {
                await DataService.updateUserGamification(submission.studentId, 'grading', submission.score);
            }

            return submission;
        }
        throw new Error("Submission not found");
    },

    getNotifications: async (userId: string): Promise<Notification[]> => {

        return MOCK_NOTIFICATIONS.filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    markNotificationAsRead: async (id: string): Promise<void> => {

        const notification = MOCK_NOTIFICATIONS.find(n => n.id === id);
        if (notification) {
            notification.isRead = true;
        }
    },

    // --- Class Management ---

    createClass: async (teacherId: string, data: { name: string; subject: string; description: string }): Promise<Class> => {

        const classes = DataService.getFromStorage<Class[]>('classes', MOCK_CLASSES);

        // Generate unique 6-char code
        const generateCode = () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, 1, O, 0
            let code = '';
            for (let i = 0; i < 6; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return code;
        };

        let code = generateCode();
        // Ensure uniqueness (simple check)
        while (classes.some(c => c.code === code)) {
            code = generateCode();
        }

        const newClass: Class = {
            id: `c${Date.now()}`,
            teacherId,
            name: data.name,
            subject: data.subject,
            description: data.description,
            schedule: "TBD",
            avatar: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80",
            code
        };

        classes.push(newClass);
        DataService.saveToStorage('classes', classes);
        return newClass;
    },

    joinClass: async (studentId: string, code: string): Promise<{ success: boolean; message: string; classId?: string }> => {

        const classes = DataService.getFromStorage<Class[]>('classes', MOCK_CLASSES);
        const targetClass = classes.find(c => c.code === code.toUpperCase());

        if (!targetClass) {
            return { success: false, message: "Mã lớp không tồn tại" };
        }

        // In a real DB, we would have a separate table for ClassMembers.
        // For this mock with localStorage, we'll assume we need to track this relationship.
        // Let's update the MOCK_USERS to include classIds if not present, or use a separate mapping.
        // For simplicity in this prototype, we will check if the relationship exists in a 'class_members' storage.

        interface ClassMember { classId: string; studentId: string; joinedAt: string }
        const members = DataService.getFromStorage<ClassMember[]>('class_members', []);

        if (members.some(m => m.classId === targetClass.id && m.studentId === studentId)) {
            return { success: false, message: "Bạn đã tham gia lớp này rồi" };
        }

        members.push({
            classId: targetClass.id,
            studentId,
            joinedAt: new Date().toISOString()
        });
        DataService.saveToStorage('class_members', members);

        return { success: true, message: "Tham gia lớp thành công", classId: targetClass.id };
    },

    getClassMembers: async (classId: string): Promise<User[]> => {

        // Get explicit members from storage
        const members = DataService.getFromStorage<{ classId: string; studentId: string }[]>('class_members', []);
        const studentIds = members.filter(m => m.classId === classId).map(m => m.studentId);

        // Also include hardcoded mock relationships for demo purposes if storage is empty
        const allUsers = DataService.getFromStorage<User[]>('users', MOCK_USERS);

        // For the prototype, we return users who are either explicitly in class_members OR are students (simplification for demo if no members yet)
        // BETTER LOGIC: Return only those in the list + hardcoded ones for 'c1'

        if (classId === 'c1' && members.length === 0) {
            return allUsers.filter(u => u.role === 'student');
        }

        return allUsers.filter(u => studentIds.includes(u.id));
    },

    async getStudents(teacherId: string): Promise<User[]> {
        const classes = await DataService.getClasses(teacherId);
        const allStudents: User[] = [];
        const uniqueIds = new Set<string>();

        for (const cls of classes) {
            const members = await DataService.getClassMembers(cls.id);
            for (const member of members) {
                if (!uniqueIds.has(member.id)) {
                    uniqueIds.add(member.id);
                    allStudents.push(member);
                }
            }
        }
        return allStudents;
    },

    async removeStudentFromClass(classId: string, studentId: string): Promise<void> {
        const members = DataService.getFromStorage<any[]>('class_members', []);
        const newMembers = members.filter((m: any) => !(m.classId === classId && m.studentId === studentId));
        DataService.saveToStorage('class_members', newMembers);
    },

    // Auto-generate grading mission for teacher when creating assignment
    generateGradingMission: async (assignmentId: string, teacherId: string, classId: string): Promise<Mission> => {
        const assignment = MOCK_ASSIGNMENTS.find(a => a.id === assignmentId);
        if (!assignment) throw new Error('Assignment not found');

        const mission: Mission = {
            id: 'm_grade_' + assignmentId + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            title: 'Chấm bài tập "' + assignment.title + '"',
            description: 'Chấm tất cả bài nộp của học sinh cho bài tập "' + assignment.title + '"',
            type: 'system',
            category: 'grading',
            createdBy: teacherId,
            assignedTo: teacherId,
            relatedAssignmentId: assignmentId,
            relatedClassId: classId,
            status: 'pending',
            progress: {
                current: 0,
                total: 0  // Will be updated as students submit
            }
        };

        MOCK_MISSIONS.push(mission);
        saveMissions();
        return mission;
    },

    // Update grading mission progress
    updateGradingProgress: async (assignmentId: string): Promise<void> => {
        const mission = MOCK_MISSIONS.find(m =>
            m.type === 'system' &&
            m.category === 'grading' &&
            m.relatedAssignmentId === assignmentId
        );

        if (mission && mission.progress) {
            const allSubmissions = MOCK_SUBMISSIONS_LIST.filter((s) => s.assignmentId === assignmentId);
            const gradedSubmissions = allSubmissions.filter((s) => s.status === 'graded');

            mission.progress.total = allSubmissions.length;
            mission.progress.current = gradedSubmissions.length;

            if (mission.progress.current === mission.progress.total && mission.progress.total > 0) {
                mission.status = 'completed';
                mission.completedAt = new Date().toISOString();
            } else if (mission.progress.current > 0) {
                mission.status = 'in_progress';
            }

            saveMissions();
        }
    }
};

// Mock Notifications
const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 'n1',
        userId: 'u1',
        type: 'academic',
        title: 'Bài tập đã được chấm',
        message: 'Giáo viên đã chấm bài "Đạo hàm và Ứng dụng". Xem kết quả ngay!',
        link: '/dashboard/assignments/a1',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
    },
    {
        id: 'n2',
        userId: 'u1',
        type: 'gamification',
        title: 'Huy hiệu mới!',
        message: 'Chúc mừng! Bạn đã nhận được huy hiệu "Chiến binh Chăm chỉ".',
        link: '/dashboard/achievements',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
    },
    {
        id: 'n3',
        userId: 'u1',
        type: 'system',
        title: 'Chào mừng trở lại',
        message: 'Hệ thống đã cập nhật giao diện mới. Khám phá ngay!',
        link: '/dashboard',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() // 2 days ago
    }
];
