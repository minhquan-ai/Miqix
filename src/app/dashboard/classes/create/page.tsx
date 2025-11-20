"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { DataService } from "@/lib/data";

export default function CreateClassPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        subject: "",
        description: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const currentUser = await DataService.getCurrentUser();
            await DataService.createClass(currentUser.id, {
                name: formData.name,
                subject: formData.subject,
                description: formData.description
            });
            router.push("/dashboard/classes");
        } catch (error) {
            console.error("Failed to create class", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 -m-8 p-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/classes">
                    <button className="p-2 hover:bg-muted rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tạo lớp học mới</h1>
                    <p className="text-muted-foreground">Điền thông tin để tạo lớp học và nhận mã mời.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">Tên lớp học <span className="text-red-500">*</span></label>
                    <input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background"
                        placeholder="Ví dụ: Lớp 12A1 - Năm học 2024"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">Môn học <span className="text-red-500">*</span></label>
                    <input
                        id="subject"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background"
                        placeholder="Ví dụ: Toán, Vật Lý, Tiếng Anh"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">Mô tả</label>
                    <textarea
                        id="description"
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background resize-none"
                        placeholder="Mô tả ngắn về lớp học..."
                    />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <Link href="/dashboard/classes">
                        <button type="button" className="px-4 py-2 rounded-md border border-border hover:bg-muted transition-colors">
                            Hủy bỏ
                        </button>
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? "Đang tạo..." : "Tạo lớp học"}
                    </button>
                </div>
            </form>
        </div>
    );
}
