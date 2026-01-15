# 🤖 Logic AI Trợ lý Học tập (Learning AI)

Khi học sinh mở Trợ lý AI trong quá trình làm bài tập, hệ thống sẽ kích hoạt một quy trình xử lý thông minh để hỗ trợ mà không làm thay bài.

---

## 1. Dữ liệu AI thu thập (Data Extraction)
Để đưa ra lời khuyên chính xác nhất, AI sẽ "đọc" các thông tin sau từ giao diện làm bài:

1.  **Thông tin Đề bài:** Tên bài tập và nội dung mô tả chi tiết (tối đa 1000 ký tự).
2.  **Bài làm của Học sinh:** Toàn bộ nội dung bản nháp hiện tại học sinh đang viết (tối đa 500 ký tự).
3.  **Bối cảnh hội thoại:** 10 tin nhắn gần nhất trong phiên chat để hiểu luồng thảo luận.
4.  **Chế độ hỗ trợ:** 
    *   `Socratic`: Học tập gợi mở.
    *   `Rubric`: Chấm thử theo tiêu chí.
    *   `ELI5`: Giải thích đơn giản.

---

## 2. Cách AI giúp học sinh làm bài (Tutoring Methods)

Hệ thống được thiết kế dựa trên triết lý **"Giúp học sinh tự học"**:

### A. Phương pháp Socratic (Hỏi đáp gợi mở)
AI tuyệt đối **KHÔNG** đưa ra đáp án trực tiếp. Nếu học sinh hỏi đáp án, AI sẽ:
*   Đặt một câu hỏi ngược lại để gợi ý hướng tư duy.
*   Chia nhỏ một bài toán/vấn đề phức tạp thành nhiều bước nhỏ dễ hiểu.
*   Cung cấp công thức hoặc lý thuyết liên quan thay vì kết quả tính toán.

### B. Chấm thử theo Tiêu chí (Rubric Check)
AI đóng vai trò "người thẩm định" bản nháp:
*   So sánh bài làm của học sinh với yêu cầu đề bài.
*   Chỉ ra các phần còn thiếu hoặc cần bổ sung.
*   Gợi ý cách cải thiện cách trình bày hoặc lập luận.

### C. Đơn giản hóa kiến thức (ELI5)
Nếu có một khái niệm quá khó, AI sẽ giải thích lại bằng những ví dụ đời sống cực kỳ đơn giản (như giải thích cho một đứa trẻ 5 tuổi), giúp học sinh nắm bắt cốt lõi vấn đề trước khi bắt tay vào làm.

---

## 3. Mã nguồn thực thi (Code Proof)

Đoạn code cấu hình "bộ não" của trợ lý tại `LearningAI.tsx`:

```typescript
const systemContext = `
    [VAI TRÒ: TRỢ LÝ HỌC TẬP]
    - Bạn KHÔNG PHẢI là máy giải bài tập. KHÔNG bao giờ đưa ra đáp án trực tiếp.
    - Tên bài tập: ${assignmentTitle}
    - Nội dung đề bài: ${assignmentContext}
    - Bài làm hiện tại: ${submissionContext}
    
    [QUY TẮC SOCRATIC]
    1. Nếu hỏi đáp án -> Hãy hỏi ngược lại 1 câu hỏi gợi mở.
    2. Chỉ cung cấp công thức/lý thuyết, không tính toán hộ.
`;
```

---

**⚡ Kết luận:** AI của Miqix không phải là công cụ để "chép bài", mà là một **Gia sư 1-1** luôn túc trực để tháo gỡ khó khăn về tư duy cho học sinh ngay tại bàn học.
