export type UserRole = 'teacher' | 'student';

export interface Badge {
    id: string;
    name: string;
    icon: string; // Emoji or icon name
    description: string;
    earnedAt: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
    // Student specific
    classId?: string;
    xp?: number;
    level?: number;
    streak?: number;
    lastSubmissionDate?: string; // ISO date string for streak tracking
    badges?: Badge[];
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
}

export interface FileAttachment {
    id: string;
    name: string;
    url: string;  // Base64 data URL or cloud URL
    type: string;  // MIME type
    size: number;  // bytes
    uploadedAt: string;
}

export interface Assignment {
    id: string;
    title: string;
    description: string;
    dueDate: string; // ISO Date string
    teacherId: string;
    classIds: string[]; // Changed from classId to support multiple classes
    type: 'exercise' | 'test' | 'project';
    xpReward: number;
    status: 'draft' | 'open' | 'closed';
    subject?: string; // Môn học (Toán, Lý, Hóa...)
    attachments?: FileAttachment[]; // Teacher-uploaded files
    maxScore?: number; // Grading scale (e.g., 10, 100)
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
    type: 'academic' | 'gamification' | 'system';
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
    xpReward?: number; // Only for students
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

