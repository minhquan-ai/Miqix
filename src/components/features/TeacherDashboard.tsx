import { useEffect, useState } from "react";
import { LogOut, Plus, Search, Users, BookOpen, CheckCircle, TrendingUp, Bell, Clock, FileText, Target } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Assignment, Class, Submission, User } from "@/types";
import { DataService } from "@/lib/data";
import { ClassCard } from "./ClassCard";
import { NotificationBell } from "@/components/features/NotificationBell";
import { CreateClassModal } from "@/components/features/CreateClassModal";

interface TeacherDashboardProps {
    user: User;
    assignments: Assignment[];
    submissions: Submission[];
}

export function TeacherDashboard({ user, assignments, submissions }: TeacherDashboardProps) {
    const router = useRouter();
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<User[]>([]);

    const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);

    useEffect(() => {
        async function loadData() {
            const teacherClasses = await DataService.getClasses(user.id);
            setClasses(teacherClasses);

            // Load all students for global stats in parallel
            const studentsPromises = teacherClasses.map(cls => DataService.getClassMembers(cls.id));
            const studentsArrays = await Promise.all(studentsPromises);
            const allStudents = studentsArrays.flat();

            setStudents(allStudents);
            setLoading(false);
        }
        loadData();
    }, [user.id]);

    const handleLogout = () => {
        localStorage.removeItem('userRole');
        router.push('/login');
    };

    // --- Global Stats Calculation ---
    const totalStudents = students.length;
    const activeAssignments = assignments.filter(a => a.status === 'open').length;
    const pendingGrading = submissions.filter(s => s.status === 'submitted').length;

    const gradedSubmissions = submissions.filter(s => s.status === 'graded' && s.score !== undefined);
    const globalAverageScore = gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((a, b) => a + b.score!, 0) / gradedSubmissions.length
        : 0;

    // --- Recent Activity ---
    const recentSubmissions = [...submissions]
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, 5);

    // Helper to calculate class stats (reused)
    const getClassStats = (classId: string) => {
        const classAssignments = assignments.filter(a => a.classIds.includes(classId));
        const activeCount = classAssignments.filter(a => a.status === 'open').length;

        const classSubmissions = submissions.filter(s => {
            const assignment = assignments.find(a => a.id === s.assignmentId);
            return assignment?.classIds.includes(classId);
        });

        const graded = classSubmissions.filter(s => s.status === 'graded' && s.score !== undefined);
        const avg = graded.length > 0
            ? graded.reduce((a, b) => a + b.score!, 0) / graded.length
            : 0;

        return { activeAssignments: activeCount, averageScore: avg };
    };

    return (
        <div className="space-y-8">
            {/* 1. Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Xin chào, {user.name}! 👋</h2>
                    <p className="text-muted-foreground">Đây là tổng quan hoạt động giảng dạy của bạn hôm nay.</p>
                </div>
                <div className="flex items-center gap-3">
                    <NotificationBell userId={user.id} />
                    <button
                        onClick={handleLogout}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                        title="Đăng xuất"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* 2. Stats Overview Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Tổng học sinh"
                    value={totalStudents.toString()}
                    icon={<Users className="w-4 h-4 text-blue-500" />}
                    trend="+5 tuần này"
                />
                <StatCard
                    title="Bài tập đang mở"
                    value={activeAssignments.toString()}
                    icon={<BookOpen className="w-4 h-4 text-orange-500" />}
                    description="Đang chờ nộp"
                />
                <StatCard
                    title="Cần chấm điểm"
                    value={pendingGrading.toString()}
                    icon={<CheckCircle className="w-4 h-4 text-green-500" />}
                    description="Bài nộp mới"
                    highlight={pendingGrading > 0}
                />
                <StatCard
                    title="Điểm trung bình"
                    value={globalAverageScore.toFixed(1)}
                    icon={<TrendingUp className="w-4 h-4 text-purple-500" />}
                    description="Trên tất cả các lớp"
                />
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* 3. Main Content (Left - 2/3) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Class Overview Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                Lớp học của bạn
                            </h3>
                            <Link href="/dashboard/classes">
                                <button className="text-sm text-primary hover:underline">Xem tất cả</button>
                            </Link>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">Đang tải danh sách lớp...</div>
                        ) : classes.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/30">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Chưa có lớp học nào</h3>
                                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                    Bắt đầu bằng cách tạo lớp học đầu tiên để quản lý học sinh và bài tập.
                                </p>
                                <Link href="/dashboard/classes/create">
                                    <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        Tạo lớp ngay
                                    </button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2">
                                {classes.slice(0, 4).map(cls => {
                                    const stats = getClassStats(cls.id);
                                    return (
                                        <ClassCard
                                            key={cls.id}
                                            classData={cls}
                                            activeAssignments={stats.activeAssignments}
                                            averageScore={stats.averageScore}
                                        />
                                    );
                                })}

                            </div>
                        )}
                    </div>

                    {/* Quick Actions / Features */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            Tính năng & Công cụ
                        </h3>
                        <div className="grid gap-4 md:grid-cols-3">
                            <Link href="/dashboard/teacher-missions">
                                <div className="bg-card p-4 rounded-xl border border-border hover:border-primary transition-colors cursor-pointer h-full">
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
                                        <Target className="w-5 h-5" />
                                    </div>
                                    <h4 className="font-semibold mb-1">Nhiệm vụ giáo viên</h4>
                                    <p className="text-xs text-muted-foreground">Quản lý nhiệm vụ giảng dạy và hành chính.</p>
                                </div>
                            </Link>
                            <Link href="/dashboard/assignments/create">
                                <div className="bg-card p-4 rounded-xl border border-border hover:border-primary transition-colors cursor-pointer h-full">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <h4 className="font-semibold mb-1">Tạo bài tập mới</h4>
                                    <p className="text-xs text-muted-foreground">Giao bài tập, dự án hoặc bài kiểm tra.</p>
                                </div>
                            </Link>
                            <div className="bg-card p-4 rounded-xl border border-border hover:border-primary transition-colors cursor-pointer h-full opacity-70">
                                <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mb-3">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <h4 className="font-semibold mb-1">Báo cáo tổng hợp</h4>
                                <p className="text-xs text-muted-foreground">Sắp ra mắt: Phân tích sâu toàn hệ thống.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Sidebar (Right - 1/3) */}
                <div className="space-y-6">
                    {/* Recent Activity Feed */}
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            Hoạt động gần đây
                        </h3>
                        <div className="space-y-4">
                            {recentSubmissions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Chưa có hoạt động nào.</p>
                            ) : (
                                recentSubmissions.map(sub => {
                                    const assignment = assignments.find(a => a.id === sub.assignmentId);
                                    return (
                                        <Link
                                            href={`/dashboard/grading/${sub.id}`}
                                            key={sub.id}
                                            className="flex gap-3 items-start pb-3 border-b border-border last:border-0 last:pb-0 hover:bg-muted/50 p-2 rounded-lg transition-colors -mx-2"
                                        >
                                            <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {sub.studentName || 'Học sinh'} <span className="font-normal text-muted-foreground">đã nộp bài</span>
                                                </p>
                                                <p className="text-xs text-primary mt-0.5 line-clamp-1">
                                                    {assignment?.title || 'Bài tập'}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                        <Link href="/dashboard/activity">
                            <button className="w-full mt-4 text-xs text-center text-muted-foreground hover:text-primary transition-colors">
                                Xem tất cả hoạt động
                            </button>
                        </Link>
                    </div>

                    {/* System Status / Quick Info */}
                    <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
                        <h3 className="font-semibold mb-2 text-primary">Mẹo giảng dạy</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Sử dụng tính năng "Đính kèm file" để cung cấp tài liệu tham khảo cho học sinh giúp cải thiện chất lượng bài làm.
                        </p>
                        <button
                            onClick={() => setIsCreateClassModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tạo lớp học</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CreateClassModal
                isOpen={isCreateClassModalOpen}
                onClose={() => setIsCreateClassModalOpen(false)}
                onSuccess={() => {
                    // Refresh data
                    const loadData = async () => {
                        const [classesData, studentsData] = await Promise.all([
                            DataService.getClasses(user.id),
                            DataService.getStudents(user.id)
                        ]);
                        setClasses(classesData);
                        setStudents(studentsData);
                    };
                    loadData();
                }}
                userId={user.id}
            />
        </div>
    );
}

function StatCard({ title, value, icon, description, trend, highlight }: { title: string, value: string, icon: React.ReactNode, description?: string, trend?: string, highlight?: boolean }) {
    return (
        <div className={`bg-card p-6 rounded-xl border shadow-sm ${highlight ? 'border-orange-200 bg-orange-50/50' : 'border-border'}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">{title}</span>
                {icon}
            </div>
            <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">{value}</div>
                {trend && <span className="text-xs text-green-600 font-medium">{trend}</span>}
            </div>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
    );
}
