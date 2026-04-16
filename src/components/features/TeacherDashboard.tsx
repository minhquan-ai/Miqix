"use client";

import { useEffect, useState } from "react";
import { LogOut, Calendar as CalendarIcon, FileText, CheckCircle, Users, BookOpen, BrainCircuit, GraduationCap, Zap } from "lucide-react";
import { logout } from "@/lib/actions/auth-actions";
import { useRouter } from "next/navigation";
import { Class, User } from "@/types";
import { getTeacherDashboardAnalyticsAction } from "@/lib/actions/analytics-actions";
import { getClassesAction } from "@/lib/actions";
import { NotificationBell } from "@/components/features/NotificationBell";
import { ClassCreatorModal } from "./ClassCreatorModal";
import { AssignmentCreatorModal } from "./AssignmentCreatorModal";
import { useToast } from "@/components/ui/Toast";
import QuickAccessGrid, { QuickAccessItem } from "@/components/dashboard/QuickAccessGrid";
import AtRiskWidget from "@/components/dashboard-widgets/AtRiskWidget";
import UpcomingWidget from "@/components/dashboard-widgets/UpcomingWidget";
import { ClassAnalytics } from "@/lib/analytics/class-analytics";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface TeacherDashboardProps {
    user: User;
    analytics: ClassAnalytics;
}

export function TeacherDashboard({ user, analytics }: TeacherDashboardProps) {
    const router = useRouter();
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [dashboardAnalytics, setDashboardAnalytics] = useState<ClassAnalytics>(analytics);
    const [showClassModal, setShowClassModal] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { showToast } = useToast();

    // -- Derived Stats for "Hub" --
    const totalStudents = classes.reduce((sum, cls) => sum + (cls.studentCount || 0), 0);

    const refreshData = async () => {
        const analyticsData = await getTeacherDashboardAnalyticsAction();
        setDashboardAnalytics(analyticsData);
        const teacherClasses = await getClassesAction();
        setClasses(teacherClasses);
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
        const loadData = async () => {
            const analyticsData = await getTeacherDashboardAnalyticsAction();
            setDashboardAnalytics(analyticsData);
            const teacherClasses = await getClassesAction();
            setClasses(teacherClasses);
            setLoading(false);
        };
        loadData();
    }, [user.id]);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    // Helper to get time of day greeting - CLIENT SIDE ONLY
    const getGreeting = () => {
        if (!mounted) return "Xin chào"; // Default server greeting
        const hour = new Date().getHours();
        if (hour < 12) return "Chào buổi sáng";
        if (hour < 18) return "Chào buổi chiều";
        return "Chào buổi tối";
    };

    const todayDate = mounted ? format(new Date(), "EEEE, d 'tháng' M", { locale: vi }) : "Hôm nay";

    // Define "Hub" Items
    const hubItems: QuickAccessItem[] = [
        {
            id: 'grading',
            label: 'Cần chấm điểm',
            icon: CheckCircle,
            href: '/dashboard/assignments?status=needs_grading',
            badge: dashboardAnalytics.ungradedCount > 0 ? dashboardAnalytics.ungradedCount : undefined,
            color: 'orange',
            description: 'Bài tập đang chờ xử lý'
        },
        {
            id: 'assignments',
            label: 'Quản lý Bài tập',
            icon: FileText,
            href: '/dashboard/assignments',
            color: 'indigo',
            description: 'Tạo và giao bài mới'
        },
        {
            id: 'students',
            label: 'Học sinh',
            icon: Users,
            href: '/dashboard/classes', // Ideally a dedicated students page, but classes works for now
            badge: dashboardAnalytics.atRiskStudents.length > 0 ? `${dashboardAnalytics.atRiskStudents.length}!` : undefined,
            color: 'blue',
            description: `${totalStudents} học sinh đang quản lý`
        },
        {
            id: 'resources',
            label: 'Kho Học liệu',
            icon: BookOpen,
            href: '/dashboard/resources', // Future Feature
            color: 'emerald',
            description: 'Tài liệu và đề thi'
        },
    ];

    return (
        <div className="flex-1 h-full overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-gray-200">
            <div className="max-w-7xl mx-auto space-y-8 pb-10">
                {/* 1. Hero Section - The "Control Tower" Header */}
                <motion.div variants={item} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5 w-full md:w-auto">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full border-4 border-indigo-50 overflow-hidden shadow-sm flex-shrink-0">
                            <img
                                src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                                alt={user.name}
                                className="w-full h-full object-cover bg-gray-100"
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {getGreeting()}, Thầy/Cô {user.name.split(' ').pop()}
                            </h1>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-md font-medium">
                                    <CalendarIcon className="w-3.5 h-3.5" />
                                    {todayDate}
                                </span>
                                <span className="hidden md:inline">•</span>
                                <span className="text-indigo-600 font-medium">Hôm nay có 3 tiết dạy (Sáng)</span>
                            </div>
                        </div>
                    </div>

                    {/* Top Actions */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        <button
                            onClick={() => setShowAssignmentModal(true)}
                            className="px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-semibold text-sm shadow-sm flex items-center gap-2"
                        >
                            <FileText className="w-4 h-4" />
                            <span>Tạo bài tập</span>
                        </button>
                        <NotificationBell userId={user.id} />
                        <button
                            onClick={handleLogout}
                            className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                            title="Đăng xuất"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="text-center py-20 text-muted-foreground">Đang tải dữ liệu trung tâm...</div>
                ) : (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="space-y-8"
                    >
                        {/* 2. The Hub - Quick Access Grid */}
                        <section>
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-amber-500" />
                                    Truy cập nhanh
                                </h3>
                                <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-lg">
                                    Dashboard v2.0
                                </span>
                            </div>
                            <QuickAccessGrid items={hubItems} />
                        </section>

                        {/* 3. The Pulse - Performance & Timeline Split */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Main: Performance Overview + "Invisible AI" */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                            <GraduationCap className="w-5 h-5 text-indigo-600" />
                                            Hiệu suất lớp học
                                        </h3>
                                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${dashboardAnalytics.scoreTrend === 'up' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
                                            }`}>
                                            {dashboardAnalytics.scoreTrend === 'up' ? '↗ Tăng trưởng' : '→ Ổn định'}
                                        </span>
                                    </div>


                                    {/* "Invisible AI" Insight Box */}
                                    <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-white rounded-xl p-4 border border-indigo-100/50 flex gap-4">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600 h-fit">
                                            <BrainCircuit className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-indigo-900 mb-1">AI Phân tích</h4>
                                            <p className="text-sm text-indigo-800/80 leading-relaxed">
                                                Điểm trung bình có xu hướng tăng nhẹ so với tuần trước.
                                                Tuy nhiên, lớp <strong>10A2</strong> có tỉ lệ nộp bài thấp (65%).
                                                Thầy nên nhắc nhở trước bài kiểm tra sắp tới.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Classes Quick List */}
                                {classes.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {classes.slice(0, 4).map(cls => (
                                            <div key={cls.id} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/classes/${cls.id}`)}>
                                                <div>
                                                    <div className="font-bold text-gray-900">{cls.name}</div>
                                                    <div className="text-xs text-gray-500">{cls.studentCount || 0} học sinh • {cls.code}</div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                                    <Users className="w-4 h-4" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right Sidebar: Timeline & Alerts */}
                            <div className="space-y-6">
                                {/* Students At Risk */}
                                {dashboardAnalytics.atRiskStudents.length > 0 && (
                                    <AtRiskWidget students={dashboardAnalytics.atRiskStudents} classId="all" />
                                )}

                                {/* Upcoming Timeline */}
                                <UpcomingWidget deadlines={dashboardAnalytics.upcomingDeadlines} classId="all" />
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Modals */}
                <ClassCreatorModal
                    isOpen={showClassModal}
                    onClose={() => setShowClassModal(false)}
                    onSuccess={refreshData}
                />
                <AssignmentCreatorModal
                    isOpen={showAssignmentModal}
                    onClose={() => setShowAssignmentModal(false)}
                    onSuccess={refreshData}
                />
            </div>
        </div>
    );
}
