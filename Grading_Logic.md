# 📊 Logic Xử lý Chấm điểm tại Miqix

Hệ thống Miqix hỗ trợ quy trình chấm điểm kết hợp giữa sự chính xác của giáo viên và khả năng phân tích thông minh của AI.

---

## 1. Chấm điểm Thủ công (Manual Grading)
Đây là phương thức chấm điểm truyền thống, nơi giáo viên trực tiếp đánh giá bài làm của học sinh.

### Quy trình:
1.  **Xác thực:** Hệ thống kiểm tra xem người dùng hiện tại có phải là giáo viên và có quyền quản lý bài tập này không.
2.  **Cập nhật Database:** Sử dụng hàm `gradeAssignmentAction` để lưu thông tin.
3.  **Thay đổi trạng thái:** Bài làm chuyển từ trạng thái `submitted` sang `graded`.

```typescript
// Nguồn: src/lib/actions.ts
// Hàm cập nhật điểm và nhận xét vào cơ sở dữ liệu
await db.submission.update({
    where: { id: submissionId },
    data: {
        score,       // Điểm số (0-10)
        feedback,    // Nhận xét của giáo viên
        status: 'graded'
    }
});
```

---

## 2. Trợ lý Chấm điểm AI (AI Grading Assistant)
Đây là tính năng đột phá giúp giáo viên tiết kiệm thời gian bằng cách phân tích bài làm tự động.

### Cơ chế hoạt động:
Hệ thống sử dụng **Gemini 3 Flash** (hoặc Groq) để "đọc" bài làm và đưa ra đề xuất.

*   **Dữ liệu đầu vào:** Toàn bộ đề bài (Assignment Description) + Bài làm của học sinh (Submission Content).
*   **System Prompt:** Yêu cầu AI đóng vai một "Giáo viên nghiêm khắc nhưng công bằng".
*   **Định dạng đầu ra:** JSON cấu trúc để hệ thống có thể đọc và hiển thị biểu đồ.

### Mã nguồn xử lý AI:
```typescript
// Nguồn: src/lib/ai-actions.ts -> analyzeSubmissionAction
const systemPrompt = `
    Phân tích bài làm và trả về JSON: 
    { 
        score,          // Điểm đề xuất
        feedback,       // Nhận xét chi tiết
        errorAnalysis: { 
            categories: { 
                understanding, // Độ hiểu bài
                calculation,   // Độ chính xác
                presentation,  // Cách trình bày
                logic          // Tư duy logic
            },
            mainIssues: [],    // Các lỗi chính
            suggestions: []    // Hướng cải thiện
        } 
    }
`;
```

---

## 3. Tổng hợp Dữ liệu Analytics
Sau khi điểm được lưu, hệ thống sẽ tự động cập nhật các chỉ số trong `StudentAnalytics`:
*   **Average Score:** Tính lại điểm trung bình cho học sinh.
*   **Submission Rate:** Cập nhật tỷ lệ hoàn thành bài tập.
*   **Learning Path:** AI dựa vào các lỗi trong `errorAnalysis` để gợi ý nội dung ôn tập phù hợp.

---

**💡 Điểm đặc biệt:** Tại Miqix, AI không thay thế giáo viên. AI chỉ đưa ra **đề xuất**, giáo viên là người cuối cùng duyệt lại điểm số và nhận xét trước khi gửi tới học sinh.
