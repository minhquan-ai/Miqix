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
        const { message, mode, previousMessages = [], context, includeReasoning, targetAssignmentId, targetClassId, userRole, forceCanvas } = body;
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

        // 1b. Fetch Detailed Class Context if targeted
        let targetedClassContext = "";
        if (targetClassId) {
            const { getClassByIdAction, getClassAnalyticsDataAction } = await import("@/lib/actions");
            const classData = await getClassByIdAction(targetClassId);
            const analyticsData = await getClassAnalyticsDataAction(targetClassId);
            if (classData) {
                const studentCount = analyticsData?.students?.length || 0;
                const totalSubmissions = analyticsData?.assignments?.reduce((acc: number, a: any) => acc + (a.submissions?.length || 0), 0) || 0;
                const totalPossible = studentCount * (analyticsData?.assignments?.length || 1);
                const submissionRate = totalPossible > 0 ? (totalSubmissions / totalPossible * 100) : 0;

                targetedClassContext = [
                    "BỐI CẢNH LỚP HỌC MỤC TIÊU:",
                    "- Tên lớp: " + classData.name,
                    "- Môn học: " + (classData.subject || "N/A"),
                    "- Mô tả: " + (classData.description || "Không có mô tả"),
                    "- Số học sinh: " + studentCount,
                    "- Số bài tập: " + (analyticsData?.assignments?.length || 0),
                    "- Tỷ lệ nộp bài: " + submissionRate.toFixed(0) + "%",
                    "",
                    "Hãy tập trung phân tích và trả lời dựa trên lớp học này."
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

        // 3. Build role-specific instructions (Strict)
        const roleInstructions = isTeacher
            ? [
                "VAI TRÒ: GIÁO VIÊN (TEACHER)",
                "NHIỆM VỤ:",
                "- Hỗ trợ soạn giáo án, tạo đề thi, thiết kế hoạt động giảng dạy.",
                "- Phân tích dữ liệu học sinh, nhận xét bài làm.",
                "- Phong cách: Chuyên nghiệp, sư phạm, chi tiết, hướng dẫn đồng nghiệp.",
                "- CHÚ Ý: Bạn đang nói chuyện với giáo viên, KHÔNG PHẢI học sinh. Đừng giảng bài cho họ, hãy hỗ trợ công việc của họ."
            ].join("\n")
            : [
                "VAI TRÒ: HỌC SINH (STUDENT)",
                "NHIỆM VỤ:",
                "- Hỗ trợ giải bài tập (gợi mở, Socratic), tóm tắt kiến thức, ôn thi.",
                "- Phong cách: Thân thiện, khuyến khích, dễ hiểu, kiên nhẫn.",
                "- CHÚ Ý: Bạn là gia sư/người bạn đồng hành."
            ].join("\n");

        // 4. Combine system prompt
        const assistantType = isTeacher ? 'giảng dạy chuyên nghiệp' : 'học tập cá nhân';
        const currentMode = (mode?.toUpperCase() || "STANDARD");

        let canvasInstruction = "";
        if (forceCanvas) {
            canvasInstruction = `
            [CHẾ ĐỘ CANVAS MODE: BẬT (BẮT BUỘC)]
            1. Output của bạn PHẢI chứa block ':::payload' hợp lệ (structured_content hoặc flashcards).
            2. Nếu người dùng yêu cầu soạn bài/tài liệu: Dùng 'structured_content'.
            3. Nếu người dùng yêu cầu ôn tập: Dùng 'flashcards'.
            4. KHÔNG trả lời bằng text đơn thuần.
            `;
        }

        const systemPromptParts = [
            "Bạn là Miqix AI, trợ lý " + assistantType + " thông minh.",
            "Sử dụng Tiếng Việt. Hỗ trợ hiển thị công thức Toán học bằng LaTeX (dùng $ cho inline, $$ cho block).",
            "Phong cách: chuyên nghiệp, gần gũi, Markdown hóa (Bảng, Danh sách, Đậm).",
            "",
            targetedAssignmentContext,
            targetedClassContext,
            generalContext,
            "",
            roleInstructions,
            "",
            "CHẾ ĐỘ TRỢ LÝ HIỆN TẠI: " + currentMode,
            "",
            PAYLOAD_INSTRUCTIONS,
            "",
            canvasInstruction
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
        const responseText = choice.message.content;
        const reasoning = choice.message.reasoning || null;

        return NextResponse.json({
            reply: responseText,
            reasoning: reasoning
        });

    } catch (error: any) {
        console.error("[OpenRouter API Error]:", error);
        return NextResponse.json({
            error: "Lỗi kết nối Miqix AI (OpenRouter)",
            details: error.message
        }, { status: 500 });
    }
}
