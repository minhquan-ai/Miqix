# Hướng Dẫn Chuyển Đổi Database sang Postgres (Neon/Vercel)

Để khắc phục lỗi mất dữ liệu trên Vercel, chúng ta sẽ chuyển từ SQLite sang PostgreSQL. Bạn có thể sử dụng **Neon** (được khuyên dùng vì gói Free rất tốt và dễ dùng) hoặc **Vercel Postgres**.

## Bước 1: Tạo Database trên Cloud

1.  Truy cập [Neon Console](https://console.neon.tech/) và đăng nhập/đăng ký.
2.  Tạo một Project mới (ví dụ: `miqix-prod`).
3.  Sau khi tạo xong, Dashboard sẽ hiện thông tin kết nối. Hãy tìm **Connection String** (dạng `postgres://...`).
4.  Copy chuỗi kết nối đó. (Chọn tab "Prisma" nếu có để lấy chuỗi tối ưu).

## Bước 2: Cập nhật biến môi trường (Environment Variables)

### Tại Local (File `.env`)
Mở file `.env` trong project của bạn và thay thế dòng `DATABASE_URL` cũ bằng chuỗi kết nối bạn vừa copy:

```env
# Comment dòng cũ lại
# DATABASE_URL="file:./dev.db"

# Thêm dòng mới (Dán chuỗi kết nối từ Neon vào đây)
DATABASE_URL="postgres://user:password@ep-something.aws.neon.tech/neondb?sslmode=require"
```

### Tại Vercel (Project Settings)
1.  Vào Dashboard của Project trên Vercel.
2.  Vào **Settings** -> **Environment Variables**.
3.  Tìm biến `DATABASE_URL` cũ và **Edit** nó.
4.  Dán chuỗi kết nối mới vào.
5.  Lưu lại (Save).

## Bước 3: Cập nhật Code Prisma

Tôi sẽ tự động sửa file `prisma/schema.prisma` cho bạn ở bước tiếp theo. Nhưng về cơ bản, ta sẽ đổi `provider` từ `sqlite` sang `postgresql`.

## Bước 4: Đồng bộ Database (Migration)

Sau khi sửa file `.env` và `schema.prisma`, bạn cần chạy các lệnh sau ở Terminal để cấu trúc lại database mới trên cloud:

```bash
# 1. Xóa folder migration cũ (vì migration của SQLite không dùng được cho Postgres)
rm -rf prisma/migrations

# 2. Tạo migration mới và đẩy lên Cloud Database
npx prisma migrate dev --name init_postgres

# 3. Tạo lại Prisma Client
npx prisma generate
```

## Bước 5: Deploy lại

Sau khi đẩy code mới lên GitHub, Vercel sẽ tự động build lại. Lần này app sẽ kết nối tới Cloud Database xịn sò và dữ liệu sẽ được lưu vĩnh viễn!
