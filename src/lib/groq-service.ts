import Groq from "groq-sdk";

const getGroqClient = () => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("GROQ_API_KEY is not defined in environment variables");
    }
    return new Groq({ apiKey });
};

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const OPENROUTER_MODEL = "xiaomi/mimo-v2-flash:free";

export const GroqService = {
    async generateText(prompt: string, systemPrompt?: string): Promise<string> {
        try {
            // Priority: OpenRouter (Temporary)
            const openRouterKey = process.env.OPENROUTER_API_KEY;
            if (openRouterKey) {
                console.log("[AIService] Using OpenRouter with model:", OPENROUTER_MODEL);
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${openRouterKey}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://ergonix.vn", // Optional for OpenRouter
                        "X-Title": "Ergonix Assistant"
                    },
                    body: JSON.stringify({
                        model: OPENROUTER_MODEL,
                        messages: [
                            { role: "system", content: systemPrompt || "Bạn là Ergonix AI." },
                            { role: "user", content: prompt }
                        ],
                        temperature: 0.7,
                        max_tokens: 2048,
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`OpenRouter API error: ${JSON.stringify(errorData)}`);
                }

                const data = await response.json();
                return data.choices[0]?.message?.content || "";
            }

            // Fallback to Groq
            const groq = getGroqClient();
            const finalSystemPrompt = systemPrompt || `Bạn là Ergonix AI - trợ lý học thuật thông minh cho nền tảng giáo dục Ergonix tại Việt Nam. 
            Nhiệm vụ: Hỗ trợ giáo viên quản lý lớp học và trợ giúp học sinh học tập bằng phương pháp Socratic (dẫn dắt, gợi mở, không đưa đáp án ngay). 
            Phong cách: Thân thiện, chuyên nghiệp, ngôn ngữ tiếng Việt tự nhiên.`;

            const completion = await groq.chat.completions.create({
                messages: [
                    { role: "system" as const, content: finalSystemPrompt },
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
