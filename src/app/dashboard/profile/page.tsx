"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Award, BookOpen, CheckCircle, Mail, Shield, User as UserIcon,
    MapPin, Link as LinkIcon, Calendar, Edit, Camera, Phone, Globe,
    Briefcase, GraduationCap, Star, Clock, ChevronRight, Settings,
    LogOut
} from "lucide-react";
import { DataService } from "@/lib/data";
import { getCurrentUserAction } from "@/lib/actions";
import { User } from "@/types";
import { motion } from "framer-motion";

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const currentUser = await getCurrentUserAction();
                if (!currentUser) {
                    router.push('/login');
                    return;
                }
                setUser(currentUser);
            } catch (error) {
                console.error("Failed to load profile", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [router]);

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (!isEditing) {
            alert("Chế độ chỉnh sửa đang được phát triển!");
        }
    };

    const handleSettingsClick = () => {
        router.push('/dashboard/settings');
    };

    const handleChangeCover = () => {
        alert("Tính năng đổi ảnh bìa đang được cập nhật!");
    };


    if (loading) return <div className="p-8 text-center">Đang tải...</div>;
    if (!user) return null;

    return (
        <div className="-m-6">
            {/* Hero / Cover Section */}
            <div className="relative h-64 lg:h-80 w-full overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-800 transition-all duration-700 group-hover:scale-105">
                    {/* Abstract Pattern Overlay */}
                    <div className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                {/* Cover Actions */}
                <div className="absolute bottom-4 right-4 lg:bottom-6 lg:right-8 z-20">
                    <button
                        onClick={handleChangeCover}
                        className="flex items-center gap-2 px-4 py-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md border border-white/20 transition-all text-sm font-medium hover:scale-105 active:scale-95"
                    >
                        <Camera className="w-4 h-4" />
                        <span className="hidden sm:inline">Đổi ảnh bìa</span>
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <div className="relative -mt-20">

                    {/* Main Profile Card */}
                    <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl p-6 lg:p-8 shadow-xl relative overflow-hidden z-10 mb-8">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                        <div className="flex flex-col md:flex-row items-start gap-6 lg:gap-8">
                            {/* Avatar Column */}
                            <div className="flex-shrink-0 mx-auto md:mx-0">
                                <div className="relative group">
                                    <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full p-1 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 shadow-lg transition-transform group-hover:scale-105">
                                        <img
                                            src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                                            alt={user.name}
                                            className="w-full h-full rounded-full object-cover border-4 border-background bg-background"
                                        />
                                    </div>
                                    <button
                                        onClick={handleChangeCover}
                                        className="absolute bottom-2 right-2 p-2.5 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-110 active:scale-90 border-2 border-background"
                                        title="Đổi ảnh đại diện"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Info Column */}
                            <div className="flex-1 text-center md:text-left pt-2">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div>
                                        <h1 className="text-3xl font-bold text-foreground mb-2">{user.name}</h1>
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                            {user.role === 'teacher' ? (
                                                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5">
                                                    <Briefcase className="w-3.5 h-3.5" /> Giáo viên
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5">
                                                    <GraduationCap className="w-3.5 h-3.5" /> Học sinh
                                                </span>
                                            )}
                                            <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5" /> Hà Nội
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 justify-center md:justify-end">
                                        <button
                                            onClick={handleEditToggle}
                                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95 ${isEditing
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                }`}
                                        >
                                            <Edit className="w-4 h-4" />
                                            {isEditing ? 'Lưu' : 'Sửa hồ sơ'}
                                        </button>
                                        <button
                                            onClick={handleSettingsClick}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-xl text-sm font-semibold hover:bg-secondary/80 transition-all shadow-sm hover:shadow-md active:scale-95"
                                        >
                                            <Settings className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/50">
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted/50">
                                        <div className="p-2 rounded-lg bg-primary/5 text-primary">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <span className="truncate font-medium">{user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted/50">
                                        <div className="p-2 rounded-lg bg-primary/5 text-primary">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium">Tham gia T11/2024</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Bio & Skills */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <UserIcon className="w-5 h-5 text-primary" />
                                    Giới thiệu
                                </h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {user.role === 'teacher'
                                        ? "Đam mê giảng dạy và truyền cảm hứng cho học sinh. Luôn tìm kiếm những phương pháp giáo dục mới mẻ và hiệu quả để giúp học sinh phát huy tối đa tiềm năng."
                                        : "Học sinh chăm chỉ, yêu thích khám phá kiến thức mới. Mục tiêu là đạt kết quả cao trong kỳ thi sắp tới và theo đuổi đam mê công nghệ."}
                                </p>

                                <div className="mt-6">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                                        {user.role === 'teacher' ? 'Chuyên môn' : 'Sở thích'}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {(user.role === 'teacher' ? ['Toán học', 'Vật lý', 'STEM', 'Mentoring'] : ['Lập trình', 'Toán học', 'Đọc sách', 'Bóng đá']).map((tag) => (
                                            <span key={tag} className="px-3 py-1 bg-muted hover:bg-muted/80 transition-colors text-foreground/80 rounded-lg text-xs font-medium cursor-default border border-border">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Quick Links & Mini Stats */}
                        <div className="space-y-6">

                            {/* Teacher Stats (Only for Teachers) */}
                            {user.role === 'teacher' && (
                                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                                    <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">Thống kê giảng dạy</h3>
                                    <div className="space-y-4">
                                        <TeacherStats user={user} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TeacherStats({ user }: { user: User }) {
    const [stats, setStats] = useState({ classes: 0, students: 0, assignments: 0 });

    useEffect(() => {
        async function loadStats() {
            const classes = await DataService.getClasses();
            const assignments = await DataService.getAssignments();

            // Parallel fetch for students
            const studentsPromises = classes.map(cls => DataService.getClassMembers(cls.id));
            const studentsArrays = await Promise.all(studentsPromises);
            const totalStudents = studentsArrays.flat().length;

            setStats({
                classes: classes.length,
                students: totalStudents,
                assignments: assignments.length
            });
        }
        loadStats();
    }, [user.id]);

    return (
        <>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <BookOpen className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Lớp học</span>
                </div>
                <span className="font-bold">{stats.classes}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                        <UserIcon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Học sinh</span>
                </div>
                <span className="font-bold">{stats.students}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Bài tập</span>
                </div>
                <span className="font-bold">{stats.assignments}</span>
            </div>
        </>
    );
}
