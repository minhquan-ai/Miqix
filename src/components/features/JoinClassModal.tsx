"use client";

import { useState } from "react";
import { X, LogIn, Loader2, Hash } from "lucide-react";
import { DataService } from "@/lib/data";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

interface JoinClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userId: string;
}

export function JoinClassModal({ isOpen, onClose, onSuccess, userId }: JoinClassModalProps) {
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState("");
    const { showToast } = useToast();
    const router = useRouter();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length < 6) {
            showToast("Mã lớp phải có 6 ký tự", "error");
            return;
        }

        setLoading(true);
        try {
            const result = await DataService.joinClass(userId, code);
            if (result.success) {
                showToast(result.message, "success");
                onSuccess();
                onClose();
                if (result.classId) {
                    router.push(`/dashboard/classes/${result.classId}`);
                }
            } else {
                showToast(result.message, "error");
            }
        } catch (error) {
            showToast("Có lỗi xảy ra khi tham gia lớp", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-semibold">Tham Gia Lớp Học</h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Hash className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Nhập mã lớp gồm 6 ký tự do giáo viên cung cấp để tham gia lớp học.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <input
                            required
                            type="text"
                            placeholder="Nhập mã lớp (VD: X7K9P2)"
                            className="w-full p-4 text-center text-2xl font-mono tracking-widest border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none uppercase transition-all"
                            value={code}
                            onChange={e => setCode(e.target.value.toUpperCase())}
                            maxLength={6}
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
                            disabled={loading || code.length < 6}
                            className="px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                            Tham gia ngay
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
