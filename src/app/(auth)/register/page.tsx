import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-md bg-card p-8 rounded-xl border border-border shadow-sm">
                <div className="flex flex-col items-center mb-8">
                    <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-primary mb-2">
                        <GraduationCap className="w-8 h-8" />
                        <span>Ergonix</span>
                    </Link>
                    <h1 className="text-xl font-semibold">Tạo tài khoản mới</h1>
                    <p className="text-sm text-muted-foreground">Bắt đầu hành trình học tập của bạn</p>
                </div>

                <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="name">Họ tên</label>
                            <input
                                id="name"
                                type="text"
                                placeholder="Nguyễn Văn A"
                                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="role">Vai trò</label>
                            <select
                                id="role"
                                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="student">Học sinh</option>
                                <option value="teacher">Giáo viên</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="password">Mật khẩu</label>
                        <input
                            id="password"
                            type="password"
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>

                    <Link href="/dashboard">
                        <button
                            type="button"
                            className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 transition-colors mt-2"
                        >
                            Đăng ký
                        </button>
                    </Link>
                </form>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                    Đã có tài khoản?{" "}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                        Đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    );
}
