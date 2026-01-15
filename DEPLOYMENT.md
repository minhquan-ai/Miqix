# Hướng dẫn Triển khai (Deployment Guide) - Dự án Ergonix

Tài liệu này hướng dẫn bạn các bước cần thiết để chuẩn bị và triển khai ứng dụng Ergonix lên môi trường production (ví dụ: Vercel).

## 1. Các biến môi trường (Environment Variables)

Bạn cần thiết lập các biến môi trường sau đây trong cài đặt của nhà cung cấp dịch vụ lưu trữ (Vercel, Railway, Render, v.v.):

| Tên biến | Mô tả |
| :--- | :--- |
| `DATABASE_URL` | Chuỗi kết nối cơ sở dữ liệu (ví dụ: `file:./dev.db` cho SQLite hoặc URL Postgres). |
| `AUTH_SECRET` | Một chuỗi ngẫu nhiên dài để bảo mật phiên đăng nhập (tạo bằng lệnh `openssl rand -base64 32`). |
| `OPENROUTER_API_KEY` | Khóa API từ OpenRouter để sử dụng các tính năng AI. |
| `NEXTAUTH_URL` | (Tùy chọn trên Vercel) URL chính thức của ứng dụng, ví dụ: `https://ergonix.vn`. |

## 2. Cơ sở dữ liệu (Database)

Hiện tại dự án đang sử dụng **SQLite** (`dev.db`).
- **Lưu ý**: SQLite không được hỗ trợ tốt trên các nền tảng serverless như Vercel (do hệ thống tệp chỉ đọc).
- **Khuyến nghị**:
    - Sử dụng **Turso** nếu bạn muốn tiếp tục dùng SQLite trên cloud.
    - Hoặc chuyển sang **PostgreSQL** (Supabase, Neon, AWS RDS). Trong trường hợp này, hãy cập nhật `prisma/schema.prisma` từ `provider = "sqlite"` sang `provider = "postgresql"`.

## 3. Các bước chuẩn bị trước khi Deploy

1. **Kiểm tra lỗi Build**: Luôn chạy lệnh build cục bộ trước khi push:
   ```bash
   npm run build
   ```
   *(Tôi đã kiểm tra và sửa các lỗi TypeScript hiện tại, lệnh build đã chạy thành công).*

2. **Cập nhật Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Đẩy cơ sở dữ liệu (Database Push)**: Nếu dùng DB mới:
   ```bash
   npx prisma db push
   ```

## 4. Triển khai lên Vercel

1. Kết nối kho lưu trữ GitHub (hoặc GitLab/Bitbucket) của bạn với Vercel.
2. Thiết lập các biến môi trường như đã nêu ở mục 1.
3. Vercel sẽ tự động phát hiện Next.js và chạy lệnh build.

## 5. Danh sách các lỗi đã sửa (Bug Fixes)

Để chuẩn bị cho bản build này, tôi đã sửa các lỗi sau:
- Xóa thuộc tính thừa `activeMissions` không tồn tại trong component `Sidebar` tại file `src/app/assignments/[id]/page.tsx`.
- Sửa lỗi gọi sai tên hàm `setIsCollapsed` thành `setIsCollapsedInternal` trong component `Sidebar.tsx`.

---
Chúc bạn triển khai thành công!
