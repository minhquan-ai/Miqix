import { NextResponse } from 'next/server';
import { getAssignmentByIdAction } from '@/lib/actions';

const PAYLOAD_INSTRUCTIONS = `
[QUAN TRỌNG: CẤU TRÚC PAYLOAD ĐẶC BIỆT CHO CANVAS]
Để hiển thị giao diện tương tác đẹp mắt trên Canvas, hãy sử dụng cú pháp đặc biệt sau:

1. CHO FLASHCARDS (Khi người dùng hỏi tạo flashcard, ôn tập):
Bắt đầu bằng dòng ":::payload" và kết thúc bằng ":::", với JSON ở giữa:
:::payload
{"type":"flashcards","data":[{"front":"Câu hỏi 1","back":"Đáp án 1"},{"front":"Câu hỏi 2","back":"Đáp án 2"}]}
:::

2. CHO NỘI DUNG CẤU TRÚC (Giáo án, Kế hoạch, Bài viết):
:::payload
{"type":"structured_content","title":"Tên tài liệu","sections":[{"heading":"Mục 1","content":"Nội dung..."}]}
:::

3. CHO CÁC LỰA CHỌN (Drafts, Options):
:::payload
{"type":"options","data":[{"title":"Phương án 1","content":"..."},{"title":"Phương án 2","content":"..."}]}
:::

Nếu không thuộc các trường hợp trên, hãy trả lời bằng Markdown bình thường.
`;

export async function POST(request: Request) {
    try {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Missing OpenRouter API Key" }, { status: 500 });
        }

        const body = await request.json();
        const { message, mode, previousMessages = [], context, includeReasoning, targetAssignmentId, userRole } = body;
        const isTeacher = userRole === 'teacher';

        // 1. Fetch Detailed Assignment Context if targeted
        let targetedAssignmentContext = "";
        if (targetAssignmentId) {
            const assignment = await getAssignmentByIdAction(targetAssignmentId);
            if (assignment) {
                targetedAssignmentContext = [
                    "BỐI CẢNH BÀI TẬP MỤC TIÊU:",
                    "- Tiêu đề: " + assignment.title,
                    "- Mô tả: " + assignment.description,
                    "- Tiêu chí chấm điểm (Rubric): " + JSON.stringify(assignment.rubric),
                    "- Điểm tối đa: " + assignment.maxScore,
                    "",
                    "Hãy tập trung trả lời dựa trên bài tập này."
                ].join("\n");
            }
        }

        // 2. Build General Context
        let generalContext = "";
        if (context) {
            const userTypeLabel = isTeacher ? 'GIÁO VIÊN' : 'HỌC SINH';
            const assignmentsList = context.assignments ? context.assignments.join(", ") : "Không có";
            const eventsList = context.eventsToday ? context.eventsToday.join(", ") : "Trống";
            const analyticsInfo = isTeacher
                ? "Cần chấm " + (context.analytics?.ungradedCount || 0) + ", ĐTB lớp " + (context.analytics?.averageScore || "N/A")
                : "Điểm " + (context.analytics?.averageScore || "N/A") + ", Chuyên cần " + (context.analytics?.attendance || "N/A") + "%";

            generalContext = [
                "THÔNG TIN HỆ THỐNG (" + userTypeLabel + "):",
                "- Các bài tập: " + assignmentsList,
                "- Lịch trình: " + eventsList,
                "- Analytics: " + analyticsInfo
            ].join("\n");
        }

        // 3. Build role-specific instructions
        const roleInstructions = isTeacher
            ? [
                "VAI TRÒ GIÁO VIÊN:",
                "- Chế độ PLANNER: Hỗ trợ soạn giáo án, tạo đề thi, gợi ý hoạt động giảng dạy.",
                "- Chế độ GRADER: Phân tích bài làm của học sinh, gợi ý nhận xét và điểm số dựa trên rubric.",
                "- Chế độ ANALYSIS: Phân tích dữ liệu lớp học, tìm ra học sinh yếu hoặc xu hướng học tập.",
                "- Chế độ SUMMARY: Tóm tắt nội dung tiết dạy hoặc các tài liệu chuyên môn."
            ].join("\n")
            : [
                "VAI TRÒ HỌC SINH:",
                "- Chế độ SOLVER: Áp dụng phương pháp Socratic, gợi mở hướng giải thay vì cho đáp án.",
                "- Chế độ SUMMARY: Tập trung vào các ý chính, ngắn gọn.",
                "- Chế độ EXAM: Giả lập câu hỏi ôn tập, chỉ ra lỗ hổng kiến thức.",
                "- Chế độ WRITING: Chú trọng vào ngôn từ, diễn đạt, sáng tạo."
            ].join("\n");

        // 4. Combine system prompt
        const assistantType = isTeacher ? 'giảng dạy và quản lý lớp học' : 'học thuật';
        const currentMode = (mode?.toUpperCase() || "STANDARD");

        const systemPromptParts = [
            "Bạn là Miqix AI, trợ lý " + assistantType + " thông minh.",
            "Sử dụng Tiếng Việt. Phong cách: chuyên nghiệp, gần gũi, Markdown hóa (Bảng, Danh sách, Đậm).",
            "",
            targetedAssignmentContext,
            generalContext,
            "",
            roleInstructions,
            "",
            "CHẾ ĐỘ TRỢ LÝ HIỆN TẠI: " + currentMode,
            "",
            PAYLOAD_INSTRUCTIONS
        ];

        const systemPrompt = systemPromptParts.filter(Boolean).join("\n");

        const messages = [
            { role: "system", content: systemPrompt },
            ...previousMessages,
            { role: "user", content: message }
        ];

        // 5. Call OpenRouter
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + apiKey,
                "HTTP-Referer": "https://miqix.edu.vn",
                "X-Title": "Miqix Learning",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "xiaomi/mimo-v2-flash:free",
                messages,
                include_reasoning: includeReasoning,
                temperature: 0.7,
                max_tokens: 4096,
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || "OpenRouter API Error");
        }

        const choice = data.choices[0];
        let responseText = choice.message.content;

        // Handle reasoning (thinking) if present
        if (choice.message.reasoning) {
            responseText = "> [!NOTE]\n> **Quá trình tư duy:**\n> " + choice.message.reasoning.replace(/\n/g, '\n> ') + "\n\n" + responseText;
        }

        return NextResponse.json({ reply: responseText });

    } catch (error: any) {
        console.error("[OpenRouter API Error]:", error);
        return NextResponse.json({
            error: "Lỗi kết nối Miqix AI (OpenRouter)",
            details: error.message
        }, { status: 500 });
    }
}
