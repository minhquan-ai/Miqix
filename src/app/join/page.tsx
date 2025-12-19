"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Key } from "lucide-react";
import { joinClassAction, getCurrentUserAction } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import { useEffect, Suspense } from "react";

function JoinClassPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { showToast } = useToast();

    const [classCode, setClassCode] = useState("");
    const [joining, setJoining] = useState(false);

    // Auto-fill and join if code is in URL
    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            const cleanCode = code.toUpperCase();
            setClassCode(cleanCode);
        }
    }, [searchParams]);

    // Separate effect to trigger join once classCode is set from URL
    useEffect(() => {
        const codeFromUrl = searchParams.get('code');
        if (codeFromUrl && classCode === codeFromUrl.toUpperCase() && !joining) {
            handleJoin();
        }
    }, [classCode, searchParams]);

    const handleJoin = async () => {
        if (!classCode.trim()) {
            showToast("Vui lòng nhập mã lớp", "error");
            return;
        }

        setJoining(true);
        try {
            const currentUser = await getCurrentUserAction();
            if (!currentUser) {
                showToast("Vui lòng đăng nhập", "error");
                router.push("/");
                return;
            }

            const result = await joinClassAction({ classCode: classCode.trim() });

            if (result.success) {
                showToast(result.message, "success");
                // Redirect to the class page or dashboard
                if (result.status === 'active' && result.classId) {
                    setTimeout(() => {
                        router.push(`/dashboard/classes/${result.classId}`);
                    }, 1500);
                } else {
                    setTimeout(() => {
                        router.push("/dashboard/classes");
                    }, 1500);
                }
            } else {
                showToast(result.message, "error");
            }
        } catch (error) {
            console.error("Join class error:", error);
            showToast("Có lỗi xảy ra. Vui lòng thử lại.", "error");
        } finally {
            setJoining(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !joining) {
            handleJoin();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Back button */}
                <button
                    onClick={() => router.back()}
                    className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Quay lại</span>
                </button>

                {/* Main card */}
                <div className="bg-white rounded-2xl shadow-xl border border-border overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                <Key className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Tham gia lớp học</h1>
                                <p className="text-indigo-100 text-sm">Nhập mã lớp để bắt đầu</p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="p-8 space-y-6">
                        {/* Class Code Input */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Mã lớp học <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={classCode}
                                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                                onKeyPress={handleKeyPress}
                                placeholder="VD: ABC123"
                                maxLength={8}
                                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-mono tracking-wider uppercase text-center"
                                disabled={joining}
                            />
                            <p className="mt-2 text-xs text-muted-foreground">
                                Mã lớp do giáo viên cung cấp (6-8 ký tự)
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleJoin}
                            disabled={joining || !classCode.trim()}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {joining ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Đang tham gia...</span>
                                </>
                            ) : (
                                <>
                                    <Key className="w-4 h-4" />
                                    <span>Tham gia lớp học</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Help text */}
                <div className="mt-6 text-center text-sm text-muted-foreground">
                    <p>Không có mã lớp?</p>
                    <p className="mt-1">Liên hệ giáo viên để nhận mã từ lớp học</p>
                </div>
            </div>
        </div>
    );
}

export default function JoinClassPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <JoinClassPageContent />
        </Suspense>
    );
}
