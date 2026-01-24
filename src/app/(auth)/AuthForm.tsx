"use client";

import { useActionState, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
    Mail, Lock, ArrowRight, Loader2, AlertCircle,
    CheckCircle2, Sparkles, GraduationCap, User,
    School, Check, X, Eye, EyeOff, BookOpen
} from "lucide-react";
import { authenticate, register } from "@/lib/auth-actions";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuthFormProps {
    initialMode?: "login" | "register";
}

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
        <div className={cn("flex items-center gap-2 text-[11px] transition-colors", met ? "text-emerald-600" : "text-gray-500")}>
            {met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            <span>{label}</span>
        </div>
    );
}

export function AuthForm({ initialMode = "login" }: AuthFormProps) {
    const [mode, setMode] = useState<"login" | "register">(initialMode);
    const [loginError, loginAction, isLoginPending] = useActionState(authenticate, undefined);
    const [registerError, registerAction, isRegisterPending] = useActionState(register, undefined);

    // Form states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState<"student" | "teacher">("student");
    const [showPassword, setShowPassword] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const strength = usePasswordStrength(password);
    const isPasswordValid = strength.hasMinLength && strength.hasUppercase && strength.hasLowercase && strength.hasNumber;

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('registered') === 'true') {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 5000);
            return () => clearTimeout(timer);
        }
    }, []);

    // Sync URL with mode
    useEffect(() => {
        const url = mode === "login" ? "/login" : "/register";
        if (window.location.pathname !== url) {
            window.history.pushState(null, "", url);
        }
    }, [mode]);

    const isPending = isLoginPending || isRegisterPending;
    const errorMessage = mode === "login" ? loginError : registerError;

    return (
        <div className="w-full max-w-lg mx-auto relative z-10">
            {/* Logo & Branding */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <Link href="/" className="inline-flex items-center gap-2 group">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        MiQiX
                    </span>
                </Link>
            </motion.div>

            {/* Main Card - Light Mode */}
            <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] overflow-hidden border border-gray-200 shadow-2xl shadow-gray-300/50">
                <div className="p-8 md:p-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={mode}
                            initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mb-4 border border-indigo-100">
                                    <GraduationCap className="w-8 h-8" />
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                                    {mode === "login" ? "Chào mừng trở lại!" : "Tạo tài khoản"}
                                </h1>
                                <p className="text-gray-600 mt-2 text-sm">
                                    {mode === "login"
                                        ? "Đăng nhập để tiếp tục hành trình học tập"
                                        : "Bắt đầu hành trình học tập của bạn"
                                    }
                                </p>
                            </div>

                            {/* Success message */}
                            {mode === "login" && showSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-3 text-sm text-emerald-700 bg-emerald-50 p-4 rounded-2xl mb-6 border border-emerald-200"
                                >
                                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                    </div>
                                    <p className="font-medium">Đăng ký thành công! Hãy đăng nhập.</p>
                                </motion.div>
                            )}

                            <form action={mode === "login" ? loginAction : registerAction} className="space-y-5">
                                <AnimatePresence mode="popLayout">
                                    {mode === "register" && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-5"
                                        >
                                            {/* Role Selector */}
                                            <div className="space-y-3">
                                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Bạn là:</label>
                                                <input type="hidden" name="role" value={role} />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div
                                                        onClick={() => setRole("student")}
                                                        className={cn(
                                                            "cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group",
                                                            role === "student" ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                                            role === "student" ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-600 group-hover:bg-gray-300"
                                                        )}>
                                                            <User className="w-5 h-5" />
                                                        </div>
                                                        <span className={cn("text-sm font-bold", role === "student" ? "text-gray-900" : "text-gray-600")}>
                                                            Học sinh
                                                        </span>
                                                    </div>
                                                    <div
                                                        onClick={() => setRole("teacher")}
                                                        className={cn(
                                                            "cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group",
                                                            role === "teacher" ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                                            role === "teacher" ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-600 group-hover:bg-gray-300"
                                                        )}>
                                                            <School className="w-5 h-5" />
                                                        </div>
                                                        <span className={cn("text-sm font-bold", role === "teacher" ? "text-gray-900" : "text-gray-600")}>
                                                            Giáo viên
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Name Input */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-gray-700" htmlFor="name">Họ và tên</label>
                                                <div className="relative group">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                                    <input
                                                        id="name"
                                                        name="name"
                                                        type="text"
                                                        placeholder="Nguyễn Văn A"
                                                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-gray-400"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        required={mode === "register"}
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Email Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700" htmlFor="email">Email</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-gray-400"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700" htmlFor="password">Mật khẩu</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-gray-400"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    {/* Password Strength */}
                                    <AnimatePresence>
                                        {mode === "register" && password.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="mt-3 grid grid-cols-2 gap-2 p-3 rounded-2xl bg-gray-50 border border-gray-200"
                                            >
                                                <PasswordRequirement met={strength.hasMinLength} label="8+ ký tự" />
                                                <PasswordRequirement met={strength.hasUppercase} label="Chữ hoa (A-Z)" />
                                                <PasswordRequirement met={strength.hasLowercase} label="Chữ thường (a-z)" />
                                                <PasswordRequirement met={strength.hasNumber} label="Số (0-9)" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {errorMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-3 text-sm text-rose-700 bg-rose-50 p-4 rounded-2xl border border-rose-200"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center flex-shrink-0">
                                            <AlertCircle className="w-4 h-4 text-white" />
                                        </div>
                                        <p className="font-medium">{errorMessage}</p>
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isPending || (mode === "register" && !isPasswordValid)}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:to-indigo-400 text-white h-14 px-6 rounded-2xl transition-all flex items-center justify-center font-bold text-base disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            {mode === "login" ? "Đang đăng nhập..." : "Đang tạo tài khoản..."}
                                        </>
                                    ) : (
                                        <>
                                            {mode === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 text-center">
                                <p className="text-gray-600 text-sm">
                                    {mode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
                                    <button
                                        onClick={() => setMode(mode === "login" ? "register" : "login")}
                                        className="text-indigo-600 hover:text-indigo-500 font-bold transition-colors ml-1"
                                    >
                                        {mode === "login" ? "Đăng ký ngay" : "Đăng nhập"}
                                    </button>
                                </p>
                            </div>

                            {/* Demo Accounts */}
                            {mode === "login" && (
                                <div className="mt-8 pt-8 border-t border-gray-200">
                                    <p className="text-[10px] text-gray-500 text-center mb-4 uppercase tracking-[0.2em] font-bold">Thử nghiệm nhanh</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEmail("demo@miqix.vn");
                                                setPassword("Demo2026!");
                                            }}
                                            className="flex flex-col items-center justify-center p-4 bg-blue-50 border border-blue-200 hover:border-blue-300 hover:bg-blue-100 text-blue-700 rounded-2xl transition-all group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                <BookOpen className="w-5 h-5" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wide">Giáo viên</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEmail("hocsinh@miqix.vn");
                                                setPassword("Demo2026!");
                                            }}
                                            className="flex flex-col items-center justify-center p-4 bg-emerald-50 border border-emerald-200 hover:border-emerald-300 hover:bg-emerald-100 text-emerald-700 rounded-2xl transition-all group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                <GraduationCap className="w-5 h-5" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wide">Học sinh</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-gray-500 text-[13px] mt-8"
            >
                © 2026 MiQiX. Nền tảng học tập thông minh dành cho bạn.
            </motion.p>
        </div>
    );
}
