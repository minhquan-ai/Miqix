# 📑 Logic Gọi API Miqix AI (MiMo-V2-Flash via OpenRouter)

Tài liệu này chi tiết hóa cách thức hệ thống Miqix vận hành để kết nối với mô hình **MiMo-V2-Flash** thông qua hạ tầng của **OpenRouter**.

---

## 🛰️ 1. Giao thức Kết nối (The Protocol)

Hệ thống sử dụng mô hình **Context-Focused Reasoning**. Chúng ta gửi bối cảnh chi tiết và cho phép mô hình thực hiện suy nghĩ logic chuyên sâu (Thinking Mode).

### Sơ đồ Logic:
`Người dùng` ⮕ `Frontend (Context + Thinking Toggle)` ⮕ `Backend (Detailed Assignment Fetch)` ⮕ `OpenRouter (MiMo-V2-Flash)` ⮕ `Phản hồi + Reasoning`

---

## 💻 2. Đặc điểm kỹ thuật mới

### A. Mô hình MiMo-V2-Flash
*   **Model ID:** `xiaomi/mimo-v2-flash`
*   **Điểm mạnh:** Xử lý logic, giải bài và tóm tắt với tốc độ cực nhanh.

### B. Chế độ Tư duy (Thinking Mode)
*   Tham số: `include_reasoning: true`
*   Hiển thị: Luồng suy nghĩ của AI được hiển thị trong block `[!NOTE]` phía trên phản hồi giúp học sinh hiểu cách AI tìm ra kết quả.

### C. Bối cảnh Bài tập Mục tiêu (Target Context)
*   Khi người dùng chọn một bài tập cụ thể, Server sẽ truy xuất toàn bộ **Mô tả** và **Rubric** của bài đó để AI bám sát dữ liệu thật 100%.

---

## 🛠️ 3. Phân tích tham số API

| Tham số | Ý nghĩa |
| :--- | :--- |
| **`include_reasoning`** | Kích hoạt khả năng suy luận từng bước của mô hình. |
| **`targetAssignmentId`** | ID của bài tập được chọn làm bối cảnh chính. |
| **`mode`** | Chế độ trợ lý (Bình thường, Giải bài tập, Tóm tắt, Ôn thi, Sáng tạo). |

---

**⚡ Ghi chú:** Hệ thống hiện tại ưu tiên tính chính xác dựa trên bối cảnh thật và sự minh bạch trong tư duy của AI.
