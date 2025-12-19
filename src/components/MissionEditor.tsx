"use client";

import { useState } from "react";
import { Calendar, Star, X, Target, Users } from "lucide-react";
import { createMissionAction } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { User } from "@/types";

interface MissionEditorProps {
    students: User[]; // List of students to assign to (for custom missions)
    onCancel: () => void;
}

export default function MissionEditor({ students, onCancel }: MissionEditorProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        dueDate: "",
        assignedTo: "" // Student ID
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await createMissionAction({
                ...formData,
                dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined
            });

            if (result.success) {
                router.refresh();
                onCancel();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error(error);
            alert("Lỗi khi tạo nhiệm vụ");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-xl border border-border shadow-sm">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    Giao nhiệm vụ cá nhân
                </h2>
                <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-4">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium mb-1">Tên nhiệm vụ</label>
                    <input
                        type="text"
                        required
                        className="w-full p-2 rounded-md border border-input bg-background"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ví dụ: Đọc sách 30 phút"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium mb-1">Mô tả chi tiết</label>
                    <textarea
                        required
                        rows={3}
                        className="w-full p-2 rounded-md border border-input bg-background resize-none"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Mô tả những gì học sinh cần làm..."
                    />
                </div>

                {/* Assign To */}
                <div>
                    <label className="block text-sm font-medium mb-1">Giao cho học sinh</label>
                    <select
                        required
                        className="w-full p-2 rounded-md border border-input bg-background"
                        value={formData.assignedTo}
                        onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                    >
                        <option value="">-- Chọn học sinh --</option>
                        {students.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Hạn chót (Tùy chọn)</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <input
                            type="date"
                            className="w-full pl-9 p-2 rounded-md border border-input bg-background"
                            value={formData.dueDate}
                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    Hủy bỏ
                </button>
                <button
                    type="submit"
                    disabled={isLoading || !formData.assignedTo}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isLoading ? "Đang giao..." : "Giao nhiệm vụ"}
                </button>
            </div>
        </form>
    );
}
