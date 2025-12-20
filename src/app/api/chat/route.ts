import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize Groq Client
// Note: SDK automatically searches for GROQ_API_KEY in process.env
// Initialize Groq Client
// Note: SDK automatically searches for GROQ_API_KEY in process.env

// Update to active model (Llama 3.3 70B Versatile is the current standard)
// Update to active model as requested
const MODEL_ID = "llama-3.3-70b-versatile";

export async function POST(request: Request) {
    try {
        // 1. Validate API Key Existence
        if (!process.env.GROQ_API_KEY) {
            console.error("Missing GROQ_API_KEY environment variable.");
            return NextResponse.json(
                { error: "Server Configuration Error: Missing API Key" },
                { status: 500 }
            );
        }

        // 2. Parse & Validate Request Body
        const body = await request.json().catch(() => null);

        if (!body || typeof body.message !== 'string' || !body.message.trim()) {
            return NextResponse.json(
                { error: "Invalid input: 'message' field is required and must be a non-empty string." },
                { status: 400 }
            );
        }

        const { message } = body;

        // 3. Call Groq API
        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Bạn là Ergonix AI - trợ lý học thuật chuyên sâu được tích hợp trong nền tảng giáo dục Ergonix.

BỐI CẢNH ỨNG DỤNG:
- Ergonix là nền tảng quản lý học tập hiện đại cho giáo viên và học sinh Việt Nam.
- Các tính năng chính: Lớp học (Classes), Bài tập (Assignments/Missions), Lịch biểu (Schedule), Phân tích học tập (Analytics), và Chấm bài tự động.
- Phương châm: Tối ưu hóa thời gian cho giáo viên và khuyến khích tư duy chủ động cho học sinh.

TRIẾT LÝ HỖ TRỢ (SOCRATIC METHOD):
- Đối với bài tập: KHÔNG bao giờ đưa ra đáp án trực tiếp ngay lập tức.
- Hãy dẫn dắt bằng cách đặt câu hỏi gợi mở, nhắc lại kiến thức nền tảng, hoặc đưa ra các gợi ý (hints) nhỏ để người dùng tự khám phá ra câu trả lời.
- Khuyến khích sự tò mò và tư duy phản biện.

PHONG CÁCH GIAO TIẾP & ĐỊNH DẠNG:
- Ngôn ngữ: Tiếng Việt tự nhiên, chuyên nghiệp nhưng thân thiện.
- Trình bày giàu thẩm mỹ (Rich Aesthetics):
    + Sử dụng **Bold** cho các thông tin quan trọng (tên lớp, môn học, thời gian).
    + Sử dụng dấu gạch đầu dòng (-) hoặc chấm tròn (•) cho danh sách.
    + Sử dụng đường kẻ phân cách (---) để tách biệt các ý lớn.
    + Sử dụng các biểu tượng biểu cảm (emojis) phù hợp (📐, 📅, ✨, 🚀) để giao diện sinh động.
- Trả lời có cấu trúc, bố cục thoáng đãng, dễ đọc trên thiết bị di động.

Nếu người dùng hỏi về các tính năng của app, hãy giải thích dựa trên các module (Lớp học, Nhiệm vụ, Lịch biểu).`
                },
                {
                    role: "user",
                    content: message
                }
            ],
            model: MODEL_ID,
            temperature: 0.7,
            max_tokens: 2048, // Adjusted for typical chat feature needs
        });

        // 4. Extract Reply
        const reply = completion.choices[0]?.message?.content || "";

        if (!reply) {
            throw new Error("Empty response from AI Provider");
        }

        // 5. Return Success Response
        return NextResponse.json({ reply });

    } catch (error: any) {
        console.error("[Groq API Error]:", error);

        // Handle specific Groq errors if possible, otherwise generic 500
        if (error?.status === 429) {
            return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
        }

        if (error?.status === 401) {
            return NextResponse.json({ error: "Unauthorized. Invalid API Key." }, { status: 401 });
        }

        return NextResponse.json(
            { error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
