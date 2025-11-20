"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock, Star, Target, Trophy, Zap, List, Grid3x3, Calendar, Filter, Plus, BookOpen, User } from "lucide-react";
import { DataService } from "@/lib/data";
import { Assignment, Submission, User as UserType, Mission } from "@/types";

type ViewMode = 'quest' | 'list' | 'grid';
type TimeFilter = 'all' | 'today' | 'week' | 'month';
type CategoryFilter = 'all' | 'assignments' | 'learning' | 'personal';

export default function MissionsPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserType | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('quest');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

    useEffect(() => {
        async function loadData() {
            try {
                const currentUser = await DataService.getCurrentUser();
                if (!currentUser) {
                    router.push('/login');
                    return;
                }
                setUser(currentUser);

                const classId = currentUser.role === 'student' ? currentUser.classId : undefined;
                const classAssignments = await DataService.getAssignments(classId);
                setAssignments(classAssignments);

                // Load student missions
                if (currentUser.role === 'student') {
                    const studentMissions = await DataService.getMissions(currentUser.id);
                    setMissions(studentMissions);

                    const allSubmissions: Submission[] = [];
                    for (const assignment of classAssignments) {
                        const submission = await DataService.getStudentSubmission(assignment.id, currentUser.id);
                        if (submission) {
                            allSubmissions.push(submission);
                        }
                    }
                    setSubmissions(allSubmissions);
                }
            } catch (error) {
                console.error("Failed to load missions", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadData();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [router]);

    if (loading) return <div className="p-8 text-center">Đang tải nhiệm vụ...</div>;
    if (!user) return null;

    // Filter by time
    const getTimeFilteredItems = <T extends { dueDate: string }>(items: T[]): T[] => {
        const now = new Date();
        return items.filter(item => {
            const dueDate = new Date(item.dueDate);

            switch (timeFilter) {
                case 'today':
                    return dueDate.toDateString() === now.toDateString();
                case 'week':
                    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    return dueDate >= now && dueDate <= weekFromNow;
                case 'month':
                    const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                    return dueDate >= now && dueDate <= monthFromNow;
                default:
                    return true;
            }
        });
    };

    // Filter assignments and missions
    let filteredAssignments = getTimeFilteredItems(assignments);
    let filteredMissions = missions.filter(m => m.dueDate); // Filter missions with dueDate first
    filteredMissions = getTimeFilteredItems(filteredMissions as (Mission & { dueDate: string })[]) as Mission[];


    // Apply category filter
    if (categoryFilter === 'assignments') {
        filteredMissions = [];
    } else if (categoryFilter === 'learning') {
        filteredAssignments = [];
        filteredMissions = filteredMissions.filter(m => m.category === 'learning');
    } else if (categoryFilter === 'personal') {
        filteredAssignments = [];
        filteredMissions = filteredMissions.filter(m => m.category === 'personal');
    }

    const totalItems = filteredAssignments.length + filteredMissions.length;
    const completedAssignments = filteredAssignments.filter(a => {
        const submission = submissions.find(s => s.assignmentId === a.id);
        return submission?.status === 'graded' || submission?.status === 'submitted';
    }).length;
    const completedMissions = filteredMissions.filter(m => m.status === 'completed').length;
    const completedTotal = completedAssignments + completedMissions;
    const progress = totalItems > 0 ? (completedTotal / totalItems) * 100 : 0;

    return (
        <div className="space-y-6 -m-8 p-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Target className="w-8 h-8 text-red-500" />
                        Bảng Nhiệm Vụ
                    </h1>
                    <p className="text-muted-foreground mt-1">Hoàn thành các nhiệm vụ để nhận XP và thăng cấp!</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Create Mission Button */}
                    <Link href="/dashboard/missions/create">
                        <button className="bg-purple-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Tạo nhiệm vụ
                        </button>
                    </Link>

                    {/* Player Stats */}
                    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">CẤP ĐỘ</p>
                                <p className="font-bold text-lg">Level {user.level}</p>
                            </div>
                        </div>
                        <div className="w-px h-10 bg-border"></div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">KINH NGHIỆM</p>
                                <p className="font-bold text-lg">{user.xp?.toLocaleString()} XP</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                    <span>Tiến độ hoàn thành</span>
                    <span>{completedTotal}/{totalItems} Nhiệm vụ</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            {/* Controls: Spread out horizontally */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                {/* View Mode */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Hiển thị:</span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setViewMode('quest')}
                            className={`p-2.5 rounded-lg transition-all ${viewMode === 'quest' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/70'
                                }`}
                            title="Chế độ Quest"
                        >
                            <Star className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/70'
                                }`}
                            title="Chế độ Danh sách"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/70'
                                }`}
                            title="Chế độ Lưới"
                        >
                            <Grid3x3 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Loại:</span>
                    {[
                        { key: 'all', label: 'Tất cả' },
                        { key: 'assignments', label: 'Bài tập' },
                        { key: 'learning', label: 'Học tập' },
                        { key: 'personal', label: 'Cá nhân' },
                    ].map((filter) => (
                        <button
                            key={filter.key}
                            onClick={() => setCategoryFilter(filter.key as CategoryFilter)}
                            className={`px-4 py-2 text-sm rounded-lg transition-all ${categoryFilter === filter.key
                                ? 'bg-primary text-primary-foreground font-medium shadow-md'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {/* Time Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Thời gian:</span>
                    {[
                        { key: 'all', label: 'Tất cả' },
                        { key: 'today', label: 'Hôm nay' },
                        { key: 'week', label: 'Tuần này' },
                        { key: 'month', label: 'Tháng này' },
                    ].map((filter) => (
                        <button
                            key={filter.key}
                            onClick={() => setTimeFilter(filter.key as TimeFilter)}
                            className={`px-4 py-2 text-sm rounded-lg transition-all ${timeFilter === filter.key
                                ? 'bg-primary text-primary-foreground font-medium shadow-md'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Missions Display */}
            {viewMode === 'quest' && <QuestView assignments={filteredAssignments} missions={filteredMissions} submissions={submissions} />}
            {viewMode === 'list' && <ListView assignments={filteredAssignments} missions={filteredMissions} submissions={submissions} />}
            {viewMode === 'grid' && <GridView assignments={filteredAssignments} missions={filteredMissions} submissions={submissions} />}

            {totalItems === 0 && (
                <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Không có nhiệm vụ</h3>
                    <p className="text-muted-foreground">
                        {timeFilter !== 'all' || categoryFilter !== 'all'
                            ? 'Không có nhiệm vụ nào phù hợp với bộ lọc'
                            : 'Hãy chờ giáo viên giao nhiệm vụ mới nhé!'}
                    </p>
                </div>
            )}
        </div>
    );
}

// Quest View (Original gamified view)
function QuestView({ assignments, missions, submissions }: { assignments: Assignment[]; missions: Mission[]; submissions: Submission[] }) {
    return (
        <div className="space-y-6">
            {/* Assignment Missions */}
            {assignments.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                        Nhiệm vụ Bài tập ({assignments.length})
                    </h2>

                    {assignments.map((assignment) => {
                        const submission = submissions.find(s => s.assignmentId === assignment.id);
                        const isSubmitted = submission?.status === 'submitted';
                        const isGraded = submission?.status === 'graded';
                        const isCompleted = isSubmitted || isGraded;

                        return (
                            <div
                                key={assignment.id}
                                className={`group relative bg-card border rounded-xl p-6 transition-all duration-300 ${isCompleted
                                    ? 'border-green-200 bg-green-50/30 opacity-80 hover:opacity-100'
                                    : 'border-border hover:border-primary hover:shadow-md'
                                    }`}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isCompleted
                                            ? 'bg-green-100 text-green-600'
                                            : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors'
                                            }`}>
                                            {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                                        </div>

                                        <div>
                                            <h3 className={`text-lg font-bold ${isCompleted ? 'text-green-800 line-through decoration-green-500/50' : ''}`}>
                                                {assignment.title}
                                            </h3>
                                            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{assignment.description}</p>

                                            <div className="flex items-center gap-4 mt-3 text-xs font-medium">
                                                <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                                    <Zap className="w-3 h-3" />
                                                    +{assignment.xpReward} XP
                                                </span>
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <Clock className="w-3 h-3" />
                                                    Hạn: {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0">
                                        {isCompleted ? (
                                            <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-bold text-sm flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4" />
                                                Đã hoàn thành
                                            </div>
                                        ) : (
                                            <Link href={`/dashboard/assignments/${assignment.id}`}>
                                                <button className="w-full md:w-auto bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-bold hover:bg-primary/90 hover:scale-105 transition-all shadow-lg shadow-primary/20">
                                                    Thực hiện ngay
                                                </button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Custom Missions */}
            {missions.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Star className="w-5 h-5 text-purple-500 fill-purple-500" />
                        Nhiệm vụ Cá nhân ({missions.length})
                    </h2>

                    {missions.map((mission) => {
                        const isCompleted = mission.status === 'completed';

                        return (
                            <div
                                key={mission.id}
                                className={`group relative bg-card border rounded-xl p-6 transition-all duration-300 ${isCompleted
                                    ? 'border-green-200 bg-green-50/30 opacity-80 hover:opacity-100'
                                    : 'border-border hover:border-purple-400 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isCompleted
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-purple-100 text-purple-600'
                                        }`}>
                                        {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Star className="w-6 h-6" />}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className={`text-lg font-bold ${isCompleted ? 'text-green-800 line-through decoration-green-500/50' : ''}`}>
                                                    {mission.title}
                                                </h3>
                                                <p className="text-muted-foreground text-sm mt-1">{mission.description}</p>

                                                <div className="flex items-center gap-4 mt-3 text-xs font-medium">
                                                    <span className={`px-2 py-1 rounded ${mission.category === 'learning' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                                                        }`}>
                                                        {mission.category === 'learning' ? 'Học tập' : 'Cá nhân'}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-muted-foreground">
                                                        <Clock className="w-3 h-3" />
                                                        Hạn: {new Date(mission.dueDate!).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                            </div>

                                            {!isCompleted && (
                                                <button
                                                    onClick={async () => {
                                                        await DataService.updateMission(mission.id, {
                                                            status: 'completed',
                                                            completedAt: new Date().toISOString()
                                                        });
                                                        window.location.reload();
                                                    }}
                                                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-all shadow-md text-sm shrink-0"
                                                >
                                                    Hoàn thành
                                                </button>
                                            )}
                                            {isCompleted && (
                                                <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-bold text-sm flex items-center gap-2 shrink-0">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Đã xong
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// List View (Compact table-like view)
function ListView({ assignments, missions, submissions }: { assignments: Assignment[]; missions: Mission[]; submissions: Submission[] }) {
    const allItems = [
        ...assignments.map(a => ({ type: 'assignment' as const, data: a })),
        ...missions.map(m => ({ type: 'mission' as const, data: m }))
    ];

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
                <div className="col-span-5">Tên nhiệm vụ</div>
                <div className="col-span-2">Loại</div>
                <div className="col-span-2">Hạn nộp</div>
                <div className="col-span-1">XP</div>
                <div className="col-span-2">Trạng thái</div>
            </div>

            {allItems.map((item, idx) => {
                if (item.type === 'assignment') {
                    const assignment = item.data;
                    const submission = submissions.find(s => s.assignmentId === assignment.id);
                    const isCompleted = submission?.status === 'submitted' || submission?.status === 'graded';

                    return (
                        <Link key={`a-${assignment.id}`} href={`/dashboard/assignments/${assignment.id}`}>
                            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border hover:bg-muted/30 transition-colors cursor-pointer">
                                <div className="col-span-5 font-medium flex items-center gap-2 text-sm">
                                    {isCompleted ? (
                                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground shrink-0"></div>
                                    )}
                                    <span className={isCompleted ? 'line-through text-muted-foreground' : ''}>{assignment.title}</span>
                                </div>
                                <div className="col-span-2text-sm text-blue-700 font-medium">Bài tập</div>
                                <div className="col-span-2 text-sm text-muted-foreground">
                                    {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}
                                </div>
                                <div className="col-span-1 text-sm font-medium text-orange-600">+{assignment.xpReward}</div>
                                <div className="col-span-2">
                                    {isCompleted ? (
                                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">Đã nộp</span>
                                    ) : (
                                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">Chưa nộp</span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                } else {
                    const mission = item.data;
                    const isCompleted = mission.status === 'completed';

                    return (
                        <div key={`m-${mission.id}`} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border hover:bg-muted/30 transition-colors">
                            <div className="col-span-5 font-medium flex items-center gap-2 text-sm">
                                {isCompleted ? (
                                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                ) : (
                                    <Star className="w-4 h-4 text-purple-600 shrink-0" />
                                )}
                                <span className={isCompleted ? 'line-through text-muted-foreground' : ''}>{mission.title}</span>
                            </div>
                            <div className="col-span-2 text-sm text-purple-700 font-medium">
                                {mission.category === 'learning' ? 'Học tập' : 'Cá nhân'}
                            </div>
                            <div className="col-span-2 text-sm text-muted-foreground">
                                {new Date(mission.dueDate!).toLocaleDateString('vi-VN')}
                            </div>
                            <div className="col-span-1 text-sm">-</div>
                            <div className="col-span-2">
                                {isCompleted ? (
                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">Đã xong</span>
                                ) : (
                                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">Đang làm</span>
                                )}
                            </div>
                        </div>
                    );
                }
            })}
        </div>
    );
}

// Grid View (Card grid)
function GridView({ assignments, missions, submissions }: { assignments: Assignment[]; missions: Mission[]; submissions: Submission[] }) {
    const allItems = [
        ...assignments.map(a => ({ type: 'assignment' as const, data: a })),
        ...missions.map(m => ({ type: 'mission' as const, data: m }))
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allItems.map((item, idx) => {
                if (item.type === 'assignment') {
                    const assignment = item.data;
                    const submission = submissions.find(s => s.assignmentId === assignment.id);
                    const isCompleted = submission?.status === 'submitted' || submission?.status === 'graded';

                    return (
                        <Link key={`a-${assignment.id}`} href={`/dashboard/assignments/${assignment.id}`}>
                            <div className={`bg-card border-2 rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer h-full ${isCompleted ? 'border-green-200 bg-green-50/30' : 'border-border hover:border-primary'
                                }`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100' : 'bg-blue-100'}`}>
                                        {isCompleted ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <BookOpen className="w-5 h-5 text-blue-600" />
                                        )}
                                    </div>
                                    <span className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded-full font-bold">
                                        +{assignment.xpReward} XP
                                    </span>
                                </div>

                                <h3 className={`font-bold text-lg mb-2 ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                    {assignment.title}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{assignment.description}</p>

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}
                                    </span>
                                    <span className="font-medium text-blue-700">Bài tập</span>
                                </div>

                                {isCompleted && (
                                    <div className="mt-3 pt-3 border-t border-border">
                                        <span className="text-xs text-green-700 font-medium">✓ Đã hoàn thành</span>
                                    </div>
                                )}
                            </div>
                        </Link>
                    );
                } else {
                    const mission = item.data;
                    const isCompleted = mission.status === 'completed';

                    return (
                        <div key={`m-${mission.id}`} className={`bg-card border-2 rounded-xl p-5 hover:shadow-lg transition-all h-full ${isCompleted ? 'border-green-200 bg-green-50/30' : 'border-purple-300 hover:border-purple-400'
                            }`}>
                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100' : 'bg-purple-100'}`}>
                                    {isCompleted ? (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <Star className="w-5 h-5 text-purple-600" />
                                    )}
                                </div>
                                <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">
                                    {mission.category === 'learning' ? 'Học tập' : 'Cá nhân'}
                                </span>
                            </div>

                            <h3 className={`font-bold text-lg mb-2 ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                {mission.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{mission.description}</p>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(mission.dueDate!).toLocaleDateString('vi-VN')}
                                </span>
                            </div>

                            {isCompleted && (
                                <div className="mt-3 pt-3 border-t border-border">
                                    <span className="text-xs text-green-700 font-medium">✓ Đã hoàn thành</span>
                                </div>
                            )}
                        </div>
                    );
                }
            })}
        </div>
    );
}
