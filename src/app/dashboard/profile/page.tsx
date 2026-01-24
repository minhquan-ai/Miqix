"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Mail, User as UserIcon, Calendar, Edit, Camera, Phone,
    Briefcase, GraduationCap, Settings, X, Save, Loader2,
    Trophy, Target, Flame, BookOpen, CheckCircle, Star,
    Building2, Zap, Clock, TrendingUp
} from "lucide-react";
import { getFullUserProfileAction, updateProfileAction } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import { formatScore } from "@/lib/score-utils";

interface ProfileData {
    id: string;
    name: string;
    email?: string;
    role: string;
    avatarUrl?: string | null;
    bio?: string | null;
    phoneNumber?: string | null;
    schoolName?: string | null;
    teachingSubjects: string[];
    createdAt: string;
    isOwnProfile: boolean;
    stats: {
        classCount?: number;
        studentCount?: number;
        assignmentCount?: number;
        submissionCount?: number;
        averageScore?: number;
        attendanceRate?: number;
        xp?: number;
        level?: number;
        streak?: number;
    };
}

export default function ProfilePage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [editForm, setEditForm] = useState({
        name: "",
        bio: "",
        phoneNumber: "",
        schoolName: "",
        teachingSubjects: ""
    });

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            const result = await getFullUserProfileAction();
            if (result.success && result.data) {
                setProfile(result.data);
                setEditForm({
                    name: result.data.name || "",
                    bio: result.data.bio || "",
                    phoneNumber: result.data.phoneNumber || "",
                    schoolName: result.data.schoolName || "",
                    teachingSubjects: result.data.teachingSubjects?.join(", ") || ""
                });
            } else {
                router.push('/login');
            }
        } catch (error) {
            console.error("Failed to load profile", error);
        } finally {
            setLoading(false);
        }
    }

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await updateProfileAction(editForm);
            if (result.success) {
                showToast("Đã cập nhật hồ sơ!", "success");
                setIsEditing(false);
                loadProfile();
            } else {
                showToast(result.message || "Có lỗi xảy ra", "error");
            }
        } catch (error) {
            showToast("Có lỗi xảy ra", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="page-container flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!profile) return null;

    const joinDate = new Date(profile.createdAt);
    const formattedJoinDate = joinDate.toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="page-container !p-0">
            <div className="pb-20">
                {/* Hero / Cover Section */}
                <div className="relative h-48 md:h-64 lg:h-80 w-full overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-800 transition-all duration-700 group-hover:scale-105">
                        <div className="absolute inset-0 opacity-20"
                            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>

                    {profile.isOwnProfile && (
                        <div className="absolute bottom-3 right-3 lg:bottom-6 lg:right-8 z-20">
                            <button
                                onClick={() => showToast("Tính năng đổi ảnh bìa đang phát triển", "info")}
                                className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md border border-white/20 transition-all text-xs md:text-sm font-medium hover:scale-105 active:scale-95"
                            >
                                <Camera className="w-3.5 h-3.5 md:w-4 h-4" />
                                <span className="hidden sm:inline">Đổi ảnh bìa</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="page-content px-0 sm:px-6 lg:px-8">
                    <div className="relative -mt-16 md:-mt-20">

                        {/* Main Profile Card */}
                        <div className="bg-white dark:bg-gray-900 border-y md:border border-gray-200 dark:border-gray-800 md:rounded-3xl p-6 md:p-10 shadow-xl relative overflow-hidden z-10 mb-5">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-8">
                                {/* Avatar Column */}
                                <div className="flex-shrink-0">
                                    <div className="relative group">
                                        <div className="w-20 h-20 md:w-32 lg:w-40 lg:h-40 rounded-full p-1 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 shadow-lg transition-transform group-hover:scale-105">
                                            <img
                                                src={profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`}
                                                alt={profile.name}
                                                className="w-full h-full rounded-full object-cover border-2 md:border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-900"
                                            />
                                        </div>
                                        {profile.isOwnProfile && (
                                            <button
                                                onClick={() => showToast("Tính năng đổi ảnh đại diện đang phát triển", "info")}
                                                className="absolute bottom-0 right-0 md:bottom-2 md:right-2 p-1.5 md:p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all border-2 border-white dark:border-gray-900"
                                            >
                                                <Camera className="w-3 md:w-4 h-3 md:h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Info Column */}
                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                        <div>
                                            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">{profile.name}</h1>
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                                {profile.role === 'teacher' ? (
                                                    <span className="px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[9px] md:text-xs font-bold flex items-center gap-1">
                                                        <Briefcase className="w-2.5 md:w-3.5 h-2.5 md:h-3.5" /> Giáo viên
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-[9px] md:text-xs font-bold flex items-center gap-1">
                                                        <GraduationCap className="w-2.5 md:w-3.5 h-2.5 md:h-3.5" /> Học sinh
                                                    </span>
                                                )}
                                                {profile.schoolName && (
                                                    <span className="px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[9px] md:text-xs font-medium flex items-center gap-1">
                                                        <Building2 className="w-2.5 md:w-3.5 h-2.5 md:h-3.5" /> {profile.schoolName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {profile.isOwnProfile && (
                                            <div className="flex gap-2 justify-center md:justify-end">
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2.5 bg-blue-600 text-white rounded-xl text-[11px] md:text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                                                >
                                                    <Edit className="w-3 md:w-4 h-3 md:h-4" />
                                                    Sửa hồ sơ
                                                </button>
                                                <button
                                                    onClick={() => router.push('/dashboard/settings')}
                                                    className="p-1.5 md:p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                                                >
                                                    <Settings className="w-3.5 h-3.5 md:w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Stats Bar - Fills empty space */}
                                    <div className="grid grid-cols-4 md:flex md:flex-wrap items-center gap-2 md:gap-4 mb-5">
                                        {profile.role === 'teacher' ? (
                                            <>
                                                <QuickStat icon={<BookOpen className="w-3 h-3" />} label="Lớp" value={profile.stats.classCount || 0} color="blue" />
                                                <QuickStat icon={<UserIcon className="w-3 h-3" />} label="HS" value={profile.stats.studentCount || 0} color="green" />
                                                <QuickStat icon={<Edit className="w-3 h-3" />} label="Bài" value={profile.stats.assignmentCount || 0} color="purple" />
                                                <QuickStat icon={<TrendingUp className="w-3 h-3" />} label="Rate" value="98%" color="indigo" />
                                            </>
                                        ) : (
                                            <>
                                                <QuickStat icon={<Star className="w-3 h-3 text-amber-500" />} label="Lvl" value={profile.stats.level || 1} color="amber" />
                                                <QuickStat icon={<Trophy className="w-3 h-3 text-yellow-500" />} label="Pts" value={formatScore(profile.stats.averageScore || 0)} color="yellow" />
                                                <QuickStat icon={<Flame className="w-3 h-3 text-orange-500" />} label="Strk" value={profile.stats.streak || 0} color="orange" />
                                                <QuickStat icon={<Zap className="w-3 h-3 text-blue-500" />} label="XP" value={profile.stats.xp || 0} color="blue" />
                                            </>
                                        )}
                                    </div>

                                    {/* Level Progress for Students inside card */}
                                    {profile.role === 'student' && (
                                        <div className="mb-5 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                                            <div className="flex justify-between items-center mb-1.5 px-1">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Tiến trình Level {profile.stats.level || 1}</span>
                                                <span className="text-[9px] font-bold text-indigo-600">{profile.stats.xp || 0} XP</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500"
                                                    style={{ width: `${((profile.stats.xp || 0) % 1000) / 10}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Contact Info - Compact 2 columns */}
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mt-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <ContactItem icon={<Mail className="w-3 h-3" />} label="Email" value={profile.email} />
                                        <ContactItem icon={<Calendar className="w-3 h-3" />} label="Tham gia" value={formattedJoinDate} />
                                        {profile.isOwnProfile && profile.phoneNumber && (
                                            <ContactItem icon={<Phone className="w-3 h-3" />} label="Phone" value={profile.phoneNumber} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Bio & Skills */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Bio Card */}
                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                                        <UserIcon className="w-5 h-5 text-blue-600" />
                                        Giới thiệu
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                                        {profile.bio || (
                                            <span className="text-gray-400 italic">
                                                {profile.isOwnProfile
                                                    ? "Chưa có thông tin giới thiệu. Nhấn 'Sửa hồ sơ' để cập nhật!"
                                                    : "Chưa có thông tin giới thiệu."}
                                            </span>
                                        )}
                                    </p>

                                    {/* Tags */}
                                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                                            {profile.role === 'teacher' ? 'Môn giảng dạy' : 'Sở thích & Kỹ năng'}
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.teachingSubjects.length > 0 ? (
                                                profile.teachingSubjects.map((tag) => (
                                                    <span key={tag} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium">
                                                        {tag}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">
                                                    {profile.isOwnProfile ? "Chưa cập nhật" : "Không có thông tin"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Activity/Achievements - Student Only */}
                                {profile.role === 'student' && (
                                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                                            <Trophy className="w-5 h-5 text-amber-500" />
                                            Thành tích & Hoạt động
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                                                <div className="text-2xl font-bold text-amber-600">{profile.stats.xp || 0}</div>
                                                <div className="text-xs text-gray-500 mt-1">Điểm XP</div>
                                            </div>
                                            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                                                <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
                                                    {profile.stats.streak || 0}
                                                    <Flame className="w-5 h-5" />
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">Ngày streak</div>
                                            </div>
                                            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                                <div className="text-2xl font-bold text-blue-600">{profile.stats.submissionCount || 0}</div>
                                                <div className="text-xs text-gray-500 mt-1">Bài đã nộp</div>
                                            </div>
                                            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                                <div className="text-2xl font-bold text-green-600">{profile.stats.attendanceRate || 0}%</div>
                                                <div className="text-xs text-gray-500 mt-1">Điểm danh</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Stats */}
                            <div className="space-y-6">
                                {/* Stats Card */}
                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                                    <h3 className="font-semibold text-sm mb-4 text-gray-400 uppercase tracking-wider">
                                        {profile.role === 'teacher' ? 'Thống kê giảng dạy' : 'Kết quả học tập'}
                                    </h3>
                                    <div className="space-y-4">
                                        {profile.role === 'teacher' ? (
                                            <>
                                                <StatItem
                                                    icon={<BookOpen className="w-5 h-5" />}
                                                    label="Lớp học"
                                                    value={profile.stats.classCount || 0}
                                                    color="blue"
                                                />
                                                <StatItem
                                                    icon={<UserIcon className="w-5 h-5" />}
                                                    label="Tổng học sinh"
                                                    value={profile.stats.studentCount || 0}
                                                    color="green"
                                                />
                                                <StatItem
                                                    icon={<CheckCircle className="w-5 h-5" />}
                                                    label="Bài tập đã tạo"
                                                    value={profile.stats.assignmentCount || 0}
                                                    color="purple"
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <StatItem
                                                    icon={<Trophy className="w-5 h-5" />}
                                                    label="Điểm trung bình"
                                                    value={formatScore(profile.stats.averageScore || 0) + "/10"}
                                                    color="yellow"
                                                />
                                                <StatItem
                                                    icon={<BookOpen className="w-5 h-5" />}
                                                    label="Lớp đang học"
                                                    value={profile.stats.classCount || 0}
                                                    color="blue"
                                                />
                                                <StatItem
                                                    icon={<Star className="w-5 h-5" />}
                                                    label="Level hiện tại"
                                                    value={profile.stats.level || 1}
                                                    color="amber"
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Level Progress - Student Only */}
                                {profile.role === 'student' && (
                                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Star className="w-5 h-5 text-yellow-300" />
                                                <span className="font-bold text-lg">Level {profile.stats.level || 1}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-sm bg-white/20 px-3 py-1 rounded-full">
                                                <Zap className="w-4 h-4" />
                                                {profile.stats.xp || 0} XP
                                            </div>
                                        </div>
                                        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500"
                                                style={{ width: `${((profile.stats.xp || 0) % 1000) / 10}%` }}
                                            />
                                        </div>
                                        <p className="text-xs mt-2 text-white/70">
                                            Cần thêm <span className="font-bold text-yellow-300">{1000 - ((profile.stats.xp || 0) % 1000)} XP</span> để lên level tiếp
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setIsEditing(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="sticky top-0 bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chỉnh sửa hồ sơ</h2>
                                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Họ và tên</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Giới thiệu bản thân</label>
                                    <textarea
                                        value={editForm.bio}
                                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                        rows={4}
                                        placeholder="Viết vài dòng giới thiệu về bản thân, sở thích, mục tiêu..."
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trường / Tổ chức</label>
                                    <input
                                        type="text"
                                        value={editForm.schoolName}
                                        onChange={(e) => setEditForm({ ...editForm, schoolName: e.target.value })}
                                        placeholder="VD: THPT Chuyên Hà Nội - Amsterdam"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {profile?.role === 'teacher' ? 'Môn giảng dạy' : 'Sở thích & Kỹ năng'}
                                        <span className="text-gray-400 font-normal ml-1">(ngăn cách bằng dấu phẩy)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.teachingSubjects}
                                        onChange={(e) => setEditForm({ ...editForm, teachingSubjects: e.target.value })}
                                        placeholder={profile?.role === 'teacher' ? "VD: Toán học, Vật lý, STEM" : "VD: Lập trình, Đọc sách, Bóng đá"}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Số điện thoại</label>
                                    <input
                                        type="tel"
                                        value={editForm.phoneNumber}
                                        onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                        placeholder="0912 345 678"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>

                            <div className="sticky bottom-0 bg-white dark:bg-gray-900 px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-5 py-2.5 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 disabled:opacity-70"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Lưu thay đổi
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function QuickStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
    const colorClasses: Record<string, string> = {
        blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100/50",
        green: "bg-green-50 dark:bg-green-900/20 text-green-600 border-green-100/50",
        purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 border-purple-100/50",
        yellow: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 border-yellow-100/50",
        amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100/50",
        orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-100/50",
        indigo: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-100/50"
    };

    return (
        <div className={`flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl border ${colorClasses[color]} transition-transform active:scale-95 flex-1 shadow-sm`}>
            <div className="mb-2 scale-125 md:scale-150">{icon}</div>
            <span className="text-lg md:text-2xl font-black leading-none">{value}</span>
            <span className="text-[10px] md:text-xs opacity-80 mt-1.5 uppercase font-bold tracking-wider">{label}</span>
        </div>
    );
}

function ContactItem({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
    return (
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700 w-full">
            <div className="p-2.5 rounded-xl bg-white dark:bg-gray-900 shadow-sm text-gray-500 scale-110">
                {icon}
            </div>
            <div className="text-left overflow-hidden">
                <p className="text-[10px] text-gray-400 leading-none mb-1.5 uppercase font-black tracking-widest">{label}</p>
                <p className="font-bold text-gray-800 dark:text-gray-200 truncate text-sm md:text-lg leading-tight">{value || "---"}</p>
            </div>
        </div>
    );
}

function StatItem({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
    const colorClasses: Record<string, string> = {
        blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
        purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
        yellow: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
        amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
    };

    return (
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${colorClasses[color]}`}>
                    {icon}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">{value}</span>
        </div>
    );
}
