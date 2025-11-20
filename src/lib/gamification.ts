import { User, Submission, Assignment } from "@/types";

// Badge definitions with unlock criteria
export const BADGE_DEFINITIONS = [
    {
        id: "first_step",
        name: "First Step",
        description: "Nộp bài tập đầu tiên",
        icon: "🎯",
        criteria: (user: User, submissions: Submission[]) => {
            const userSubmissions = submissions.filter(s => s.studentId === user.id);
            return userSubmissions.length >= 1;
        }
    },
    {
        id: "hard_worker",
        name: "Chiến binh Chăm chỉ",
        description: "Nộp 5 bài tập",
        icon: "💪",
        criteria: (user: User, submissions: Submission[]) => {
            const userSubmissions = submissions.filter(s => s.studentId === user.id);
            return userSubmissions.length >= 5;
        }
    },
    {
        id: "top_student",
        name: "Học Bá",
        description: "Đạt 90 điểm trở lên trong 3 bài tập",
        icon: "🏆",
        criteria: (user: User, submissions: Submission[]) => {
            const userSubmissions = submissions.filter(s => s.studentId === user.id && s.status === "graded");
            const highScores = userSubmissions.filter(s => (s.score || 0) >= 90);
            return highScores.length >= 3;
        }
    },
    {
        id: "streak_master",
        name: "Streak Master",
        description: "Đạt chuỗi 7 ngày liên tiếp",
        icon: "🔥",
        criteria: (user: User) => {
            return (user.streak || 0) >= 7;
        }
    },
    {
        id: "perfect_score",
        name: "Perfect Score",
        description: "Đạt 100 điểm trong một bài tập",
        icon: "⭐",
        criteria: (user: User, submissions: Submission[]) => {
            const userSubmissions = submissions.filter(s => s.studentId === user.id && s.status === "graded");
            return userSubmissions.some(s => s.score === 100);
        }
    }
];

/**
 * Calculate level from XP using exponential curve
 * Level 1: 0-100 XP
 * Level 2: 100-250 XP  
 * Level 3: 250-450 XP
 * And so on...
 */
export function calculateLevel(xp: number): number {
    if (xp < 0) return 1;

    // Formula: level = floor(sqrt(xp / 50)) + 1
    const level = Math.floor(Math.sqrt(xp / 50)) + 1;
    return Math.max(1, level);
}

/**
 * Calculate XP needed for next level
 */
export function xpForNextLevel(currentLevel: number): number {
    // Inverse of calculateLevel formula
    return (currentLevel) * (currentLevel) * 50;
}

/**
 * Calculate XP to award based on score
 * Base XP + bonus for high scores
 */
export function calculateXP(score: number, maxScore: number = 100): number {
    const percentage = (score / maxScore) * 100;

    // Base XP: 10-50 based on score percentage
    const baseXP = Math.floor((percentage / 100) * 40) + 10;

    // Bonus XP for high scores
    let bonusXP = 0;
    if (percentage >= 90) bonusXP = 20;
    else if (percentage >= 80) bonusXP = 10;
    else if (percentage >= 70) bonusXP = 5;

    return baseXP + bonusXP;
}

/**
 * Update user streak based on submission date
 * Returns updated user with new streak and lastSubmissionDate
 */
export function updateStreak(user: User, submissionDate: Date = new Date()): Partial<User> {
    const lastDate = user.lastSubmissionDate ? new Date(user.lastSubmissionDate) : null;
    const todayStart = new Date(submissionDate);
    todayStart.setHours(0, 0, 0, 0);

    if (!lastDate) {
        // First submission ever
        return {
            streak: 1,
            lastSubmissionDate: submissionDate.toISOString()
        };
    }

    const lastStart = new Date(lastDate);
    lastStart.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((todayStart.getTime() - lastStart.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
        // Same day, no change
        return {
            lastSubmissionDate: submissionDate.toISOString()
        };
    } else if (daysDiff === 1) {
        // Next day, increment streak
        return {
            streak: (user.streak || 0) + 1,
            lastSubmissionDate: submissionDate.toISOString()
        };
    } else {
        // Streak broken, reset to 1
        return {
            streak: 1,
            lastSubmissionDate: submissionDate.toISOString()
        };
    }
}

/**
 * Check which badges should be unlocked for user
 * Returns array of newly unlocked badge IDs
 */
export function checkBadgeUnlock(
    user: User,
    submissions: Submission[],
    assignments: Assignment[] = []
): string[] {
    const currentBadgeIds = (user.badges || []).map(b => typeof b === 'string' ? b : b.id);
    const newlyUnlocked: string[] = [];

    for (const badge of BADGE_DEFINITIONS) {
        // Skip if already has this badge
        if (currentBadgeIds.includes(badge.id)) continue;

        // Check if criteria met
        if (badge.criteria(user, submissions)) {
            newlyUnlocked.push(badge.id);
        }
    }

    return newlyUnlocked;
}

/**
 * Get badge info by ID
 */
export function getBadgeInfo(badgeId: string) {
    return BADGE_DEFINITIONS.find(b => b.id === badgeId);
}
