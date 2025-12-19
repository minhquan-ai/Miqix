import { GoogleGenerativeAI } from "@google/generative-ai";

// Lazy init để đọc env var at runtime
function getGenAI() {
    return new GoogleGenerativeAI(process.env.AIzaSyDE5Na2Yowpjeug3Du6gbrxaMgTjpj07V0 || '');
}

export interface GradingResult {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    detailedAnalysis?: string;
}

/**
 * Grade student submission using Gemini 2.0 Flash
 */
export async function gradeWithGemini(
    question: string,
    studentAnswer: string,
    rubric?: string,
    maxScore: number = 10
): Promise<GradingResult> {
    try {
        const model = getGenAI().getGenerativeModel({
            model: "gemini-2.0-flash" // Stable Gemini 2.0 (mới nhất, mạnh nhất)
        });

        const prompt = `
Bạn là giáo viên Việt Nam có kinh nghiệm, đang chấm bài của học sinh.

**Câu hỏi:**
${question}

**Đáp án của học sinh:**
${studentAnswer}

${rubric ? `**Rubric/Tiêu chí chấm:**\n${rubric}` : ''}

**Nhiệm vụ:**
1. Đánh giá đáp án dựa trên độ chính xác, mức độ hiểu biết, và cách trình bày
2. Cho điểm từ 0-${maxScore}
3. Đưa ra feedback chi tiết, mang tính xây dựng
4. Chỉ ra điểm mạnh (ít nhất 2 điểm)
5. Gợi ý cải thiện (ít nhất 2 điểm)

**Trả về JSON theo format sau (KHÔNG thêm markdown, chỉ JSON thuần):**
{
    "score": <số từ 0-${maxScore}>,
    "feedback": "<phản hồi tổng quan 2-3 câu>",
    "strengths": ["<điểm mạnh 1>", "<điểm mạnh 2>"],
    "improvements": ["<gợi ý 1>", "<gợi ý 2>"],
    "detailedAnalysis": "<phân tích chi tiết từng phần của câu trả lời>"
}
`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse JSON response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Invalid response format from AI');
        }

        const gradingResult: GradingResult = JSON.parse(jsonMatch[0]);

        // Validate score range
        gradingResult.score = Math.max(0, Math.min(maxScore, gradingResult.score));

        return gradingResult;

    } catch (error) {
        console.error('Gemini API Error:', error);

        // Fallback to mock result on error
        return {
            score: Math.floor(Math.random() * 40) + 60,
            feedback: 'Không thể kết nối AI lúc này. Đây là đánh giá tự động tạm thời.',
            strengths: [
                'Học sinh đã cố gắng trả lời câu hỏi',
                'Có sử dụng một số thuật ngữ liên quan'
            ],
            improvements: [
                'Cần giải thích rõ ràng và chi tiết hơn',
                'Nên bổ sung thêm ví dụ minh họa'
            ],
            detailedAnalysis: 'Hệ thống AI tạm thời không khả dụng. Vui lòng thử lại sau.'
        };
    }
}

/**
 * Generate assignment questions based on topic
 */
export async function generateQuestionsWithGemini(
    topic: string,
    gradeLevel: string,
    numberOfQuestions: number = 5,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<Array<{ question: string; rubric: string; maxScore: number }>> {
    try {
        const model = getGenAI().getGenerativeModel({
            model: "gemini-2.0-flash" // Stable Gemini 2.0
        });

        const difficultyMap = {
            easy: 'dễ, phù hợp ôn tập',
            medium: 'trung bình, phù hợp kiểm tra',
            hard: 'khó, phù hợp thi học kỳ'
        };

        const prompt = `
Bạn là giáo viên Việt Nam, đang soạn đề kiểm tra.

**Chủ đề:** ${topic}
**Lớp:** ${gradeLevel}
**Độ khó:** ${difficultyMap[difficulty]}
**Số câu hỏi:** ${numberOfQuestions}

**Yêu cầu:**
Tạo ${numberOfQuestions} câu hỏi tự luận cho học sinh lớp ${gradeLevel} về chủ đề "${topic}".
Mỗi câu hỏi cần:
- Rõ ràng, phù hợp trình độ
- Có rubric chấm điểm chi tiết
- Điểm tối đa hợp lý (10-100)

**Trả về JSON (KHÔNG thêm markdown):**
{
    "questions": [
        {
            "question": "<câu hỏi>",
            "rubric": "<tiêu chí chấm điểm>",
            "maxScore": <điểm tối đa>
        }
    ]
}
`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Invalid response format');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.questions || [];

    } catch (error) {
        console.error('Question Generation Error:', error);

        // Fallback mock questions
        return Array(numberOfQuestions).fill(null).map((_, i) => ({
            question: `Câu ${i + 1}: Hãy trình bày hiểu biết của em về chủ đề "${topic}"`,
            rubric: 'Đánh giá dựa trên: độ chính xác (40%), mức độ hiểu biết (40%), cách trình bày (20%)',
            maxScore: 100
        }));
    }
}
