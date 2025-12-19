'use server';

import { GroqService } from '@/lib/groq-service';

/**
 * Server Actions for AI features using Groq
 */

export async function analyzeClassPerformanceAction(data: {
    className: string;
    averageScore: number;
    submissionRate: number;
    atRiskStudents: number;
    recentAssignments: Array<{ title: string; avgScore: number }>;
}) {
    try {
        return await GroqService.analyzeClassPerformance(data);
    } catch (error) {
        console.error('[AI Action] Error analyzing class:', error);
        return {
            insights: [],
            recommendations: [],
            alerts: ['Không thể kết nối với AI lúc này']
        };
    }
}

export async function tutorStudentAction(params: {
    question: string;
    topic: string;
    studentMessage: string;
    conversationHistory?: Array<{ role: string; parts: string }>;
}) {
    try {
        const prompt = `Câu hỏi: ${params.question}\nChủ đề: ${params.topic}\nHọc sinh: ${params.studentMessage}`;
        const systemPrompt = "Bạn là gia sư AI sử dụng phương pháp Socratic. KHÔNG bao giờ cho đáp án trực tiếp. Dẫn dắt học sinh tự suy nghĩ.";
        return await GroqService.generateText(prompt, systemPrompt);
    } catch (error) {
        console.error('[AI Action] Error tutoring:', error);
        return 'Xin lỗi, AI Tutor đang bận. Vui lòng thử lại sau.';
    }
}

export async function predictStudentPerformanceAction(params: {
    studentName: string;
    currentAvg: number;
    submissionRate: number;
    attendanceRate: number;
    recentScores: number[];
}) {
    try {
        const prompt = `Phân tích: ${params.studentName}, Điểm TB: ${params.currentAvg}, Nộp bài: ${params.submissionRate}%. Trả về JSON: { predictedFinalScore, confidence, riskLevel: 'low'|'medium'|'high', recommendations: [] }`;
        const res = await GroqService.generateText(prompt, "Bạn là chuyên gia phân tích giáo dục. Trả về JSON.");
        return JSON.parse(res.replace(/```json\n?|\n?```/g, '').trim());
    } catch (error) {
        console.error('[AI Action] Error predicting performance:', error);
        return {
            predictedFinalScore: params.currentAvg,
            confidence: 0,
            riskLevel: 'medium' as const,
            recommendations: ['Không thể dự đoán lúc này']
        };
    }
}

export async function refineAssignmentAction(text: string) {
    try {
        return await GroqService.refineAssignmentDescription(text);
    } catch (error) {
        console.error('[AI Action] Error refining assignment:', error);
        return text;
    }
}

export async function generateQuizAction(params: { topic: string, difficulty: string, questionCount: number }) {
    try {
        return await GroqService.generateQuiz(params);
    } catch (error) {
        console.error('[AI Action] Error generating quiz:', error);
        throw error;
    }
}

export async function getHintAction(question: string, context: string) {
    try {
        const prompt = `Câu hỏi: ${question}\nBối cảnh: ${context}`;
        const systemPrompt = "Bạn là gia sư AI Socratic. Hãy đưa ra gợi ý gợi mở, không đưa đáp án.";
        return await GroqService.generateText(prompt, systemPrompt);
    } catch (error) {
        console.error('[AI Action] Error getting hint:', error);
        return "Không thể tạo gợi ý lúc này.";
    }
}

export async function analyzeSubmissionAction(assignmentDescription: string, submissionContent: string) {
    try {
        const prompt = `Phân tích bài làm:
Mô tả bài tập: "${assignmentDescription}"
Bài làm của học sinh: "${submissionContent}"`;
        const systemPrompt = "Bạn là giáo viên nghiêm khắc nhưng công bằng. Phân tích bài làm và trả về JSON: { score, feedback, errorAnalysis: { categories: { understanding, calculation, presentation, logic }, mainIssues: [], suggestions: [] } }";
        const response = await GroqService.generateText(prompt, systemPrompt);
        return JSON.parse(response.replace(/```json\n?|\n?```/g, '').trim());
    } catch (error) {
        console.error('[AI Action] Error analyzing submission:', error);
        throw error;
    }
}

