"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Target, BookOpen, User as UserIcon } from "lucide-react";
import { DataService } from "@/lib/data";

type MissionCategory = 'learning' | 'personal';

export default function CreateStudentMissionPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<MissionCategory>('learning');
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
            if (!currentUser) {
                router.push('/login');
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
            router.push('/dashboard/missions');
        } catch (error) {
            console.error("Failed to create mission", error);
            alert("Có lỗi xảy ra, vui lòng thử lại!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 -m-8 p-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Target className="w-8 h-8 text-purple-600" />
                    Tạo Nhiệm Vụ Cá Nhân
                </h1>
                <p className="text-muted-foreground mt-1">
                    Đặt mục tiêu học tập cho bản thân để phát triển tốt hơn
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
                        placeholder="Ví dụ: Học 50 từ vựng Tiếng Anh"
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
                        placeholder="Mô tả chi tiết nhiệm vụ của bạn..."
                        rows={4}
                        className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        required
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Danh mục <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setCategory('learning')}
                            className={`p-4 rounded-lg border-2 transition-all ${category === 'learning'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-border hover:border-blue-300'
                                }`}
                        >
                            <BookOpen className="w-6 h-6 mx-auto mb-2" />
                            <div className="font-medium">Học tập</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Học bài, ôn tập, làm bài tập
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setCategory('personal')}
                            className={`p-4 rounded-lg border-2 transition-all ${category === 'personal'
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-border hover:border-purple-300'
                                }`}
                        >
                            <UserIcon className="w-6 h-6 mx-auto mb-2" />
                            <div className="font-medium">Cá nhân</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Đọc sách, rèn luyện kỹ năng
                            </div>
                        </button>
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
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <h3 className="font-bold text-blue-900 mb-2">💡 Gợi ý</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Đặt mục tiêu cụ thể, có thể đo lường được</li>
                    <li>• Chia nhỏ nhiệm vụ lớn thành các nhiệm vụ nhỏ hơn</li>
                    <li>• Đặt deadline hợp lý để tạo động lực</li>
                    <li>• Review và cập nhật tiến độ thường xuyên</li>
                </ul>
            </div>
        </div>
    );
}
