"use client";

import { useState } from "react";
import { Bell, Lock, LogOut, Moon, Shield, Smartphone, Database, RefreshCw } from "lucide-react";
import { logout } from "@/lib/auth-actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
    const router = useRouter();
    const [darkMode, setDarkMode] = useState(false);
    const [emailNotifs, setEmailNotifs] = useState(true);
    const { showToast } = useToast();

    const handleResetData = () => {
        if (confirm("Bạn có chắc chắn muốn đặt lại toàn bộ dữ liệu? Hành động này không thể hoàn tác.")) {
            // Clear all miqix_ keys
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('miqix_')) {
                    localStorage.removeItem(key);
                }
            });
            showToast("Đã đặt lại dữ liệu thành công", "success");
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="flex-1 h-full overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-gray-200">
            <div className="max-w-4xl mx-auto space-y-6 pb-20">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Cài đặt</h1>
                    <p className="text-gray-500 dark:text-gray-400">Quản lý tùy chọn ứng dụng và tài khoản của bạn.</p>
                </div>

                {/* Appearance */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                        <h2 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                            <Smartphone className="w-4 h-4 text-blue-500" /> Giao diện
                        </h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                                    <Moon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">Chế độ tối</p>
                                    <p className="text-sm text-gray-500">Chuyển sang giao diện tối để bảo vệ mắt.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                        <h2 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                            <Bell className="w-4 h-4 text-amber-500" /> Thông báo
                        </h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
                                    <Bell className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">Thông báo qua Email</p>
                                    <p className="text-sm text-gray-500">Nhận email về bài tập mới và kết quả chấm điểm.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={emailNotifs} onChange={() => setEmailNotifs(!emailNotifs)} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Security */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                        <h2 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                            <Shield className="w-4 h-4 text-emerald-500" /> Bảo mật
                        </h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-all text-left group">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-105 transition-transform">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">Đổi mật khẩu</p>
                                    <p className="text-sm text-gray-500">Cập nhật mật khẩu định kỳ để bảo vệ tài khoản.</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500">Sắp ra mắt</span>
                        </button>
                    </div>
                </div>

                {/* Data Management */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                        <h2 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                            <Database className="w-4 h-4 text-orange-500" /> Dữ liệu
                        </h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <button
                            onClick={handleResetData}
                            className="w-full flex items-center justify-between p-4 hover:bg-orange-50 dark:hover:bg-orange-900/10 rounded-2xl transition-all text-left group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl group-hover:scale-105 transition-transform">
                                    <RefreshCw className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-orange-700 dark:text-orange-500">Đặt lại dữ liệu Demo</p>
                                    <p className="text-sm text-gray-500">Xóa toàn bộ dữ liệu đã tạo và khôi phục về trạng thái ban đầu.</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="pt-6">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 p-4 text-red-600 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-2xl transition-all font-bold shadow-sm active:scale-[0.98]"
                    >
                        <LogOut className="w-5 h-5" /> Đăng xuất khỏi thiết bị
                    </button>
                </div>
            </div>
        </div>
    );
}
