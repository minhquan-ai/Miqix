"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Loader2, GraduationCap } from "lucide-react";
import { DataService } from "@/lib/data";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Simulate login based on email
            // In a real app, this would be handled by the backend
            const role = email.includes("teacher") ? "teacher" : "student";
            await DataService.login(role);
            router.push("/dashboard");
        } catch (error) {
            console.error("Login failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-sm p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold">Đăng nhập</h1>
                    <p className="text-muted-foreground mt-2">Chào mừng bạn quay trở lại với Ergonix</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="email">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                            <input
                                id="email"
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
                            <Link href="#" className="text-xs text-primary hover:underline">Quên mật khẩu?</Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                            <input
                                id="password"
                                type="password"
                                className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 transition-colors mt-2 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Đăng nhập"}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <span className="text-muted-foreground">Chưa có tài khoản? </span>
                    <Link href="/register" className="font-medium text-primary hover:underline">
                        Đăng ký ngay
                    </Link>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-xs text-center text-muted-foreground mb-3 font-medium">ĐĂNG NHẬP NHANH (DÀNH CHO THỬ NGHIỆM)</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => { setEmail("student@ergonix.com"); setPassword("123456"); }}
                            className="flex flex-col items-center justify-center p-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary hover:border-primary/50 transition-all"
                        >
                            <span className="text-sm font-bold text-secondary-foreground">Học sinh</span>
                            <span className="text-[10px] text-muted-foreground">student@ergonix.com</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setEmail("teacher@ergonix.com"); setPassword("123456"); }}
                            className="flex flex-col items-center justify-center p-3 rounded-lg border border-border bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-200 transition-all"
                        >
                            <span className="text-sm font-bold text-indigo-700">Giáo viên</span>
                            <span className="text-[10px] text-indigo-600/80">teacher@ergonix.com</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
