import OpenAI from "openai";

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

// Initialize HuggingFace Router via OpenAI SDK
// Note: In production, you should use a backend API route to hide the key.
// For this demo, we use NEXT_PUBLIC_ variable.
const client = new OpenAI({
    baseURL: "https://router.huggingface.co/v1",
    apiKey: process.env.NEXT_PUBLIC_HF_TOKEN || "",
    dangerouslyAllowBrowser: true // Required for client-side usage
});

export const AIService = {
    generateQuiz: async (request: AIQuizRequest): Promise<QuizQuestion[]> => {
        const apiKey = process.env.NEXT_PUBLIC_HF_TOKEN;

        // Check if token is missing or is the placeholder value
        if (!apiKey || apiKey === "your_huggingface_token_here") {
            console.warn("Missing or invalid HuggingFace Token. Falling back to Mock Data.");
            console.info("💡 Để sử dụng AI thật, hãy cập nhật NEXT_PUBLIC_HF_TOKEN trong .env.local");
            return getMockData(request);
        }

        try {
            const prompt = `You are a helpful teacher assistant. Generate ${request.questionCount} multiple-choice questions about "${request.topic}" with difficulty "${request.difficulty}".
Output strictly in this JSON format:
[
  {
    "id": "unique_id",
    "question": "Question text",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "explanation": "Short explanation why this is correct"
  }
]
IMPORTANT: Return ONLY the JSON array. Do not include markdown formatting like \`\`\`json.
Language: Vietnamese.`;

            const completion = await client.chat.completions.create({
                model: "Qwen/Qwen2.5-7B-Instruct",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000,
            });

            const text = completion.choices[0]?.message?.content || "";

            // Clean up potential markdown formatting if the model ignores instructions
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

            const questions = JSON.parse(cleanText);
            return questions;

        } catch (error) {
            console.error("HuggingFace API Error:", error);
            // Fallback to mock data on error
            return getMockData(request);
        }
    },

    // AI Tutor: Socratic Method
    getHint: async (question: string, context: string): Promise<string> => {
        const apiKey = process.env.NEXT_PUBLIC_HF_TOKEN;
        if (!apiKey || apiKey === "your_huggingface_token_here") {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return "Gợi ý (Mock): Hãy thử chia nhỏ vấn đề ra thành các bước đơn giản hơn. Bạn đang vướng mắc ở đâu?";
        }

        try {
            const prompt = `
You are a helpful and encouraging tutor for a Vietnamese student.
The student is asking for a hint on this question: "${question}".
The student's current work/context is: "${context}".

IMPORTANT:
1. Do NOT give the answer directly.
2. Use the Socratic method: ask a guiding question or point to a relevant concept.
3. Be brief, encouraging, and use Vietnamese.
4. If the context is empty, ask them what they have tried so far.
            `;

            const completion = await client.chat.completions.create({
                model: "Qwen/Qwen2.5-7B-Instruct",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 150,
            });

            return completion.choices[0]?.message?.content || "Không thể tạo gợi ý lúc này.";
        } catch (error) {
            console.error("AI Tutor Error:", error);
            return "Xin lỗi, AI Tutor đang bận. Hãy thử lại sau.";
        }
    },

    // AI Grader: Analyze submission and suggest score
    analyzeSubmission: async (assignmentDescription: string, submissionContent: string): Promise<{ score: number, feedback: string, errorAnalysis?: any }> => {
        if (!process.env.NEXT_PUBLIC_HF_TOKEN || process.env.NEXT_PUBLIC_HF_TOKEN === "hf_placeholder") {
            console.log("Using mock AI Grader response");
            return {
                score: 85,
                feedback: "Bài làm khá tốt. Tuy nhiên, phần giải thích lý thuyết còn hơi sơ sài. Cần chú ý hơn đến các điều kiện biên.",
                errorAnalysis: {
                    categories: {
                        understanding: 30,
                        calculation: 25,
                        presentation: 15,
                        logic: 10
                    },
                    mainIssues: [
                        "Thiếu điều kiện xác định của phân thức",
                        "Lỗi tính toán ở bước 3"
                    ],
                    suggestions: [
                        "Ôn lại bài 'Điều kiện xác định của phân thức đại số'",
                        "Cẩn thận hơn khi nhân đơn thức",
                        "Trình bày rõ ràng từng bước giải",
                        "Kiểm tra lại kết quả trước khi nộp bài"
                    ]
                }
            };
        }

        const prompt = `
        You are a strict but constructive teacher grading a student's assignment.
        Assignment Description: "${assignmentDescription}"
        Student Submission: "${submissionContent}"

        Analyze the submission and provide a JSON response with the following structure:
        {
            "score": (number 0-100),
            "feedback": (string, general feedback in Vietnamese),
            "errorAnalysis": {
                "errors": [
                    {
                        "point": (string, short summary of the error),
                        "category": ("concept" | "calculation" | "presentation" | "other"),
                        "explanation": (string, detailed explanation of why it is wrong in Vietnamese),
                        "remedialAction": (string, what the student should review in Vietnamese)
                    }
                ],
                "generalComment": (string, summary comment in Vietnamese)
            }
        }
        
        Return ONLY the JSON. Do not add markdown formatting.
        `;

        try {
            const completion = await client.chat.completions.create({
                model: "Qwen/Qwen2.5-7B-Instruct",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.5,
                max_tokens: 1000,
            });

            const content = completion.choices[0]?.message?.content || "{}";
            // Clean up potential markdown code blocks
            const cleanContent = content.replace(/```json/g, "").replace(/```/g, "").trim();

            try {
                return JSON.parse(cleanContent);
            } catch (e) {
                console.error("Failed to parse AI response", e);
                return { score: 0, feedback: "Lỗi khi phân tích bài làm. Vui lòng thử lại.", errorAnalysis: undefined };
            }
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
