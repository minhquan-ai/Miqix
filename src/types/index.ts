export type UserRole = 'teacher' | 'student';


export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
    // Student specific
    classId?: string;
    // Teacher specific
    subjects?: string[];
}

export interface Class {
    id: string;
    name: string;
    subject: string;
    description: string;
    teacherId: string;
    schedule: string;
    avatar: string;
    code: string; // Unique 6-char code for joining
    role?: 'main' | 'extra'; // Added role
    grade?: string; // Added grade
    stream?: string; // Added stream (Phân ban)
    color?: string;
    classType?: string;
    maxStudents?: number;
    codeEnabled?: boolean;
    isPinned?: boolean;
    pinnedAt?: Date | string; // Added for sorting
    studentCount?: number;
    activeAssignments?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface FileAttachment {
    id: string;
    name: string;
    url: string;  // Base64 data URL or cloud URL
    type: string;  // MIME type
    size: number;  // bytes
    uploadedAt: string;
}

export interface RubricItem {
    id: string;
    criteria: string; // e.g., "Sáng tạo"
    description: string; // e.g., "Bài làm có ý tưởng mới lạ..."
    maxPoints: number; // e.g., 2.5
}

export interface AISettings {
    enabled: boolean;
    model: 'llama-3.3-70b-versatile' | 'llama-3.1-8b-instant' | 'mixtral-8x7b-32768' | 'mock';
    tone: 'encouraging' | 'neutral' | 'strict';
    language: 'vi' | 'en';
}

export interface Assignment {
    id: string;
    title: string;
    description: string;
    dueDate: string; // ISO Date string
    teacherId: string;
    classIds: string[]; // Changed from classId to support multiple classes
    type: 'exercise' | 'test' | 'project';
    status: 'draft' | 'open' | 'closed';
    subject?: string; // Môn học (Toán, Lý, Hóa...)
    attachments?: FileAttachment[]; // Teacher-uploaded files
    maxScore?: number; // Grading scale (e.g., 10, 100)
    rubric?: RubricItem[];
    aiSettings?: AISettings;
    isPhysical?: boolean; // New field for physical/paper-based assignments
}

export interface Submission {
    id: string;
    assignmentId: string;
    studentId: string;
    content: string; // Text or link
    submittedAt: string; // ISO Date string
    status: 'submitted' | 'graded';
    score?: number;
    feedback?: string;
    attachments?: FileAttachment[]; // Student-uploaded files
    studentName?: string; // Optional field for UI display (joined data)
    errorAnalysis?: {
        categories: {
            understanding: number;  // 0-100 severity
            calculation: number;
            presentation: number;
            logic: number;
        };
        mainIssues: string[];
        suggestions: string[];
    };
}

export interface Notification {
    id: string;
    userId: string;
    type: 'academic' | 'system';
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

export interface Mission {
    id: string;
    title: string;
    description: string;
    type: 'system' | 'custom'; // system: auto-generated, custom: user-created
    category: 'grading' | 'teaching' | 'admin' | 'learning' | 'personal';
    createdBy: string; // userId
    assignedTo: string; // userId (self-assigned)
    relatedAssignmentId?: string; // If mission is related to an Assignment
    relatedClassId?: string; // If mission is related to a Class
    dueDate?: string;
    status: 'pending' | 'in_progress' | 'completed';
    completedAt?: string;
    progress?: {
        current: number;
        total: number;
    }; // For tracking progress (e.g., graded 15/45 submissions)
}

export interface AIHint {
    id: string;
    assignmentId: string;
    studentId: string;
    question: string;
    hint: string; // The hint provided by AI
    createdAt: string;
}

export interface Reaction {
    userId: string;
    type: 'respect' | 'challenge';
}

export interface SocialEvent {
    id: string;
    type: 'help_request' | 'submission' | 'announcement' | 'assignment' | 'event' | 'general';
    userId: string;
    userName?: string;
    userAvatar?: string;
    content: string;
    timestamp: string;
    reactions: Reaction[];
    classId: string;
}

export interface AttendanceRecord {
    id: string;
    sessionId: string;
    studentId: string;
    studentName?: string; // For UI convenience
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    note?: string;
}

export interface ClassSession {
    id: string;
    classId: string;
    teacherId: string;
    teacherName?: string;
    date: string; // ISO Date
    period: number;
    subject?: string;
    lessonContent?: string;
    note?: string;
    classification?: 'A' | 'B' | 'C' | 'D'; // Tốt, Khá, Trung bình, Yếu
    attendanceRecords?: AttendanceRecord[];
    createdAt: string;
}

export interface Comment {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    createdAt: string;
}

export interface Announcement {
    id: string;
    classId: string;
    teacherId: string;
    teacherName: string;
    teacherAvatar?: string;
    content: string;
    title?: string;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
    type: 'normal' | 'urgent' | 'event' | 'important';
    reactions: Reaction[];
    comments: Comment[];
}

export interface Todo {
    id: string;
    userId: string;
    content: string;
    completed: boolean;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high';
    createdAt: string;
}
