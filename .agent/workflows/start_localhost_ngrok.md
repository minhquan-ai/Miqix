---
description: "Hướng dẫn khởi chạy localhost và ngrok cho dự án Ergonix"
---

# Mục tiêu
- Khởi động server phát triển Next.js trên máy cục bộ.
- Mở cổng này ra internet bằng ngrok để có thể truy cập từ bên ngoài.

# Các bước thực hiện
1. **Cài đặt phụ thuộc** (nếu chưa có):
   ```bash
   # Cài npm dependencies
   npm install
   # Cài ngrok (có thể dùng Homebrew trên macOS)
   brew install ngrok
   ```
2. **Chạy server phát triển**:
   ```bash
   # Từ thư mục gốc của dự án (ergonix)
   npm run dev
   ```
   Server sẽ lắng nghe trên `http://0.0.0.0:3000` (hoặc `http://localhost:3000`).
3. **Mở ngrok** để tạo tunnel tới cổng 3000:
   ```bash
   ngrok http 3000
   ```
   - Khi lệnh chạy, ngrok sẽ trả về một URL công cộng dạng `https://xxxx.ngrok.io`.
   - Dùng URL này để truy cập ứng dụng từ bất kỳ thiết bị nào có internet.
4. **Kiểm tra**:
   - Mở trình duyệt và truy cập `http://localhost:3000` để chắc chắn server chạy bình thường.
   - Sau đó mở URL ngrok để xác nhận tunnel hoạt động.

# Lưu ý
- Nếu bạn muốn ngrok tự động khởi động cùng server, có thể thêm script vào `package.json`:
  ```json
  "scripts": {
    "dev": "next dev -H 0.0.0.0",
    "ngrok": "ngrok http 3000",
    "dev:ngrok": "npm-run-all --parallel dev ngrok"
  }
  ```
  (cần cài `npm-run-all` bằng `npm i -D npm-run-all`).
- Đảm bảo bạn đã đăng ký tài khoản ngrok và thiết lập token (`ngrok config add-authtoken <TOKEN>`).
