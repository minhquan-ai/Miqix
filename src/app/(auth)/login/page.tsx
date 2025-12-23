"use client";

import { useActionState, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Lock, ArrowRight, Loader2, GraduationCap, AlertCircle, CheckCircle2 } from "lucide-react";
import { authenticate } from "@/lib/auth-actions";

function LoginForm() {
    const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const searchParams = useSearchParams();
    const justRegistered = searchParams.get('registered') === 'true';
    const [showSuccess, setShowSuccess] = useState(justRegistered);

    // Hide success message after 5 seconds
    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => setShowSuccess(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    return (
        <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-sm p-8">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                    <GraduationCap className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold">Đăng nhập</h1>
                <p className="text-muted-foreground mt-2">Chào mừng bạn quay trở lại với Miqix</p>
            </div>

            {/* Success message after registration */}
            {showSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg mb-4 border border-green-200">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <p>Đăng ký thành công! Hãy đăng nhập để tiếp tục.</p>
                </div>
            )}

            <form action={formAction} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="email">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="name@example.com"
                            className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium" htmlFor="password">Mật khẩu</label>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {errorMessage && (
                    <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-200 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-4 h-4" />
                        <p>{errorMessage}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md transition-colors flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Đang xử lý...
                        </>
                    ) : (
                        <>
                            Đăng nhập
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 text-center text-sm">
                <p className="text-muted-foreground">
                    Chưa có tài khoản?{" "}
                    <Link href="/register" className="text-primary hover:underline font-medium">
                        Đăng ký ngay
                    </Link>
                </p>
            </div>

            {/* Quick Demo Login Buttons */}
            <div className="mt-8 pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground text-center mb-3 uppercase tracking-wider font-semibold">Tài khoản Demo</p>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            setEmail("teacher@ergonix.edu.vn");
                            setPassword("password123");
                        }}
                        className="flex items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors text-xs font-bold uppercase tracking-wide"
                    >
                        Giáo viên
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setEmail("student1@ergonix.edu.vn");
                            setPassword("password123");
                        }}
                        className="flex items-center justify-center p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors text-xs font-bold uppercase tracking-wide"
                    >
                        Học sinh
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
            <Suspense fallback={<div className="flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
