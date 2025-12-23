"use client";

import { useState } from "react";
import { Mail, UserPlus, Loader2 } from "lucide-react";
import { inviteStudentAction } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import { DraggableModal } from "@/components/ui/DraggableModal";
import { ModalHeader } from "@/components/ui/ModalHeader";

interface InviteStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    classId: string;
    onSuccess?: () => void;
}

export default function InviteStudentModal({ isOpen, onClose, classId, onSuccess }: InviteStudentModalProps) {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const result = await inviteStudentAction(classId, email);

            if (result.success) {
                setSuccessMsg(result.message);
                setEmail("");
                if (onSuccess) onSuccess();
                // Close after a short delay to show success message
                setTimeout(() => {
                    onClose();
                    setSuccessMsg(null);
                }, 1500);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError("Có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DraggableModal isOpen={isOpen} onClose={onClose} className="max-w-md">
            {(dragControls) => (
                <>
                    <ModalHeader
                        title="Mời học sinh"
                        onClose={onClose}
                        dragControls={dragControls}
                    />

                    <div className="p-6">
                        <p className="text-gray-500 mb-6">Thêm thành viên mới vào lớp học của bạn</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email học sinh</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        placeholder="hocsinh@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <p className="mt-2 text-xs text-gray-500">Học sinh phải có tài khoản Miqix với email này.</p>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    {error}
                                </div>
                            )}

                            {successMsg && (
                                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-xl border border-green-100">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    {successMsg}
                                </div>
                            )}

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
                                    disabled={isLoading}
                                    className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Đang gửi...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" />
                                            <span>Gửi lời mời</span>
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
