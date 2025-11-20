"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Target, BookOpen, Users, FileCheck, Plus } from "lucide-react";
import { DataService } from "@/lib/data";

type TeacherMissionCategory = 'grading' | 'teaching' | 'admin' | 'personal';

export default function CreateTeacherMissionPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<TeacherMissionCategory>('teaching');
    const [dueDate, setDueDate] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !dueDate) {
            alert("Vui lòng điền đầy đủ thông tin!");
            return;
        }

        setLoading(true);
        try {
            const currentUser = await DataService.getCurrentUser();
            if (!currentUser || currentUser.role !== 'teacher') {
                router.push('/dashboard');
                return;
            }

            await DataService.createMission({
                title,
                description,
                type: 'custom',
                category,
                createdBy: currentUser.id,
                assignedTo: currentUser.id,
                status: 'pending',
                dueDate: new Date(dueDate).toISOString(),
            });

            alert("Tạo nhiệm vụ thành công!");
            router.push('/dashboard/teacher-missions');
        } catch (error) {
            console.error("Failed to create mission", error);
            alert("Có lỗi xảy ra, vui lòng thử lại!");
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        {
            key: 'teaching' as const,
            label: 'Giảng dạy',
            icon: <BookOpen className="w-6 h-6" />,
            color: 'blue',
            desc: 'Soạn giáo án, chuẩn bị bài giảng'
        },
        {
            key: 'grading' as const,
            label: 'Chấm bài',
            icon: <FileCheck className="w-6 h-6" />,
            color: 'purple',
            desc: 'Chấm bài kiểm tra, đánh giá'
        },
        {
            key: 'admin' as const,
            label: 'Quản lý',
            icon: <Users className="w-6 h-6" />,
            color: 'orange',
            desc: 'Họp phụ huynh, báo cáo, hành chính'
        },
        {
            key: 'personal' as const,
            label: 'Cá nhân',
            icon: <Target className="w-6 h-6" />,
            color: 'green',
            desc: 'Bồi dưỡng chuyên môn, phát triển bản thân'
        },
    ];

    return (
        <div className="space-y-6 -m-8 p-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Plus className="w-8 h-8 text-primary" />
                    Tạo Nhiệm Vụ
                </h1>
                <p className="text-muted-foreground mt-1">
                    Quản lý công việc giảng dạy và phát triển chuyên môn của bạn
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-6">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Tên nhiệm vụ <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ví dụ: Soạn đề kiểm tra giữa kỳ môn Toán"
                        className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Mô tả <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Mô tả chi tiết nhiệm vụ..."
                        rows={4}
                        className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        required
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium mb-3">
                        Danh mục <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {categories.map((cat) => (
                            <button
                                key={cat.key}
                                type="button"
                                onClick={() => setCategory(cat.key)}
                                className={`p-4 rounded-lg border-2 transition-all text-left ${category === cat.key
                                    ? `border-${cat.color}-500 bg-${cat.color}-50 text-${cat.color}-700`
                                    : 'border-border hover:border-primary/30'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    {cat.icon}
                                    <div className="font-medium">{cat.label}</div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {cat.desc}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Due Date */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Hạn hoàn thành <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                        <input
                            type="datetime-local"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? "Đang tạo..." : "Tạo nhiệm vụ"}
                    </button>
                </div>
            </form>

            {/* Tips */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <h3 className="font-bold text-amber-900 mb-2">💡 Gợi ý quản lý công việc hiệu quả</h3>
                <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Ưu tiên các công việc theo mức độ quan trọng và khẩn cấp</li>
                    <li>• Phân bổ thời gian hợp lý cho từng nhiệm vụ</li>
                    <li>• Cập nhật tiến độ định kỳ để theo dõi công việc</li>
                    <li>• Tách nhiệm vụ lớn thành các công việc nhỏ dễ quản lý hơn</li>
                </ul>
            </div>
        </div>
    );
}
