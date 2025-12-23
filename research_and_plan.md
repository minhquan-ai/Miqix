# Nghiên cứu và Kế hoạch Nâng cấp Giao diện Làm bài tập (Ergonix)

Dựa trên yêu cầu của bạn, tôi đã nghiên cứu các nền tảng hàng đầu (Google Classroom, Canvas, Quizizz) và các tiêu chuẩn UX giáo dục hiện đại. Dưới đây là phân tích và kế hoạch cụ thể cho Ergonix.

## 1. Phân tích Thị trường & Đối thủ

| Nền tảng | Điểm mạnh (Learn from) | Điểm yếu (Avoid) |
| :--- | :--- | :--- |
| **Google Classroom** | Giao diện cực kỳ đơn giản, tập trung vào đính kèm file (Drive). | Khá đơn điệu, ít công cụ soạn thảo trực tiếp mạnh mẽ. |
| **Canvas LMS** | Rất nhiều công cụ (Rich text, media), hỗ trợ nhiều loại bài tập. | Giao diện cũ, rối rắm, UX chưa tối ưu cho trải nghiệm "tập trung". |
| **Quizizz** | Gamification (game hóa), phản hồi tức thì, giao diện sống động. | Chỉ phù hợp bài trắc nghiệm nhanh, không tốt cho bài luận/dự án dài. |
| **Ergonix (Hiện tại)** | Giao diện hiện đại, sạch sẽ, có Split View (chia đôi màn hình). | Công cụ soạn thảo còn sơ sài (chỉ là text area), thiếu tính năng auto-save, chưa tối ưu cho media. |

## 2. Các Tính năng Cần Thiết (The "More Tools" Plan)

Để biến trang làm bài thành một "Workspace" thực thụ, chúng ta cần bổ sung các công cụ sau:

### Giai đoạn 1: Nâng cấp Core Experience (Đã hoàn thành)
Những tính năng này cần thiết để việc làm bài trở nên thuận tiện và chuyên nghiệp hơn.

1.  **Rich Text Editor (Soạn thảo văn bản phong phú)** - Đã tích hợp TipTap.
2.  **Auto-Save (Lưu nháp tự động)** - Đã có tính năng lưu nháp (thủ công + phím tắt).
3.  **Resizable Split View** - Đã điều chỉnh layout.

### Giai đoạn 2: Công cụ Hỗ trợ & Tập trung (Đã hoàn thành)

4.  **Focus Mode & Phím tắt**
    *   Thêm chế độ "Zen Mode": [x] Đã xong.
    *   Phím tắt (Ctrl+S, Ctrl+Enter): [x] Đã xong.

5.  **Tích hợp Đa phương tiện (Multimedia Submission)**
    *   Ghi âm / Quay video trực tiếp: [x] Đã xong (MultimediaRecorder).

6.  **AI Assistant thông minh hơn (Context-aware)**
    *   AI Actions (Viết lại, Sửa lỗi) trên Toolbar: [x] Đã xong.

## 3. Kế hoạch Triển khai (Roadmap)

Tôi đề xuất chúng ta bắt đầu với **Giai đoạn 1** ngay bây giờ:

1.  **Bước 1: Cài đặt Rich Text Editor.** Thay thế `textarea` đơn giản bằng một Editor component xịn xò hơn.
2.  **Bước 2: Implement Auto-save.** Đảm bảo an toàn dữ liệu cho học sinh.
3.  **Bước 3: Tinh chỉnh UI.** Làm cho thanh công cụ (Toolbar) đẹp và dễ sử dụng.

Bạn có đồng ý bắt đầu với **Giai đoạn 1** (Rich Text Editor & Auto-save) không?
