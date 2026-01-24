"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Mail, User as UserIcon, MapPin, Calendar, Briefcase, GraduationCap,
    ArrowLeft, BookOpen, CheckCircle, Trophy, Target, Flame, Star, Loader2
} from "lucide-react";
import { getFullUserProfileAction } from "@/lib/actions";
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

export default function PublicProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadProfile() {
            try {
                const result = await getFullUserProfileAction(userId);
                if (result.success && result.data) {
                    setProfile(result.data);
                } else {
                    setError(result.message || "Không thể tải hồ sơ");
                }
            } catch (e) {
                setError("Có lỗi xảy ra");
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [userId]);

    if (loading) {
        return (
            <div className="page-container flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="page-container flex flex-col items-center justify-center min-h-[60vh]">
                <UserIcon className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy người dùng</h2>
                <p className="text-gray-500 mb-4">{error}</p>
                <button onClick={() => router.back()} className="px-4 py-2 bg-primary text-white rounded-lg">
                    Quay lại
                </button>
            </div>
        );
    }

    // If viewing own profile, redirect to main profile page
    if (profile.isOwnProfile) {
        router.replace('/dashboard/profile');
        return null;
    }

    const joinDate = new Date(profile.createdAt);
    const formattedJoinDate = `T${joinDate.getMonth() + 1}/${joinDate.getFullYear()}`;

    return (
        <div className="page-container !p-0">
            <div className="pb-20">
                {/* Header with back button */}
                <div className="px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Quay lại</span>
                    </button>
                </div>

                {/* Cover Section */}
                <div className="relative h-48 lg:h-64 w-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-800">
                        <div className="absolute inset-0 opacity-20"
                            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                </div>

                <div className="page-content px-4 sm:px-6 lg:px-8">
                    <div className="relative -mt-16">

                        {/* Profile Card */}
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 lg:p-8 shadow-xl relative overflow-hidden z-10 mb-8">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                            <div className="flex flex-col md:flex-row items-start gap-6 lg:gap-8">
                                {/* Avatar */}
                                <div className="flex-shrink-0 mx-auto md:mx-0">
                                    <div className="w-28 h-28 lg:w-36 lg:h-36 rounded-full p-1 bg-gradient-to-br from-blue-100 to-purple-100 shadow-lg">
                                        <img
                                            src={profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`}
                                            alt={profile.name}
                                            className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-900 bg-white"
                                        />
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 text-center md:text-left">
                                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">{profile.name}</h1>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
                                        {profile.role === 'teacher' ? (
                                            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5">
                                                <Briefcase className="w-3.5 h-3.5" /> Giáo viên
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center gap-1.5">
                                                <GraduationCap className="w-3.5 h-3.5" /> Học sinh
                                            </span>
                                        )}
                                        {profile.schoolName && (
                                            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5" /> {profile.schoolName}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4" />
                                            Tham gia {formattedJoinDate}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Bio */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-900">
                                        <UserIcon className="w-5 h-5 text-blue-600" />
                                        Giới thiệu
                                    </h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        {profile.bio || "Người dùng chưa cập nhật thông tin giới thiệu."}
                                    </p>

                                    {profile.teachingSubjects.length > 0 && (
                                        <div className="mt-6">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                                                {profile.role === 'teacher' ? 'Chuyên môn' : 'Sở thích'}
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.teachingSubjects.map((tag) => (
                                                    <span key={tag} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium border border-gray-100">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                                    <h3 className="font-semibold text-sm mb-4 text-gray-400 uppercase tracking-wider">
                                        Thống kê
                                    </h3>
                                    <div className="space-y-4">
                                        {profile.role === 'teacher' ? (
                                            <>
                                                <StatRow icon={<BookOpen className="w-4 h-4" />} label="Lớp học" value={profile.stats.classCount || 0} color="blue" />
                                                <StatRow icon={<UserIcon className="w-4 h-4" />} label="Học sinh" value={profile.stats.studentCount || 0} color="green" />
                                            </>
                                        ) : (
                                            <>
                                                <StatRow icon={<Trophy className="w-4 h-4" />} label="Level" value={profile.stats.level || 1} color="yellow" />
                                                <StatRow icon={<BookOpen className="w-4 h-4" />} label="Lớp tham gia" value={profile.stats.classCount || 0} color="blue" />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatRow({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
    const bgColors: Record<string, string> = {
        blue: "bg-blue-100 text-blue-600",
        green: "bg-green-100 text-green-600",
        purple: "bg-purple-100 text-purple-600",
        yellow: "bg-yellow-100 text-yellow-600"
    };

    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${bgColors[color]}`}>
                    {icon}
                </div>
                <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
            <span className="font-bold text-gray-900">{value}</span>
        </div>
    );
}
