"use client";

import Link from "next/link";
import { useActionState, useState, useMemo } from "react";
import { GraduationCap, School, User, ArrowRight, Loader2, AlertCircle, Check, X } from "lucide-react";
import { register } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";

// Password requirement checker
function usePasswordStrength(password: string) {
    return useMemo(() => ({
        hasMinLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
    }), [password]);
}

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
    return (
        <div className={cn("flex items-center gap-2 text-xs transition-colors", met ? "text-green-600" : "text-muted-foreground")}>
            {met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            <span>{label}</span>
        </div>
    );
}

export default function RegisterPage() {
    const [errorMessage, formAction, isPending] = useActionState(register, undefined);
    const [role, setRole] = useState<"student" | "teacher">("student");
    const [password, setPassword] = useState("");

    const strength = usePasswordStrength(password);
    const isPasswordValid = strength.hasMinLength && strength.hasUppercase && strength.hasLowercase && strength.hasNumber;

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-sm p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold">Tạo tài khoản</h1>
                    <p className="text-muted-foreground mt-2">Bắt đầu hành trình học tập của bạn</p>
                </div>

                <form action={formAction} className="space-y-4">
                    <input type="hidden" name="role" value={role} />

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Bạn là:</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                className={cn(
                                    "cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all hover:bg-secondary/50",
                                    role === 'student' ? "border-primary bg-primary/5" : "border-border bg-background"
                                )}
                                onClick={() => setRole('student')}
                            >
                                <User className={cn("h-6 w-6", role === 'student' ? "text-primary" : "text-muted-foreground")} />
                                <span className={cn("text-sm font-medium", role === 'student' ? "text-primary" : "text-foreground")}>Học sinh</span>
                            </div>
                            <div
                                className={cn(
                                    "cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all hover:bg-secondary/50",
                                    role === 'teacher' ? "border-primary bg-primary/5" : "border-border bg-background"
                                )}
                                onClick={() => setRole('teacher')}
                            >
                                <School className={cn("h-6 w-6", role === 'teacher' ? "text-primary" : "text-muted-foreground")} />
                                <span className={cn("text-sm font-medium", role === 'teacher' ? "text-primary" : "text-foreground")}>Giáo viên</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="name">Họ và tên</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Nguyễn Văn A"
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="name@example.com"
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="password">Mật khẩu</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        {/* Password Strength Indicator */}
                        {password.length > 0 && (
                            <div className="mt-2 p-3 rounded-lg bg-muted/50 space-y-1.5">
                                <PasswordRequirement met={strength.hasMinLength} label="Ít nhất 8 ký tự" />
                                <PasswordRequirement met={strength.hasUppercase} label="Có chữ hoa (A-Z)" />
                                <PasswordRequirement met={strength.hasLowercase} label="Có chữ thường (a-z)" />
                                <PasswordRequirement met={strength.hasNumber} label="Có số (0-9)" />

                                {isPasswordValid && (
                                    <div className="flex items-center gap-2 text-xs text-green-600 font-medium pt-1 border-t border-border mt-2">
                                        <Check className="h-4 w-4" />
                                        <span>Mật khẩu đủ mạnh!</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {errorMessage && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <p>{errorMessage}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending || !isPasswordValid}
                        className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-medium hover:bg-primary/90 transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Đăng ký tài khoản"}
                        {!isPending && <ArrowRight className="w-4 h-4" />}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <span className="text-muted-foreground">Đã có tài khoản? </span>
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        Đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    );
}
