import { generateQuizAction, getHintAction, analyzeSubmissionAction } from "../actions/ai-actions";

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number; // Index 0-3
    explanation?: string;
}

export interface AIQuizRequest {
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    questionCount: number;
}

export const AIService = {
    generateQuiz: async (request: AIQuizRequest): Promise<QuizQuestion[]> => {
        try {
            return await generateQuizAction(request);
        } catch (error) {
            console.error("AI Service Quiz Error:", error);
            return getMockData(request);
        }
    },

    getHint: async (question: string, context: string): Promise<string> => {
        try {
            return await getHintAction(question, context);
        } catch (error) {
            console.error("AI Service Hint Error:", error);
            return "Không thể tạo gợi ý lúc này.";
        }
    },

    // AI Grader: Analyze submission and suggest score
    analyzeSubmission: async (assignmentDescription: string, submissionContent: string): Promise<{ score: number, feedback: string, errorAnalysis?: any }> => { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            return await analyzeSubmissionAction(assignmentDescription, submissionContent);
        } catch (error) {
            console.error("AI Grader Error:", error);
            return { score: 0, feedback: "Lỗi kết nối với AI Grader.", errorAnalysis: undefined };
        }
    },
};

// Fallback Mock Data Function
const getMockData = async (request: AIQuizRequest): Promise<QuizQuestion[]> => {
    // Simulate AI "thinking" time
    await new Promise(resolve => setTimeout(resolve, 1500));

    const topicLower = request.topic.toLowerCase();

    if (topicLower.includes('toán') || topicLower.includes('math') || topicLower.includes('đạo hàm')) {
        return [
            {
                id: 'q1',
                question: 'Đạo hàm của hàm số y = x^2 là gì?',
                options: ['2x', 'x', '2', 'x^2'],
                correctAnswer: 0,
                explanation: 'Áp dụng công thức (x^n)\' = n*x^(n-1)'
            },
            {
                id: 'q2',
                question: 'Hệ số góc của tiếp tuyến tại điểm x=1 của y=x^3 là?',
                options: ['1', '2', '3', '4'],
                correctAnswer: 2,
                explanation: 'y\' = 3x^2. Tại x=1, y\'(1) = 3*1^2 = 3'
            },
            {
                id: 'q3',
                question: 'Hàm số nào sau đây đồng biến trên R?',
                options: ['y = x^2', 'y = x^3 + x', 'y = 1/x', 'y = -x + 1'],
                correctAnswer: 1,
                explanation: 'y\' = 3x^2 + 1 > 0 với mọi x thuộc R'
            }
        ].slice(0, request.questionCount);
    }

    if (topicLower.includes('lịch sử') || topicLower.includes('history')) {
        return [
            {
                id: 'q1',
                question: 'Chiến tranh thế giới thứ hai bắt đầu vào năm nào?',
                options: ['1939', '1941', '1945', '1914'],
                correctAnswer: 0
            },
            {
                id: 'q2',
                question: 'Phe Trục bao gồm những nước nào?',
                options: ['Anh, Pháp, Mỹ', 'Đức, Ý, Nhật', 'Đức, Nga, Mỹ', 'Nhật, Trung Quốc, Hàn Quốc'],
                correctAnswer: 1
            }
        ].slice(0, request.questionCount);
    }

    // Generic Fallback
    return Array.from({ length: request.questionCount }).map((_, i) => ({
        id: `q${i}`,
        question: `Câu hỏi về ${request.topic} (Mock Data)?`,
        options: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
        correctAnswer: 0,
        explanation: 'Vui lòng cung cấp API Key để sử dụng AI thật.'
    }));
};
