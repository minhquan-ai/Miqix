"use client";

import { useState } from "react";
import { X, Plus, Loader2, BookOpen } from "lucide-react";
import { DataService } from "@/lib/data";
import { useToast } from "@/components/ui/Toast";

interface CreateClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userId: string;
}

export function CreateClassModal({ isOpen, onClose, onSuccess, userId }: CreateClassModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        subject: "",
        description: ""
    });
    const { showToast } = useToast();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await DataService.createClass(userId, formData);
            showToast("Tạo lớp học thành công!", "success");
            onSuccess();
            onClose();
        } catch (error) {
            showToast("Có lỗi xảy ra khi tạo lớp", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-semibold">Tạo Lớp Học Mới</h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tên lớp học <span className="text-red-500">*</span></label>
                        <input
                            required
                            type="text"
                            placeholder="Ví dụ: Toán 12A1 - Thầy Quân"
                            className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Môn học <span className="text-red-500">*</span></label>
                        <select
                            required
                            className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                            value={formData.subject}
                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                        >
                            <option value="">Chọn môn học...</option>
                            <option value="Toán học">Toán học</option>
                            <option value="Vật Lý">Vật Lý</option>
                            <option value="Hóa Học">Hóa Học</option>
                            <option value="Sinh Học">Sinh Học</option>
                            <option value="Tiếng Anh">Tiếng Anh</option>
                            <option value="Ngữ Văn">Ngữ Văn</option>
                            <option value="Khác">Khác</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Mô tả</label>
                        <textarea
                            placeholder="Mô tả ngắn về lớp học..."
                            className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none min-h-[80px]"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Tạo lớp
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
