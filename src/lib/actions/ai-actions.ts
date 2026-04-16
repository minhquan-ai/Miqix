'use server';

import { AICore } from '@/lib/ai/core';

/**
 * Server Actions for AI features using Unified AICore
 */

export async function analyzeClassPerformanceAction(data: {
    className: string;
    averageScore: number;
    submissionRate: number;
    atRiskStudents: number;
    recentAssignments: Array<{ title: string; avgScore: number }>;
}) {
    try {
        const systemPrompt = "Bạn là trợ lý AI cho giáo viên. Phân tích dữ liệu lớp học và trả về JSON.";
        const prompt = `
Lớp: ${data.className}
Điểm trung bình: ${data.averageScore}/10
Tỉ lệ nộp bài: ${data.submissionRate}%
Học sinh cần chú ý: ${data.atRiskStudents}
Bài tập gần đây: ${data.recentAssignments.map((a: { title: string, avgScore: number }) => `- ${a.title}: ${a.avgScore}/10`).join('\n')}

Trả về JSON format:
{
  "insights": ["..."],
  "recommendations": ["..."],
  "alerts": ["..."]
}
`;
        const result = await AICore.generateJSON<any>(prompt, systemPrompt);
        return result || { insights: [], recommendations: [], alerts: ['Không thể phân tích dữ liệu'] };

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

        const response = await AICore.generateText(prompt, { systemPrompt });
        return response.text;
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
        const result = await AICore.generateJSON<any>(prompt, "Bạn là chuyên gia phân tích giáo dục. Trả về JSON.");
        return result || {
            predictedFinalScore: params.currentAvg,
            confidence: 0,
            riskLevel: 'medium',
            recommendations: ['Không thể dự đoán']
        };
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
        const systemPrompt = "Bạn là chuyên gia thiết kế bài giảng. Hãy cải thiện (polish) và làm cho nội dung bài tập trở nên chuyên nghiệp, rõ ràng và truyền cảm hứng hơn. Chỉ trả về nội dung đã cải thiện, KHÔNG giải thích thêm.";
        const prompt = `NỘI DUNG GỐC: "${text}"`;
        const response = await AICore.generateText(prompt, { systemPrompt });
        return response.text;
    } catch (error) {
        console.error('[AI Action] Error refining assignment:', error);
        return text;
    }
}

export async function generateQuizAction(params: { topic: string, difficulty: string, questionCount: number }) {
    try {
        const systemPrompt = `Bạn là giáo viên chuyên nghiệp. Tạo ${params.questionCount} câu hỏi trắc nghiệm về "${params.topic}" với độ khó "${params.difficulty}".`;
        const prompt = `
Trả về CHÍNH XÁC một mảng JSON các đối tượng:
[
  {
    "id": "chuỗi_id_duy_nhất",
    "question": "Câu hỏi?",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "explanation": "Giải thích ngắn gọn"
  }
]
`;
        const result = await AICore.generateJSON<any>(prompt, systemPrompt);
        return result || [];
    } catch (error) {
        console.error('[AI Action] Error generating quiz:', error);
        throw error;
    }
}

export async function getHintAction(question: string, context: string) {
    try {
        const prompt = `Câu hỏi: ${question}\nBối cảnh: ${context}`;
        const systemPrompt = "Bạn là gia sư AI Socratic. Hãy đưa ra gợi ý gợi mở, không đưa đáp án.";
        const response = await AICore.generateText(prompt, { systemPrompt });
        return response.text;
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

        const result = await AICore.generateJSON<any>(prompt, systemPrompt);
        return result;
    } catch (error) {
        console.error('[AI Action] Error analyzing submission:', error);
        throw error;
    }
}

