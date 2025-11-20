"use client";

import { useEffect, useState } from "react";
import { DataService } from "@/lib/data";
import { User } from "@/types";
import { StudentProgressDashboard } from "@/components/features/StudentProgressDashboard";
import { ArrowLeft, Award, Shield, Star, Trophy, Zap, Medal, BookOpen, Briefcase, FileText, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AchievementsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const currentUser = await DataService.getCurrentUser();
                setUser(currentUser);
            } catch (error) {
                console.error("Failed to load user data", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) return <div className="p-8 text-center">Đang tải...</div>;
    if (!user) return <div className="p-8 text-center">Không tìm thấy thông tin người dùng.</div>;

    return (
        <div className="space-y-8 -m-6 p-8">
            {/* Header / Navigation */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {user.role === 'teacher' ? (
                            <>
                                <Medal className="w-6 h-6 text-blue-600" />
                                Hồ Sơ Năng Lực & Thi Đua
                            </>
                        ) : (
                            <>
                                <Trophy className="w-6 h-6 text-yellow-500" />
                                Thành Tích & Học Tập
                            </>
                        )}
                    </h1>
                    <p className="text-muted-foreground">
                        {user.role === 'teacher'
                            ? "Ghi nhận quá trình cống hiến và thành tích chuyên môn."
                            : "Theo dõi hành trình chinh phục tri thức của bạn."}
                    </p>
                </div>
            </div>

            {user.role === 'teacher' ? (
                <TeacherAchievements user={user} />
            ) : (
                <StudentAchievements user={user} />
            )}
        </div>
    );
}

function TeacherAchievements({ user }: { user: User }) {
    // Mock data for teacher achievements
    const teacherStats = {
        title: "Giáo viên Dạy giỏi cấp Tỉnh",
        yearsExperience: 12,
        initiatives: 5, // Sáng kiến kinh nghiệm
        demoLessons: 24, // Tiết hội giảng
        excellentStudents: 15, // HSG đạt giải
        emulationTitles: [
            { year: "2023-2024", title: "Chiến sĩ thi đua cơ sở", level: "Cấp Trường" },
            { year: "2022-2023", title: "Giáo viên dạy giỏi", level: "Cấp Tỉnh" },
            { year: "2021-2022", title: "Lao động tiên tiến", level: "Cấp Trường" },
            { year: "2020-2021", title: "Sáng kiến kinh nghiệm xuất sắc", level: "Cấp Sở" },
        ]
    };

    return (
        <div className="space-y-8">
            {/* Professional Status Hero */}
            <div className="bg-gradient-to-r from-blue-800 to-indigo-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Medal className="w-64 h-64" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
                    <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                        <Briefcase className="w-10 h-10 text-blue-100" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-blue-500/30 border border-blue-400/30 rounded-full text-xs font-medium uppercase tracking-wider">
                                Danh hiệu cao nhất
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-2">{teacherStats.title}</h2>
                        <p className="text-blue-100 text-lg flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            Thâm niên công tác: <span className="font-bold text-white">{teacherStats.yearsExperience} năm</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-3xl font-bold text-foreground">{teacherStats.initiatives}</h3>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Sáng kiến kinh nghiệm</p>
                    <p className="text-xs text-green-600 mt-2 bg-green-50 px-2 py-1 rounded">Đã được công nhận</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-3xl font-bold text-foreground">{teacherStats.demoLessons}</h3>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Tiết hội giảng</p>
                    <p className="text-xs text-purple-600 mt-2 bg-purple-50 px-2 py-1 rounded">Cấp Trường & Tỉnh</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
                        <Award className="w-6 h-6" />
                    </div>
                    <h3 className="text-3xl font-bold text-foreground">{teacherStats.excellentStudents}</h3>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Học sinh giỏi</p>
                    <p className="text-xs text-orange-600 mt-2 bg-orange-50 px-2 py-1 rounded">Đạt giải các cấp</p>
                </div>
            </div>

            {/* Emulation History Timeline */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Medal className="w-5 h-5 text-primary" />
                    Lịch sử Thi đua & Khen thưởng
                </h3>
                <div className="relative pl-8 border-l-2 border-muted space-y-8">
                    {teacherStats.emulationTitles.map((item, idx) => (
                        <div key={idx} className="relative">
                            <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-background border-4 border-primary" />
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                                <h4 className="text-lg font-bold text-foreground">{item.title}</h4>
                                <span className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground">
                                    Năm học {item.year}
                                </span>
                            </div>
                            <p className="text-sm text-primary font-medium">{item.level}</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Đã hoàn thành xuất sắc nhiệm vụ được giao, có nhiều đóng góp tích cực cho phong trào chung của nhà trường.
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StudentAchievements({ user }: { user: User }) {
    return (
        <div className="space-y-8">
            {/* Hero Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Level Card */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <Award className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-indigo-100 font-medium mb-1">Cấp độ hiện tại</p>
                        <h2 className="text-4xl font-bold mb-2">Level {user.level || 1}</h2>
                        <div className="w-full bg-black/20 rounded-full h-2 mb-2">
                            <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                        <p className="text-xs text-indigo-100">1,250 XP nữa để lên cấp tiếp theo</p>
                    </div>
                </div>

                {/* XP & Streak */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-blue-100 text-blue-600 rounded-full">
                            <Shield className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-muted-foreground font-medium">Tổng điểm XP</p>
                            <h3 className="text-3xl font-bold">{user.xp?.toLocaleString() || 0}</h3>
                            <p className="text-xs text-green-600 font-medium">+450 tuần này</p>
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-orange-100 text-orange-600 rounded-full">
                            <Zap className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-muted-foreground font-medium">Chuỗi học tập</p>
                            <h3 className="text-3xl font-bold">{user.streak || 0} ngày</h3>
                            <p className="text-xs text-orange-600 font-medium">Giữ vững phong độ nhé!</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content: Learning Journey */}
            <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/20">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Star className="w-5 h-5 text-primary" />
                        Hành Trình Học Tập
                    </h2>
                </div>
                <div className="p-6">
                    <StudentProgressDashboard studentId={user.id} />
                </div>
            </div>

            {/* Badges Collection (Placeholder for now) */}
            <div className="bg-card border border-border rounded-3xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Bộ Sưu Tập Huy Hiệu
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {[
                        { name: "Khởi đầu mới", icon: "🌱", color: "bg-green-100 text-green-700" },
                        { name: "Chăm chỉ", icon: "📚", color: "bg-blue-100 text-blue-700" },
                        { name: "Toán học", icon: "📐", color: "bg-purple-100 text-purple-700" },
                        { name: "Sáng tạo", icon: "🎨", color: "bg-pink-100 text-pink-700" },
                        { name: "Thần tốc", icon: "⚡", color: "bg-yellow-100 text-yellow-700" },
                        { name: "Locked", icon: "🔒", color: "bg-gray-100 text-gray-400" },
                    ].map((badge, idx) => (
                        <div key={idx} className={`flex flex-col items-center justify-center p-4 rounded-xl border border-transparent hover:border-border transition-all ${badge.color === 'bg-gray-100 text-gray-400' ? 'opacity-50' : 'hover:bg-muted/50'}`}>
                            <div className={`w-12 h-12 rounded-full ${badge.color} flex items-center justify-center text-2xl mb-2 shadow-sm`}>
                                {badge.icon}
                            </div>
                            <span className="text-xs font-medium text-center">{badge.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
