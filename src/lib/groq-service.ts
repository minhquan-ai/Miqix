import Groq from "groq-sdk";

const getGroqClient = () => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("GROQ_API_KEY is not defined in environment variables");
    }
    return new Groq({ apiKey });
};

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export const GroqService = {
    async generateText(prompt: string, systemPrompt?: string): Promise<string> {
        try {
            const groq = getGroqClient();
            const completion = await groq.chat.completions.create({
                messages: [
                    ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
                    { role: "user" as const, content: prompt }
                ],
                model: DEFAULT_MODEL,
                temperature: 0.7,
                max_tokens: 2048,
            });
            return completion.choices[0]?.message?.content || "";
        } catch (error) {
            console.error("[GroqService] Error generating text:", error);
            throw error;
        }
    },

    async analyzeClassPerformance(data: any) {
        const systemPrompt = "Bạn là trợ lý AI cho giáo viên. Phân tích dữ liệu lớp học và trả về JSON.";
        const prompt = `
Lớp: ${data.className}
Điểm trung bình: ${data.averageScore}/10
Tỉ lệ nộp bài: ${data.submissionRate}%
Học sinh cần chú ý: ${data.atRiskStudents}
Bài tập gần đây: ${data.recentAssignments.map((a: any) => `- ${a.title}: ${a.avgScore}/10`).join('\n')}

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
