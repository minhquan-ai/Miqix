"use client";

import { useState } from "react";
import { KeyRound, UserPlus, Loader2 } from "lucide-react";
import { joinClassAction } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { DraggableModal } from "@/components/ui/DraggableModal";
import { ModalHeader } from "@/components/ui/ModalHeader";

interface JoinClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onSuccess?: () => void;
}

export default function JoinClassModal({ isOpen, onClose, userId, onSuccess }: JoinClassModalProps) {
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();
    const router = useRouter();

    if (!isOpen) return null;

    const handleJoinClass = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await joinClassAction({
                classCode: code
            });

            if (result.success) {
                showToast(result.message, "success");
                setCode("");
                if (onSuccess) onSuccess();
                onClose();
                router.refresh();
            } else {
                showToast(result.message, "error");
            }
        } catch (error) {
            showToast("Có lỗi xảy ra khi tham gia lớp học", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DraggableModal isOpen={isOpen} onClose={onClose} className="max-w-md">
            {(dragControls) => (
                <>
                    <ModalHeader
                        title="Tham gia lớp học"
                        onClose={onClose}
                        dragControls={dragControls}
                        icon={<UserPlus className="w-5 h-5 text-white" />}
                    />

                    <div className="p-6">
                        <p className="text-gray-500 mb-6">Nhập mã lớp học do giáo viên cung cấp để tham gia.</p>

                        <form onSubmit={handleJoinClass} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mã lớp</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono uppercase tracking-wider"
                                        placeholder="VD: C_10A1"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    />
                                </div>
                                <p className="mt-2 text-xs text-gray-500">Mã lớp thường có 6-8 ký tự, ví dụ: C_10A1</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading || !code}
                                    className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Đang xử lý...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" />
                                            <span>Tham gia</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}
        </DraggableModal>
    );
}
