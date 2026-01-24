import { NextResponse } from 'next/server';
import { getAssignmentByIdAction } from '@/lib/actions';
import { AICore } from '@/lib/ai/core';
import { AI_CONFIG } from '@/lib/ai/config';

const PAYLOAD_INSTRUCTIONS = `
[QUAN TRỌNG: GEMINI-STYLE SPLIT RESPONSE]
Khi trả lời các yêu cầu phức tạp (soạn bài, giải thích chi tiết, tài liệu), BẮT BUỘC chia response thành 2 phần:

:::chat:::
[Phần CHAT - Tóm tắt ngắn gọn, thân thiện]
- Bắt đầu bằng lời chào nếu phù hợp
- Tóm tắt ý chính (2-4 câu)
- Có thể kết thúc bằng lời động viên
- Thông báo nội dung đầy đủ có ở Canvas
:::end:::

:::canvas:::
[Phần CANVAS - Nội dung đầy đủ, KHÔNG lời chào]
- TUYỆT ĐỐI KHÔNG có lời chào hoặc lời động viên
- CHỈ chứa nội dung thuần túy
- Sử dụng cấu trúc rõ ràng: Tiêu đề, Mục, Bảng, Danh sách
- Format như tài liệu chuyên nghiệp (kiểu Google Docs)
:::end:::

VÍ DỤ:
:::chat:::
Chào bạn! Mình đã soạn xong bài nghị luận về tác phẩm "Lặng lẽ Sa Pa" rồi nhé. Bài viết gồm 3 phần: Mở bài, Thân bài và Kết luận. Xem chi tiết bên Canvas nhé! 📝
:::end:::
:::canvas:::
# Phân tích tác phẩm "Lặng lẽ Sa Pa"

## I. Mở bài
Nguyễn Thành Long là một trong những nhà văn...
...
:::end:::

[CÁC TRƯỜNG HỢP ĐẶC BIỆT - BẮT BUỘC DÙNG SPLIT]
- Soạn bài, giáo án, tài liệu
- Giải thích dài (> 200 từ)
- Tạo flashcard, quiz
- Phân tích văn bản

[NẾU CÂU HỎI ĐƠN GIẢN]
- Trả lời trực tiếp bằng Markdown thường
- Không cần split (ví dụ: "Xin chào", "1+1=?", "Hôm nay thứ mấy?")
`;


export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { message, mode, previousMessages = [], context, includeReasoning, targetAssignmentId, targetClassId, userRole, forceCanvas, socraticMode = false } = body;
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

        // 2. Build General Context (Enhanced with Deep Context)
        let generalContext = "";
        let deepContextInfo = "";

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

            // Process Deep Class Context from client
            if (context.selectedClassContext) {
                const cc = context.selectedClassContext;
                const scheduleStr = cc.schedule?.map((s: any) => `${s.day}: ${s.time} - ${s.subject}`).join("; ") || "Chưa có thời khóa biểu";
                const assignmentsStr = cc.assignments?.map((a: any) => `"${a.title}" (${a.subject}, ${a.status}, deadline: ${a.dueDate})`).join("; ") || "Chưa có bài tập";
                const announcementsStr = cc.announcements?.map((an: any) => `[${an.date}] ${an.title}`).join("; ") || "Chưa có thông báo";

                deepContextInfo += [
                    "",
                    "=== NGỮA CẢNH SÂU: LỚP HỌC ĐƯỢC CHỌN ===",
                    `Người dùng đang tập trung vào lớp "${cc.className}"`,
                    "",
                    "📅 THỜI KHÓA BIỂU:",
                    scheduleStr,
                    "",
                    "📝 BÀI TẬP TRONG LỚP:",
                    assignmentsStr,
                    "",
                    "📢 THÔNG BÁO GẦN ĐÂY:",
                    announcementsStr,
                    "",
                    `👥 SỐ THÀNH VIÊN: ${cc.memberCount?.students || 0} học sinh`,
                    "",
                    "HÃY SỬ DỤNG THÔNG TIN NÀY ĐỂ TRẢ LỜI CÂU HỎI PHÙ HỢP VỚI NGỮ CẢNH LỚP HỌC.",
                    "=== KẾT THÚC NGỮU CẢNH LỚP HỌC ==="
                ].join("\n");
            }

            // Process Deep Assignment Context from client
            if (context.selectedAssignmentContext) {
                const ac = context.selectedAssignmentContext;
                deepContextInfo += [
                    "",
                    "=== NGỮ CẢNH SÂU: BÀI TẬP ĐƯỢC CHỌN ===",
                    `Người dùng đang tập trung vào bài tập "${ac.title}"`,
                    "",
                    "📋 CHI TIẾT BÀI TẬP:",
                    `- Tiêu đề: ${ac.title}`,
                    `- Lớp: ${ac.className}`,
                    `- Deadline: ${ac.dueDate}`,
                    `- Mô tả: ${ac.description || "Không có mô tả chi tiết"}`,
                    "",
                    "📊 THỐNG KÊ NỘP BÀI:",
                    `- Tổng số: ${ac.submissionStats?.total || 0}`,
                    `- Đã nộp: ${ac.submissionStats?.submitted || 0}`,
                    `- Đã chấm: ${ac.submissionStats?.graded || 0}`,
                    ac.hasAttachments ? "📎 Có file đính kèm" : "",
                    "",
                    "HÃY TRẢ LỜI DỰA TRÊN NGỮ CẢNH BÀI TẬP NÀY. NẾU LÀ GIÁO VIÊN, HỖ TRỢ SOẠN/CHẤM. NẾU LÀ HỌC SINH, HỖ TRỢ GIẢI/ÔN.",
                    "=== KẾT THÚC NGỮ CẢNH BÀI TẬP ==="
                ].join("\n");
            }
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
            : socraticMode
                ? [
                    "VAI TRÒ: GIA SƯ SOCRATIC (STUDENT)",
                    "PHƯƠNG PHÁP DẠY HỌC:",
                    "- TUYỆT ĐỐI KHÔNG cho đáp án trực tiếp.",
                    "- Đặt câu hỏi gợi mở để học sinh tự suy nghĩ.",
                    "- Ví dụ: 'Em nghĩ yếu tố nào ảnh hưởng đến kết quả này?'",
                    "- Kiên nhẫn dẫn dắt qua từng bước nhỏ.",
                    "- CHỈ cung cấp gợi ý khi học sinh thực sự bí.",
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
            "Bạn là MiQiX AI, trợ lý " + assistantType + " thông minh.",
            "Sử dụng Tiếng Việt. Hỗ trợ hiển thị công thức Toán học bằng LaTeX (dùng $ cho inline, $$ cho block).",
            "Phong cách: chuyên nghiệp, gần gũi, Markdown hóa (Bảng, Danh sách, Đậm).",
            "",
            targetedAssignmentContext,
            targetedClassContext,
            generalContext,
            deepContextInfo, // Deep context for selected class/assignment
            "",
            roleInstructions,
            "",
            "CHẾ ĐỘ TRỢ LÝ HIỆN TẠI: " + currentMode,
            "",
            PAYLOAD_INSTRUCTIONS,
            "",
            canvasInstruction,
            "",
            socraticMode ? `
            [CHẾ ĐỘ SOCRATIC: KÍCH HOẠT]
            Bạn là một gia sư Socratic kiên nhẫn. Bạn KHÔNG bao giờ đưa ra đáp án ngay.
            
            QUY ĐỊNH OUTPUT (BẮT BUỘC JSON):
            Bạn phải trả về một JSON object duy nhất (không có text rác xung quanh) theo định dạng sau:
            
            {
                "type": "socratic_step",
                "status": "question" | "correct_and_next" | "incorrect_hint" | "completion",
                "question": "Nội dung câu hỏi hoặc gợi ý hoặc lời khen",
                "context": "Ghi chú ngắn về trạng thái hiện tại (ẩn)",
                "step_number": <số bước hiện tại>,
                "is_final": <true nếu đã xong hoàn toàn>
            }
            
            LOGIC PHẢN HỒI:
            1. NẾU ĐÂY LÀ BẮT ĐẦU:
               - status: "question"
               - question: Đặt câu hỏi đầu tiên để phá băng (chia nhỏ vấn đề).
               - step_number: 1
               
            2. NẾU USER TRẢ LỜI ĐÚNG:
               - status: "correct_and_next"
               - question: "Đúng rồi! + [Câu hỏi cho bước tiếp theo]"
               - Tăng step_number lên 1.
               
            3. NẾU USER TRẢ LỜI SAI:
               - status: "incorrect_hint"
               - question: "Chưa chính xác + [Gợi ý nhỏ] + [Hỏi lại câu hỏi đó theo cách khác]"
               - Giữ nguyên step_number.
               
            4. NẾU ĐÃ GIẢI QUYẾT XONG VẤN ĐỀ:
               - status: "completion"
               - question: "Chúc mừng! Bạn đã giải thành công. [Tóm tắt ngắn gọn]"
               - is_final: true

            HÃY KIÊN NHẪN VÀ KHUYẾN KHÍCH HỌC SINH.
            ` : ""
        ];

        const systemPrompt = systemPromptParts.filter(Boolean).join("\n");

        // 5. Use AICore to generate response
        // Note: AICore handles the API call and error handling
        const responseCallback = await AICore.generateText(message, {
            systemPrompt: systemPrompt,
            jsonMode: socraticMode, // Enforce JSON for Socratic
            reasoning: includeReasoning,
            model: AI_CONFIG.models.SMART // Use smarter model for chat
        });

        if (responseCallback.error) {
            throw new Error(responseCallback.error);
        }

        return NextResponse.json({
            reply: responseCallback.text,
            reasoning: responseCallback.reasoning
        });

    } catch (error: any) {
        console.error("[Chat API Error]:", error);
        return NextResponse.json({
            error: "Lỗi kết nối MiQiX AI",
            details: error.message
        }, { status: 500 });
    }
}
