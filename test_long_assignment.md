# Hướng dẫn chi tiết: Dự án Lập trình Hệ thống Quản lý Học tập Ergonix

## 1. Giới thiệu dự án
Dự án này yêu cầu bạn xây dựng một ứng dụng web hoàn chỉnh sử dụng Next.js 14+, hỗ trợ các tính năng cốt lõi cho giáo viên và học sinh. Đây là một bài tập tổng hợp kiểm tra kiến thức về:
- React Server Components (RSC)
- Server Actions
- Database Schema Design với Prisma
- Authentication với Auth.js (NextAuth)
- UI/UX hiện đại với Tailwind CSS và Framer Motion

## 2. Yêu cầu chi tiết nội dung

### 2.1. Phân quyền người dùng
Hệ thống phải phân biệt rõ ràng giữa các vai trò sau:
| Vai trò | Quyền hạn chính |
| :--- | :--- |
| **Giáo viên** | Tạo lớp học, giao bài tập, chấm điểm, quản lý học sinh |
| **Học sinh** | Tham gia lớp học bằng mã, làm bài tập, xem phản hồi từ AI và giáo viên |

### 2.2. Tính năng Bài tập (Assignments)
Bạn cần thực hiện một trang chi tiết bài tập có các thành phần:
- **Ngăn trái (Resizable):** Hiển thị đề bài dưới dạng Markdown, các tệp đính kèm và Rubric chấm điểm.
- **Ngăn phải (Workspace):** Trình soạn thảo văn bản phong phú (Rich Text Editor) cho học sinh làm bài trực tiếp.

### 2.3. Tích hợp AI
Sử dụng Google Gemini API để:
1. Phân tích bài làm của học sinh dựa trên đề bài.
2. Đưa ra gợi ý sửa lỗi (Error Analysis).
3. Đưa ra điểm số dự kiến (Score Estimate).

## 3. Quy trình thực hiện (Workflow)

### Bước 1: Thiết kế Cơ sở dữ liệu
```prisma
model Assignment {
  id          String   @id @default(cuid())
  title       String
  description String   @db.Text
  dueDate     DateTime
  teacherId   String
  // ... các trường khác
}
```

### Bước 2: Xây dựng Giao diện
Sử dụng `framer-motion` để tạo các hiệu ứng chuyển cảnh mượt mà. Đảm bảo giao diện đáp ứng (Responsive) tốt trên cả thiết bị di động.

### Bước 3: Logic Server-side
Triển khai các Server Actions để xử lý việc nộp bài và lưu nháp tự động (`auto-save`) vào `localStorage` hoặc Database.

## 4. Tài liệu tham khảo
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma ORM](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Tiptap Editor](https://tiptap.dev/docs)

## 5. Tiêu chí đánh giá (Rubric)
1. **Giao diện (30đ):** Đẹp, dễ sử dụng, không lỗi layout.
2. **Tính năng (50đ):** Chạy đúng yêu cầu, không lỗi API.
3. **Mã nguồn (20đ):** Sạch sẽ, có comment giải thích, cấu trúc thư mục hợp lý.

---
*Lưu ý: Bạn có 2 tuần để hoàn thành dự án này. Chúc các bạn làm bài tốt!*

### Phụ lục: Các mẹo nhỏ khi làm bài
Dưới đây là một số mẹo để bạn tối ưu hóa hiệu suất ứng dụng:
- Sử dụng `Suspense` cho các thành phần nạp dữ liệu lâu.
- Tối ưu hóa hình ảnh với component `next/image`.
- Hạn chế sử dụng "use client" trừ khi thực sự cần thiết để tận dụng sức mạnh của Server Components.
- Kiểm tra kỹ các trường hợp lỗi (Edge cases) như mất kết nối mạng, dữ liệu rỗng, ...

Học sinh cần chú ý các quy định về đạo văn và bản quyền mã nguồn. Mọi hành vi vi phạm sẽ bị xử lý nghiêm theo nội quy của Ergonix.

---
#### Danh sách các thư viện khuyến khích sử dụng:
- `lucide-react`: Hệ thống icon đẹp mắt.
- `clsx` và `tailwind-merge`: Quản lý ClassName dễ dàng.
- `zod`: Validate dữ liệu mạnh mẽ.
- `react-hook-form`: Quản lý form hiệu quả.

Chúc các bạn thành công trên con đường trở thành Full-stack Developer chuyên nghiệp!
