/**
 * Analytics utilities for student progress tracking
 */

import { Assignment, Submission } from '@/types';

export interface TopicPerformance {
    topic: string;
    subject: string;
    totalAssignments: number;
    averageScore: number;
    accuracy: number; // 0-100
    trend: 'improving' | 'declining' | 'stable';
}

export interface StudentStrengthWeakness {
    strengths: TopicPerformance[];
    weaknesses: TopicPerformance[];
    mostImproved: TopicPerformance | null;
    needsAttention: TopicPerformance[];
}

export interface ProgressDataPoint {
    date: string;
    score: number;
    assignmentTitle: string;
    subject: string;
}

/**
 * Calculate performance by topic/subject
 */
export const calculateTopicPerformance = (
    submissions: Submission[],
    assignments: Assignment[]
): TopicPerformance[] => {
    const topicMap = new Map<string, {
        scores: number[];
        subject: string;
        assignments: number;
    }>();

    submissions.forEach(submission => {
        if (submission.status !== 'graded' || !submission.score) return;

        const assignment = assignments.find(a => a.id === submission.assignmentId);
        if (!assignment) return;

        const topic = assignment.subject || 'Other';
        const existing = topicMap.get(topic);

        if (existing) {
            existing.scores.push(submission.score);
            existing.assignments++;
        } else {
            topicMap.set(topic, {
                scores: [submission.score],
                subject: assignment.subject || 'Other',
                assignments: 1
            });
        }
    });

    const performances: TopicPerformance[] = [];

    topicMap.forEach((data, topic) => {
        const averageScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
        const accuracy = (averageScore / 10) * 100; // Assuming scores are out of 10

        // Simple trend calculation (compare first half vs second half)
        const mid = Math.floor(data.scores.length / 2);
        const firstHalf = data.scores.slice(0, mid);
        const secondHalf = data.scores.slice(mid);

        const firstAvg = firstHalf.length > 0
            ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
            : 0;
        const secondAvg = secondHalf.length > 0
            ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
            : 0;

        let trend: 'improving' | 'declining' | 'stable' = 'stable';
        if (secondAvg > firstAvg + 0.5) trend = 'improving';
        else if (secondAvg < firstAvg - 0.5) trend = 'declining';

        performances.push({
            topic,
            subject: data.subject,
            totalAssignments: data.assignments,
            averageScore,
            accuracy,
            trend
        });
    });

    return performances.sort((a, b) => b.accuracy - a.accuracy);
};

/**
 * Identify strengths and weaknesses
 */
export const analyzeStrengthsWeaknesses = (
    performances: TopicPerformance[]
): StudentStrengthWeakness => {
    const sorted = [...performances].sort((a, b) => b.accuracy - a.accuracy);

    return {
        strengths: sorted.slice(0, 3), // Top 3
        weaknesses: sorted.slice(-3).reverse(), // Bottom 3
        mostImproved: sorted.find(p => p.trend === 'improving') || null,
        needsAttention: sorted.filter(p => p.accuracy < 60 || p.trend === 'declining')
    };
};

/**
 * Get progress timeline data
 */
export const getProgressTimeline = (
    submissions: Submission[],
    assignments: Assignment[]
): ProgressDataPoint[] => {
    const points: ProgressDataPoint[] = [];

    submissions
        .filter(s => s.status === 'graded' && s.score !== undefined)
        .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
        .forEach(submission => {
            const assignment = assignments.find(a => a.id === submission.assignmentId);
            if (!assignment) return;

            points.push({
                date: submission.submittedAt,
                score: submission.score!,
                assignmentTitle: assignment.title,
                subject: assignment.subject || 'Other'
            });
        });

    return points;
};

/**
 * Calculate overall statistics
 */
export const calculateOverallStats = (submissions: Submission[]) => {
    const gradedSubmissions = submissions.filter(s => s.status === 'graded' && s.score !== undefined);

    if (gradedSubmissions.length === 0) {
        return {
            totalSubmissions: submissions.length,
            gradedSubmissions: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0,
            completionRate: 0
        };
    }

    const scores = gradedSubmissions.map(s => s.score!);
    const totalSubmissions = submissions.length;

    return {
        totalSubmissions,
        gradedSubmissions: gradedSubmissions.length,
        averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
        completionRate: (gradedSubmissions.length / totalSubmissions) * 100
    };
};

/**
 * Get personalized practice suggestions
 */
export const getPracticeSuggestions = (weaknesses: TopicPerformance[]): string[] => {
    const suggestions: string[] = [];

    weaknesses.forEach(weakness => {
        if (weakness.accuracy < 50) {
            suggestions.push(
                `Làm thêm bài tập về ${weakness.topic} để cải thiện (hiện tại: ${Math.round(weakness.accuracy)}%)`
            );
        } else if (weakness.accuracy < 70) {
            suggestions.push(
                `Ôn lại kiến thức về ${weakness.topic} (đang ở mức ${Math.round(weakness.accuracy)}%)`
            );
        }
    });

    return suggestions.slice(0, 5); // Max 5 suggestions
};

// ==========================================
// Teacher Analytics
// ==========================================

export interface ClassTopicPerformance {
    topic: string;
    averageScore: number;
    submissionCount: number;
    totalStudents: number;
    completionRate: number;
}

export interface AtRiskStudent {
    studentId: string;
    studentName: string;
    averageScore: number;
    missingAssignments: number;
    trend: 'declining' | 'stable' | 'improving';
}

/**
 * Calculate class performance by topic
 */
export const calculateClassTopicPerformance = (
    submissions: Submission[],
    assignments: Assignment[],
    totalStudents: number
): ClassTopicPerformance[] => {
    const topicMap = new Map<string, {
        scores: number[];
        submissionCount: number;
    }>();

    submissions.forEach(submission => {
        if (submission.status !== 'graded' || !submission.score) return;

        const assignment = assignments.find(a => a.id === submission.assignmentId);
        if (!assignment) return;

        const topic = assignment.subject || 'Other';
        const existing = topicMap.get(topic);

        if (existing) {
            existing.scores.push(submission.score);
            existing.submissionCount++;
        } else {
            topicMap.set(topic, {
                scores: [submission.score],
                submissionCount: 1
            });
        }
    });

    const performances: ClassTopicPerformance[] = [];

    topicMap.forEach((data, topic) => {
        const averageScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
        const completionRate = (data.submissionCount / (totalStudents * assignments.filter(a => a.subject === topic).length)) * 100;

        performances.push({
            topic,
            averageScore,
            submissionCount: data.submissionCount,
            totalStudents,
            completionRate: Math.min(100, completionRate) // Cap at 100
        });
    });

    return performances.sort((a, b) => a.averageScore - b.averageScore); // Sort by lowest score first (to highlight problem areas)
};

/**
 * Identify at-risk students
 */
export const identifyAtRiskStudents = (
    submissions: Submission[],
    students: { id: string; name: string }[],
    assignments: Assignment[]
): AtRiskStudent[] => {
    const atRisk: AtRiskStudent[] = [];

    students.forEach(student => {
        const studentSubmissions = submissions.filter(s => s.studentId === student.id);
        const gradedSubmissions = studentSubmissions.filter(s => s.status === 'graded');

        const scores = gradedSubmissions.map(s => s.score || 0);
        const averageScore = scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : 0;

        const missingAssignments = assignments.length - studentSubmissions.length;

        // Simple trend detection
        let trend: 'declining' | 'stable' | 'improving' = 'stable';
        if (scores.length >= 2) {
            const recent = scores.slice(-2);
            if (recent[1] < recent[0] - 1) trend = 'declining';
            else if (recent[1] > recent[0] + 1) trend = 'improving';
        }

        // Criteria for "At Risk": Avg < 5.0 OR Missing > 3 assignments OR Declining trend with Avg < 6.5
        if (averageScore < 5.0 || missingAssignments > 3 || (trend === 'declining' && averageScore < 6.5)) {
            atRisk.push({
                studentId: student.id,
                studentName: student.name,
                averageScore,
                missingAssignments,
                trend
            });
        }
    });

    return atRisk.sort((a, b) => a.averageScore - b.averageScore);
};

/**
 * Identify common mistakes (Mock implementation)
 * In a real app, this would analyze question-level data or teacher tags
 */
export const identifyCommonMistakes = (topic: string): string[] => {
    const mistakes: Record<string, string[]> = {
        'Toán': [
            'Nhầm lẫn dấu khi chuyển vế',
            'Quên điều kiện xác định của phương trình',
            'Tính sai đạo hàm của hàm hợp',
            'Chưa xét hết các trường hợp của tham số m'
        ],
        'Lý': [
            'Đổi đơn vị không nhất quán',
            'Nhầm lẫn giữa vận tốc và gia tốc',
            'Vẽ sai chiều lực ma sát',
            'Áp dụng sai công thức định luật II Newton'
        ],
        'Hóa': [
            'Cân bằng phương trình sai hệ số',
            'Quên tính chất lưỡng tính của Al(OH)3',
            'Nhầm lẫn hóa trị của Fe trong các hợp chất',
            'Tính sai hiệu suất phản ứng'
        ]
    };

    return mistakes[topic] || [
        'Đọc không kỹ đề bài',
        'Trình bày chưa logic',
        'Thiếu kết luận cuối cùng'
    ];
};

// ==========================================
// ENHANCED TEACHER ANALYTICS (Iteration 3)
// ==========================================

import { User } from '@/types';

/**
 * Lấy pattern kiến thức (knowledge gaps) từ errorAnalysis
 */
export interface KnowledgeGapItem {
    category: string;
    errorRate: number;
    severity: 'low' | 'medium' | 'high';
    studentCount: number;
}

export const getKnowledgeGaps = (
    submissions: Submission[],
    classStudentIds: string[]
): KnowledgeGapItem[] => {
    const classSubmissions = submissions.filter(s =>
        classStudentIds.includes(s.studentId) &&
        s.status === 'graded' &&
        s.errorAnalysis?.categories
    );

    if (classSubmissions.length === 0) return [];

    const errorSum = { understanding: 0, calculation: 0, presentation: 0, logic: 0 };

    classSubmissions.forEach(s => {
        if (s.errorAnalysis?.categories) {
            errorSum.understanding += s.errorAnalysis.categories.understanding || 0;
            errorSum.calculation += s.errorAnalysis.categories.calculation || 0;
            errorSum.presentation += s.errorAnalysis.categories.presentation || 0;
            errorSum.logic += s.errorAnalysis.categories.logic || 0;
        }
    });

    const categoryNames: { [key: string]: string } = {
        understanding: "Hiểu bài",
        calculation: "Tính toán",
        presentation: "Trình bày",
        logic: "Lập luận"
    };

    return Object.entries(errorSum).map(([key, total]) => {
        const errorRate = Math.round(total / classSubmissions.length);
        const severity: 'low' | 'medium' | 'high' = errorRate >= 60 ? 'high' : errorRate >= 30 ? 'medium' : 'low';
        return {
            category: categoryNames[key],
            errorRate,
            severity,
            studentCount: classSubmissions.length
        };
    }).sort((a, b) => b.errorRate - a.errorRate);
};

/**
 * Phân tích học sinh có nguy cơ với lý do chi tiết
 */
export interface EnhancedAtRiskStudent {
    studentId: string;
    studentName: string;
    riskLevel: 'low' | 'medium' | 'high';
    reasons: string[];
    suggestions: string[];
    averageScore: number;
}

export const getEnhancedAtRiskStudents = (
    users: User[],
    submissions: Submission[],
    classStudentIds: string[]
): EnhancedAtRiskStudent[] => {
    const classStudents = users.filter(u => classStudentIds.includes(u.id) && u.role === 'student');
    const atRiskList: EnhancedAtRiskStudent[] = [];

    classStudents.forEach(student => {
        const studentSubs = submissions.filter(s => s.studentId === student.id && s.status === 'graded');
        const reasons: string[] = [];
        let riskScore = 0;

        // Calculate average
        const avgScore = studentSubs.length > 0
            ? studentSubs.reduce((sum, s) => sum + (s.score || 0), 0) / studentSubs.length
            : 0;

        // Check 1: Low scores
        if (avgScore < 50 && studentSubs.length >= 2) {
            reasons.push(`Điểm TB rất thấp: ${Math.round(avgScore)}/100`);
            riskScore += 3;
        } else if (avgScore < 70 && studentSubs.length >= 2) {
            reasons.push(`Điểm TB yếu: ${Math.round(avgScore)}/100`);
            riskScore += 2;
        }

        // Check 2: Declining trend
        if (studentSubs.length >= 3) {
            const last3 = studentSubs.slice(-3).map(s => s.score || 0);
            if (last3[0] > last3[1] && last3[1] > last3[2]) {
                reasons.push("Điểm giảm dần 3 bài gần nhất");
                riskScore += 2;
            }
        }

        // Check 3: Low participation
        if (studentSubs.length < 2) {
            reasons.push("Ít tham gia làm bài");
            riskScore += 2;
        }

        // Check 4: Streak broken
        if (studentSubs.length > 0 && (student.streak || 0) === 0) {
            reasons.push("Không có streak");
            riskScore += 1;
        }

        if (reasons.length > 0) {
            const riskLevel: 'low' | 'medium' | 'high' =
                riskScore >= 5 ? 'high' : riskScore >= 3 ? 'medium' : 'low';

            const suggestions: string[] = [];
            if (avgScore < 60) {
                suggestions.push("Trao đổi riêng để tìm nguyên nhân");
                suggestions.push("Cung cấp tài liệu bổ trợ");
            }
            if (studentSubs.length < 2) {
                suggestions.push("Gửi email nhắc nhở");
                suggestions.push("Liên hệ phụ huynh");
            }
            if (riskLevel === 'high') {
                suggestions.push("⚠️ CẦN CAN THIỆP NGAY");
            }

            atRiskList.push({
                studentId: student.id,
                studentName: student.name,
                riskLevel,
                reasons,
                suggestions,
                averageScore: avgScore
            });
        }
    });

    return atRiskList.sort((a, b) => {
        const levelOrder = { high: 0, medium: 1, low: 2 };
        return levelOrder[a.riskLevel] - levelOrder[b.riskLevel];
    });
};

/**
 * Lấy thống kê tổng quan lớp học
 */
export interface ClassOverviewStats {
    totalStudents: number;
    averageScore: number;
    completionRate: number;
    atRiskCount: number;
    topPerformer: { name: string; score: number } | null;
}

export const getClassOverviewStats = (
    users: User[],
    submissions: Submission[],
    assignments: Assignment[],
    classStudentIds: string[]
): ClassOverviewStats => {
    const classStudents = users.filter(u => classStudentIds.includes(u.id));
    const totalStudents = classStudents.length;

    if (totalStudents === 0) {
        return {
            totalStudents: 0,
            averageScore: 0,
            completionRate: 0,
            atRiskCount: 0,
            topPerformer: null
        };
    }

    // Average score
    const gradedSubs = submissions.filter(s =>
        classStudentIds.includes(s.studentId) &&
        s.status === 'graded'
    );
    const avgScore = gradedSubs.length > 0
        ? gradedSubs.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubs.length
        : 0;

    // Completion rate
    const totalExpected = totalStudents * assignments.length;
    const totalSubmitted = submissions.filter(s => classStudentIds.includes(s.studentId)).length;
    const completionRate = totalExpected > 0 ? (totalSubmitted / totalExpected) * 100 : 0;

    // At-risk count
    const atRisk = getEnhancedAtRiskStudents(users, submissions, classStudentIds);

    // Top performer
    const studentScores = classStudents.map(student => {
        const subs = gradedSubs.filter(s => s.studentId === student.id);
        const avg = subs.length > 0
            ? subs.reduce((sum, s) => sum + (s.score || 0), 0) / subs.length
            : 0;
        return { name: student.name, score: avg };
    }).filter(s => s.score > 0);

    const topPerformer = studentScores.length > 0
        ? studentScores.sort((a, b) => b.score - a.score)[0]
        : null;

    return {
        totalStudents,
        averageScore: Math.round(avgScore * 10) / 10,
        completionRate: Math.round(completionRate),
        atRiskCount: atRisk.length,
        topPerformer
    };
};
