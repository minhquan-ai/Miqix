export const AIService = {
    async generateText(prompt: string, systemPrompt?: string, options?: { reasoning?: boolean }): Promise<string> {
        // Xiaomi MiMo-V2-Flash - free model with reasoning capabilities
        const OPENROUTER_MODEL = "xiaomi/mimo-v2-flash:free";
        const openRouterKey = process.env.OPENROUTER_API_KEY;

        if (!openRouterKey) {
            console.error("OPENROUTER_API_KEY is missing via AIService");
            throw new Error("OPENROUTER_API_KEY is missing. Please add it to .env.local");
        }

        try {
            const useReasoning = options?.reasoning ?? false;
            console.log(`[AIService] Calling OpenRouter (Reasoning: ${useReasoning})`);

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${openRouterKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://ergonix.vn",
                    "X-Title": "Ergonix Assistant"
                },
                body: JSON.stringify({
                    model: OPENROUTER_MODEL,
                    messages: [
                        { role: "system", content: systemPrompt || "Bạn là Ergonix AI." },
                        { role: "user", content: prompt }
                    ],
                    // Toggle reasoning based on user choice
                    reasoning: { enabled: useReasoning },
                    temperature: useReasoning ? 0.8 : 0.7, // Higher temp often good for reasoning exploration
                    max_tokens: useReasoning ? 4096 : 2048, // More tokens for thinking
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenRouter API error: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || "";

        } catch (error) {
            console.error("[AIService] Error generating text:", error);
            throw error;
        }
    },

    async analyzeClassPerformance(data: { className: string, averageScore: number, submissionRate: number, atRiskStudents: string[] | number, recentAssignments: { title: string, avgScore: number }[] }) {
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
        const response = await this.generateText(prompt, systemPrompt);
        return JSON.parse(response.replace(/```json\n?|\n?```/g, '').trim());
    },

    async refineAssignmentDescription(text: string): Promise<string> {
        const systemPrompt = "Bạn là chuyên gia thiết kế bài giảng. Hãy cải thiện (polish) và làm cho nội dung bài tập trở nên chuyên nghiệp, rõ ràng và truyền cảm hứng hơn. Chỉ trả về nội dung đã cải thiện, KHÔNG giải thích thêm.";
        const prompt = `NỘI DUNG GỐC: "${text}"`;
        return await this.generateText(prompt, systemPrompt);
    },

    async generateQuiz(params: { topic: string, difficulty: string, questionCount: number }) {
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
        const response = await this.generateText(prompt, systemPrompt);
        return JSON.parse(response.replace(/```json\n?|\n?```/g, '').trim());
    }
};

// Export as GroqService for backward compatibility
export const GroqService = AIService;
