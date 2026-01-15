import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        // 1. Create Teacher (no password field in schema)
        const teacher = await db.user.upsert({
            where: { email: 'teacher@miqix.edu' },
            update: {},
            create: {
                name: 'Cô Giáo Hạnh',
                email: 'teacher@miqix.edu',
                role: 'teacher',
                avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hanh'
            }
        });

        // 2. Create Students
        const studentsData = [
            { name: 'Nguyễn Văn An', email: 'an@miqix.edu', seed: 'An' },
            { name: 'Trần Thị Bình', email: 'binh@miqix.edu', seed: 'Binh' },
            { name: 'Lê Văn Cường', email: 'cuong@miqix.edu', seed: 'Cuong' },
        ];

        const students: any[] = [];
        for (const s of studentsData) {
            const student = await db.user.upsert({
                where: { email: s.email },
                update: {},
                create: {
                    name: s.name,
                    email: s.email,
                    role: 'student',
                    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.seed}`,
                    xp: 0,
                    level: 1,
                    streak: 0
                }
            });
            students.push(student);
        }

        // 3. Create Class
        const mathClass = await db.class.create({
            data: {
                name: 'Toán Cao Cấp A1',
                subject: 'Toán học',
                description: 'Lớp học dành cho các thiên tài toán học tương lai.',
                teacherId: teacher.id,
                code: 'MATH101A',
                codeEnabled: true,
                schedule: 'Thứ 2, 4, 6 (08:00 - 10:00)',
                avatar: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=60'
            }
        });

        // 4. Enroll Students
        for (const s of students) {
            await db.classEnrollment.create({
                data: {
                    userId: s.id,
                    classId: mathClass.id,
                    role: 'main',
                    status: 'active'
                }
            });
        }

        // 5. Create Assignments with rich formatted content
        const assignment1 = await db.assignment.create({
            data: {
                title: 'Bài tập về nhà: Đạo hàm và Ứng dụng',
                description: `**MỤC TIÊU BÀI TẬP**
Củng cố kiến thức về đạo hàm và vận dụng vào các bài toán thực tế.

---

**PHẦN 1: LÝ THUYẾT** (3 điểm)

1. Nêu định nghĩa đạo hàm của hàm số tại một điểm.
2. Viết công thức đạo hàm của các hàm số cơ bản: $x^n$, $\\sin x$, $\\cos x$, $e^x$, $\\ln x$.
3. Phát biểu quy tắc đạo hàm của tích và thương.

---

**PHẦN 2: BÀI TẬP TÍNH TOÁN** (5 điểm)

Tính đạo hàm của các hàm số sau:

a) $y = 3x^4 - 2x^3 + 5x - 7$
b) $y = \\sqrt{2x + 1}$
c) $y = \\frac{x^2 + 1}{x - 1}$
d) $y = e^{2x} \\cdot \\sin(3x)$
e) $y = \\ln(x^2 + 4x + 5)$

---

**PHẦN 3: ỨNG DỤNG** (2 điểm)

Một vật chuyển động theo phương trình $s(t) = t^3 - 6t^2 + 9t + 2$ (mét), với $t$ tính bằng giây.

a) Tính vận tốc của vật tại thời điểm $t = 2s$.
b) Tìm thời điểm vật đạt vận tốc bằng 0.

---

**YÊU CẦU NỘP BÀI**
✅ Làm bài trên giấy A4, trình bày rõ ràng
✅ Chụp ảnh hoặc scan và nộp file PDF/ảnh
✅ Deadline: **Chủ nhật, 23:59**

*Chúc các em làm bài tốt!* 📚`,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                classIds: JSON.stringify([mathClass.id]),
                teacherId: teacher.id,
                type: 'homework',
                xpReward: 100,
                maxScore: 10
            }
        });

        const assignment2 = await db.assignment.create({
            data: {
                title: 'Dự án nhóm: Ứng dụng Toán học trong Kinh tế',
                description: `**THÔNG TIN DỰ ÁN**
📌 **Loại:** Bài tập nhóm (3-4 thành viên)
📌 **Thời hạn:** 2 tuần
📌 **Điểm tối đa:** 100 điểm

---

**MÔ TẢ**

Nghiên cứu và trình bày một ứng dụng cụ thể của Toán học (Đạo hàm, Tích phân, Ma trận...) trong lĩnh vực Kinh tế hoặc Tài chính.

---

**YÊU CẦU**

**1. BÁO CÁO VIẾT** (50 điểm)
- Độ dài: 5-10 trang A4
- Nội dung bắt buộc:
  • Giới thiệu vấn đề nghiên cứu
  • Cơ sở lý thuyết toán học
  • Ví dụ thực tế với số liệu cụ thể
  • Kết luận và nhận xét

**2. THUYẾT TRÌNH** (30 điểm)
- Thời lượng: 10-15 phút/nhóm
- Slides PowerPoint hoặc Canva
- Tất cả thành viên đều phải trình bày

**3. ĐÁNH GIÁ CHÉO** (20 điểm)
- Mỗi nhóm đánh giá 2 nhóm khác
- Sử dụng rubric được cung cấp

---

**GỢI Ý CHỦ ĐỀ**
💡 Mô hình tăng trưởng kinh tế
💡 Tối ưu hóa lợi nhuận doanh nghiệp
💡 Phân tích rủi ro đầu tư
💡 Dự báo xu hướng thị trường

---

**LIÊN HỆ**
Nếu có thắc mắc, các em liên hệ cô qua Zalo hoặc email: teacher@miqix.edu`,
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                classIds: JSON.stringify([mathClass.id]),
                teacherId: teacher.id,
                type: 'project',
                xpReward: 200,
                maxScore: 100
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Database seeded successfully!',
            data: {
                teacher: teacher.email,
                students: students.map(s => s.email),
                class: mathClass.code,
                assignments: [assignment1.title, assignment2.title]
            }
        });

    } catch (error) {
        console.error('Seeding error:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
