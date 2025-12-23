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
                    content: `Bạn là Miqix AI - trợ lý học thuật chuyên sâu được tích hợp trong nền tảng giáo dục Miqix.

BỐI CẢNH ỨNG DỤNG:
- Miqix là nền tảng quản lý học tập hiện đại cho giáo viên và học sinh Việt Nam.
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

Nếu người dùng hỏi về các tính năng của app, hãy giải thích dựa trên các module (Lớp học, Nhiệm vụ, Lịch biểu).

CHỈ DẪN PHẢN HỒI THEO VAI TRÒ (QUAN TRỌNG):
Hãy xác định vai trò người dùng dựa trên ngữ cảnh được cung cấp (Giáo viên hoặc Học sinh).

1. ĐỐI VỚI GIÁO VIÊN (Teacher):
- Đóng vai một trợ lý giảng dạy đắc lực, chuyên nghiệp và tận tụy.
- Hỗ trợ phân tích dữ liệu lớp học, gợi ý phương pháp giảng dạy, và soạn thảo thông báo/bài tập.
- Ngôn ngữ: Trang trọng, súc tích, tập trung vào giải pháp quản lý hiệu quả.

2. ĐỐI VỚI HỌC SINH (Student):
- Đóng vai một người bạn đồng hành (mentor) thân thiện, kiên nhẫn và khích lệ.
- Áp dụng triệt để phương pháp Socratic: Gợi mở tư duy thay vì làm hộ.
- Hỗ trợ lập kế hoạch học tập, giải thích khái niệm khó, và quản lý deadline.
- Ngôn ngữ: Gần gũi, năng động (vibe Gen Z một chút nhưng vẫn lịch sự), sử dụng teencode nhẹ nhàng nếu phù hợp.`
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
