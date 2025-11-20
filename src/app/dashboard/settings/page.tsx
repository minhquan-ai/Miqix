"use client";

import { useState } from "react";
import { Bell, Lock, LogOut, Moon, Shield, Smartphone, Database, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
    const router = useRouter();
    const [darkMode, setDarkMode] = useState(false);
    const [emailNotifs, setEmailNotifs] = useState(true);
    const { showToast } = useToast();

    const handleResetData = () => {
        if (confirm("Bạn có chắc chắn muốn đặt lại toàn bộ dữ liệu? Hành động này không thể hoàn tác.")) {
            // Clear all ergonix_ keys
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('ergonix_')) {
                    localStorage.removeItem(key);
                }
            });
            showToast("Đã đặt lại dữ liệu thành công", "success");
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('userRole');
        router.push('/login');
    };

    return (
        <div className="space-y-6 -m-8 p-8">
            <h1 className="text-2xl font-bold tracking-tight">Cài đặt</h1>
            <p className="text-muted-foreground">Quản lý tùy chọn ứng dụng và tài khoản của bạn.</p>

            {/* Appearance */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border bg-muted/30">
                    <h2 className="font-semibold flex items-center gap-2">
                        <Smartphone className="w-4 h-4" /> Giao diện
                    </h2>
                </div>
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
                                <Moon className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="font-medium">Chế độ tối</p>
                                <p className="text-sm text-muted-foreground">Chuyển sang giao diện tối để bảo vệ mắt.</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border bg-muted/30">
                    <h2 className="font-semibold flex items-center gap-2">
                        <Bell className="w-4 h-4" /> Thông báo
                    </h2>
                </div>
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-md">
                                <Bell className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="font-medium">Thông báo qua Email</p>
                                <p className="text-sm text-muted-foreground">Nhận email về bài tập mới và kết quả chấm điểm.</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={emailNotifs} onChange={() => setEmailNotifs(!emailNotifs)} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Security */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border bg-muted/30">
                    <h2 className="font-semibold flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Bảo mật
                    </h2>
                </div>
                <div className="p-4 space-y-4">
                    <button className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors text-left">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 text-green-600 rounded-md">
                                <Lock className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="font-medium">Đổi mật khẩu</p>
                                <p className="text-sm text-muted-foreground">Cập nhật mật khẩu định kỳ để bảo vệ tài khoản.</p>
                            </div>
                        </div>
                        <span className="text-xs bg-muted px-2 py-1 rounded border border-border">Sắp ra mắt</span>
                    </button>
                </div>
            </div>

            {/* Data Management */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border bg-muted/30">
                    <h2 className="font-semibold flex items-center gap-2">
                        <Database className="w-4 h-4" /> Dữ liệu
                    </h2>
                </div>
                <div className="p-4 space-y-4">
                    <button
                        onClick={handleResetData}
                        className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors text-left group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-md group-hover:bg-orange-200 transition-colors">
                                <RefreshCw className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="font-medium text-orange-700">Đặt lại dữ liệu Demo</p>
                                <p className="text-sm text-muted-foreground">Xóa toàn bộ dữ liệu đã tạo và khôi phục về trạng thái ban đầu.</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-6">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-3 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors font-medium"
                >
                    <LogOut className="w-4 h-4" /> Đăng xuất khỏi thiết bị
                </button>
            </div>
        </div>
    );
}
