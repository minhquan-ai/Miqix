import { BookOpen, Clock, Trophy, Star, Target, TrendingUp, Plus, LogOut, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { DataService } from "@/lib/data";
import { Assignment, Submission, User } from "@/types";

import { NotificationBell } from "@/components/features/NotificationBell";
import { JoinClassModal } from "@/components/features/JoinClassModal";
import { SearchFilter } from "@/components/ui/SearchFilter";

interface StudentDashboardProps {
    user: User;
    assignments: Assignment[];
    submissions: Submission[]; // New prop for student's submissions
}

export function StudentDashboard({ user, assignments, submissions }: StudentDashboardProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortBy, setSortBy] = useState("dueDate");

    const handleLogout = () => {
        localStorage.removeItem('userRole');
        router.push('/login');
    };

    // Calculate real statistics
    const submittedCount = submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length;
    const gradedCount = submissions.filter(s => s.status === 'graded').length;
    const pendingGradingCount = submissions.filter(s => s.status === 'submitted').length;
    const openAssignmentsCount = assignments.filter(a => a.status === 'open').length;

    // Calculate total XP earned from graded assignments
    const earnedXP = submissions
        .filter(s => s.status === 'graded')
        .reduce((total, s) => {
            const assignment = assignments.find(a => a.id === s.assignmentId);
            return total + (assignment?.xpReward || 0);
        }, 0);

    // Filter, search, and sort assignments
    const [isJoinClassModalOpen, setIsJoinClassModalOpen] = useState(false);

    const filteredAndSortedAssignments = useMemo(() => {
        let result = [...assignments];

        // Apply search filter
        if (searchQuery) {
            result = result.filter(a =>
                a.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply status filter based on submission state
        if (filterStatus !== "all") {
            result = result.filter(a => {
                const submission = submissions.find(s => s.assignmentId === a.id);

                // "open" = assignments that are open AND not yet submitted by student
                if (filterStatus === "open") {
                    return a.status === "open" && !submission;
                }
                // "submitted" = assignments with submitted status (waiting for grading)
                if (filterStatus === "submitted") {
                    return submission?.status === "submitted";
                }
                // "graded" = assignments that have been graded
                if (filterStatus === "graded") {
                    return submission?.status === "graded";
                }
                return true;
            });
        }

        // Apply sorting
        result.sort((a, b) => {
            const subA = submissions.find(s => s.assignmentId === a.id);
            const subB = submissions.find(s => s.assignmentId === b.id);

            if (sortBy === "dueDate") {
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            } else if (sortBy === "title") {
                return a.title.localeCompare(b.title);
            } else if (sortBy === "status") {
                const statusOrder = { graded: 0, submitted: 1, open: 2 };
                const statusA = subA?.status || "open";
                const statusB = subB?.status || "open";
                return (statusOrder[statusA as keyof typeof statusOrder] || 3) - (statusOrder[statusB as keyof typeof statusOrder] || 3);
            } else if (sortBy === "score") {
                return (subB?.score || 0) - (subA?.score || 0);
            }
            return 0;
        });

        return result;
    }, [assignments, submissions, searchQuery, filterStatus, sortBy]);

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Xin chào, {user.name}! 👋</h2>
                    <p className="text-muted-foreground">Sẵn sàng cho buổi học hôm nay chưa?</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Removed inline JoinClassButton to avoid confusion, using Modal instead */}
                    <button
                        onClick={() => setIsJoinClassModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors mr-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tham gia lớp</span>
                    </button>
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

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Content (Left - 2/3) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Stats Overview (Compact) */}
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                        <StatCard
                            title="Đang mở"
                            value={openAssignmentsCount.toString()}
                            icon={<Clock className="w-4 h-4 text-orange-500" />}
                            description="Bài tập"
                        />
                        <StatCard
                            title="Đã xong"
                            value={gradedCount.toString()}
                            icon={<CheckCircle className="w-4 h-4 text-green-500" />}
                            description="Bài tập"
                        />
                        <StatCard
                            title="Chờ chấm"
                            value={pendingGradingCount.toString()}
                            icon={<BookOpen className="w-4 h-4 text-purple-500" />}
                            description="Bài nộp"
                        />
                        <StatCard
                            title="Điểm TB"
                            value={gradedCount > 0 ? (submissions.reduce((acc, s) => acc + (s.score || 0), 0) / gradedCount).toFixed(1) : "--"}
                            icon={<TrendingUp className="w-4 h-4 text-blue-500" />}
                            description="Trung bình"
                        />
                    </div>

                    {/* Assignments List */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-primary" />
                                Bài tập của bạn
                            </h3>
                        </div>

                        {/* Search and Filter */}
                        <SearchFilter
                            onSearch={setSearchQuery}
                            onFilterChange={setFilterStatus}
                            onSortChange={setSortBy}
                        />

                        {/* Results Count */}
                        {(searchQuery || filterStatus !== "all") && (
                            <div className="text-sm text-muted-foreground mb-3">
                                Hiển thị <span className="font-semibold text-foreground">{filteredAndSortedAssignments.length}</span> / {assignments.length} bài tập
                            </div>
                        )}

                        <div className="space-y-3">
                            {filteredAndSortedAssignments.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/30">
                                    <p className="text-muted-foreground">
                                        {searchQuery || filterStatus !== "all"
                                            ? "Không tìm thấy bài tập nào."
                                            : "Không có bài tập nào."}
                                    </p>
                                </div>
                            ) : (
                                filteredAndSortedAssignments.map((assignment) => {
                                    const submission = submissions.find(s => s.assignmentId === assignment.id);
                                    const isSubmitted = submission?.status === 'submitted';
                                    const isGraded = submission?.status === 'graded';
                                    const isOverdue = new Date(assignment.dueDate).getTime() < Date.now();

                                    return (
                                        <Link key={assignment.id} href={`/dashboard/assignments/${assignment.id}`} className="block group">
                                            <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 
                                                    ${isGraded ? 'bg-green-100 text-green-600' :
                                                        isSubmitted ? 'bg-orange-100 text-orange-600' :
                                                            isOverdue ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    {isGraded ? '✓' : isSubmitted ? '⏳' : isOverdue ? '!' : 'E'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-base group-hover:text-primary transition-colors truncate">{assignment.title}</h4>
                                                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-yellow-600 font-medium">
                                                            +{assignment.xpReward} XP
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    {isGraded ? (
                                                        <div className="text-lg font-bold text-green-600">{submission.score}đ</div>
                                                    ) : isSubmitted ? (
                                                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-md font-medium">Đang chấm</span>
                                                    ) : isOverdue ? (
                                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md font-medium">Quá hạn</span>
                                                    ) : (
                                                        <button className="text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-md font-medium group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                            Làm bài
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar (Right - 1/3) */}
                <div className="space-y-6">
                    {/* Mini Profile / Gamification Summary */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>

                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className="w-14 h-14 rounded-full border-2 border-white/30 overflow-hidden bg-white/10">
                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{user.name}</h3>
                                <div className="flex items-center gap-2 text-sm opacity-90">
                                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium">Level {user.level}</span>
                                    <span>{user.xp?.toLocaleString()} XP</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                            <div className="bg-white/10 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold">{user.streak || 0} 🔥</div>
                                <div className="text-xs opacity-75">Streak ngày</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold">{user.badges?.length || 0} 🏅</div>
                                <div className="text-xs opacity-75">Huy hiệu</div>
                            </div>
                        </div>

                        <Link href="/dashboard/achievements" className="block relative z-10">
                            <button className="w-full bg-white text-indigo-600 py-2 rounded-lg font-medium text-sm hover:bg-indigo-50 transition-colors">
                                Xem chi tiết thành tích
                            </button>
                        </Link>
                    </div>

                    {/* AI Tutor Notification */}
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                            AI Tutor nhắc nhở
                        </h3>
                        <div className="p-4 rounded-lg bg-blue-50 text-blue-900 text-sm border border-blue-100">
                            <p className="font-medium mb-1">💡 Gợi ý học tập</p>
                            <p className="opacity-90">Bạn đang làm rất tốt phần Hình học! Tuy nhiên, hãy ôn lại một chút về Đại số tuyến tính để chuẩn bị cho bài kiểm tra sắp tới nhé.</p>
                        </div>
                    </div>
                </div>
            </div>

            <JoinClassModal
                isOpen={isJoinClassModalOpen}
                onClose={() => setIsJoinClassModalOpen(false)}
                onSuccess={() => {
                    setIsJoinClassModalOpen(false);
                    window.location.reload(); // Simple refresh to show new class data
                }}
                userId={user.id}
            />
        </div>
    );
}

function StatCard({ title, value, icon, description }: { title: string, value: string, icon: React.ReactNode, description: string }) {
    return (
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">{title}</span>
                {icon}
            </div>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
    );
}
