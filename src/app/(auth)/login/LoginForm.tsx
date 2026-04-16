"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2, Sparkles, BookOpen, GraduationCap } from "lucide-react";
import { authenticate } from "@/lib/actions/auth-actions";
import { motion } from "framer-motion";

export function LoginForm() {
    const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('registered') === 'true') {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 5000);
            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <div className="w-full max-w-lg">
            {/* Logo & Branding */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F26C21] to-[#FF8A4C] flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-[#F26C21] to-[#00D9A5] bg-clip-text text-transparent">
                        MiQiX
                    </span>
                </Link>
            </motion.div>

            {/* Main Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100/50 p-8 md:p-10"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white mb-4 shadow-lg shadow-blue-500/25">
                        <GraduationCap className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Chào mừng trở lại!</h1>
                    <p className="text-gray-500 mt-2">Đăng nhập để tiếp tục hành trình học tập</p>
                </div>

                {/* Success message after registration */}
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-3 text-sm text-emerald-700 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-2xl mb-6 border border-emerald-200/50"
                    >
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                        <p className="font-medium">Đăng ký thành công! Hãy đăng nhập để tiếp tục.</p>
                    </motion.div>
                )}

                <form action={formAction} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700" htmlFor="email">Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-gray-200 bg-gray-50/50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700" htmlFor="password">Mật khẩu</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-gray-200 bg-gray-50/50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {errorMessage && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 text-sm text-red-600 bg-red-50 p-4 rounded-2xl border border-red-200/50"
                        >
                            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-4 h-4 text-white" />
                            </div>
                            <p className="font-medium">{errorMessage}</p>
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-gradient-to-r from-[#F26C21] to-[#FF8A4C] text-white h-14 px-6 rounded-2xl transition-all flex items-center justify-center font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                Đăng nhập
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-gray-500">
                        Chưa có tài khoản?{" "}
                        <Link href="/register" className="text-[#F26C21] hover:text-[#00D9A5] font-bold transition-colors">
                            Đăng ký ngay
                        </Link>
                    </p>
                </div>

                {/* Quick Demo Login */}
                <div className="mt-8 pt-8 border-t border-gray-100">
                    <p className="text-xs text-gray-400 text-center mb-4 uppercase tracking-widest font-bold">Tài khoản Demo</p>
                    <div className="grid grid-cols-2 gap-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => {
                                setEmail("demo@miqix.vn");
                                setPassword("Demo2026!");
                            }}
                            className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 rounded-2xl border border-blue-100 transition-all shadow-sm hover:shadow-md"
                        >
                            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center mb-2 shadow-sm">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wide">Giáo viên</span>
                            <span className="text-[10px] text-blue-500 mt-0.5">Trần Thị Hồng Hà</span>
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => {
                                setEmail("hocsinh@miqix.vn");
                                setPassword("Demo2026!");
                            }}
                            className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-700 rounded-2xl border border-emerald-100 transition-all shadow-sm hover:shadow-md"
                        >
                            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center mb-2 shadow-sm">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wide">Học sinh</span>
                            <span className="text-[10px] text-emerald-500 mt-0.5">Nguyễn Minh Quân</span>
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Footer */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center text-gray-400 text-sm mt-8"
            >
                © 2026 MiQiX. Nền tảng học tập thông minh.
            </motion.p>
        </div>
    );
}
