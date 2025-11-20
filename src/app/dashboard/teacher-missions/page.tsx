"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Target, FileCheck, BookOpen, Users, Calendar, Clock, Plus, AlertCircle, Star, List, Grid3x3, Filter, CheckCircle } from "lucide-react";
import { DataService } from "@/lib/data";
import { Mission, User } from "@/types";

type ViewMode = 'quest' | 'list' | 'grid';
type TimeFilter = 'all' | 'today' | 'week' | 'month';
type CategoryFilter = 'all' | 'grading' | 'teaching' | 'admin' | 'personal';

export default function TeacherMissionsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('quest');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

    useEffect(() => {
        async function loadData() {
            try {
                const currentUser = await DataService.getCurrentUser();
                if (!currentUser || currentUser.role !== 'teacher') {
                    router.push('/dashboard');
                    return;
                }
                setUser(currentUser);

                const teacherMissions = await DataService.getMissions(currentUser.id);
                setMissions(teacherMissions);
            } catch (error) {
                console.error("Failed to load missions", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [router]);

    if (loading) return <div className="p-8 text-center">Đang tải...</div>;
    if (!user) return null;

    // Filter by time
    const getTimeFilteredMissions = (missions: Mission[]) => {
        const now = new Date();
        return missions.filter(mission => {
            if (!mission.dueDate) return timeFilter === 'all';
            const dueDate = new Date(mission.dueDate);

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

    // Apply filters
    let filteredMissions = missions;
    if (categoryFilter !== 'all') {
        filteredMissions = filteredMissions.filter(m => m.category === categoryFilter);
    }
    filteredMissions = getTimeFilteredMissions(filteredMissions);

    const stats = {
        total: missions.length,
        pending: missions.filter(m => m.status === 'pending').length,
        inProgress: missions.filter(m => m.status === 'in_progress').length,
        completed: missions.filter(m => m.status === 'completed').length,
    };

    const urgentMissions = missions.filter(m => {
        if (m.status === 'completed' || !m.dueDate) return false;
        const daysUntilDue = Math.ceil((new Date(m.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDue <= 3;
    });

    return (
        <div className="space-y-6 -m-8 p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Target className="w-8 h-8 text-blue-600" />
                        Quản Lý Công Việc
                    </h1>
                    <p className="text-muted-foreground mt-1">Theo dõi nhiệm vụ giảng dạy và quản lý lớp</p>
                </div>

                <Link href="/dashboard/teacher-missions/create">
                    <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Tạo nhiệm vụ mới
                    </button>
                </Link>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                    <span>Tiến độ hoàn thành</span>
                    <span>{stats.completed}/{stats.total} Nhiệm vụ</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
                        style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                    ></div>
                </div>
            </div>

            {/* Controls: View Mode + Time Filter */}
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

            {/* Missions Display by Category */}
            {viewMode === 'quest' && <QuestViewGrouped missions={filteredMissions} />}
            {viewMode === 'list' && <ListView missions={filteredMissions} />}
            {viewMode === 'grid' && <GridView missions={filteredMissions} />}

            {filteredMissions.length === 0 && (
                <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed border-border">
                    <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="font-semibold text-lg mb-2">Không có nhiệm vụ</h3>
                    <p className="text-muted-foreground mb-4">
                        {timeFilter !== 'all'
                            ? 'Không có nhiệm vụ nào phù hợp với bộ lọc'
                            : 'Tạo nhiệm vụ mới để quản lý công việc của bạn'}
                    </p>
                    <Link href="/dashboard/teacher-missions/create">
                        <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                            Tạo nhiệm vụ đầu tiên
                        </button>
                    </Link>
                </div>
            )}
        </div>
    );
}

// Quest View Grouped (like student missions)
function QuestViewGrouped({ missions }: { missions: Mission[] }) {
    // Group missions
    const systemMissions = missions.filter(m => m.type === 'system');
    const customMissions = missions.filter(m => m.type === 'custom');

    return (
        <div className="space-y-6">
            {/* System Missions (Grading) */}
            {systemMissions.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-purple-600" />
                        Nhiệm vụ Chấm bài ({systemMissions.length})
                    </h2>
                    {systemMissions.map((mission) => (
                        <MissionCard key={mission.id} mission={mission} />
                    ))}
                </div>
            )}

            {/* Custom Missions */}
            {customMissions.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Star className="w-5 h-5 text-purple-500 fill-purple-500" />
                        Nhiệm vụ Cá nhân ({customMissions.length})
                    </h2>
                    {customMissions.map((mission) => (
                        <MissionCard key={mission.id} mission={mission} />
                    ))}
                </div>
            )}
        </div>
    );
}

// Mission Card Component
function MissionCard({ mission }: { mission: Mission }) {
    const isCompleted = mission.status === 'completed';
    const isUrgent = mission.dueDate && getDaysUntilDue(mission.dueDate) <= 3 && mission.status !== 'completed';

    const categoryIcons = {
        grading: <FileCheck className="w-6 h-6 text-purple-600" />,
        teaching: <BookOpen className="w-6 h-6 text-blue-600" />,
        admin: <Users className="w-6 h-6 text-orange-600" />,
        personal: <Target className="w-6 h-6 text-green-600" />
    };

    const categoryLabels = {
        grading: 'Chấm bài',
        teaching: 'Giảng dạy',
        admin: 'Quản lý',
        personal: 'Cá nhân'
    };

    return (
        <div
            key={mission.id}
            className={`group relative bg-card border-2 rounded-xl p-6 transition-all duration-300 ${isCompleted
                ? 'border-green-200 bg-green-50/30 opacity-80 hover:opacity-100'
                : isUrgent
                    ? 'border-orange-300 bg-orange-50/50'
                    : 'border-border hover:border-primary hover:shadow-md'
                }`}
        >
            <div className="flex items-start gap-4">
                <div className={`mt-1 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-muted text-primary'
                    }`}>
                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : categoryIcons[mission.category as keyof typeof categoryIcons]}
                </div>

                <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className={`text-lg font-bold ${isCompleted ? 'text-green-800 line-through decoration-green-500/50' : ''}`}>
                                    {mission.title}
                                </h3>
                                {mission.type === 'system' && (
                                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                                        Auto
                                    </span>
                                )}
                            </div>

                            <p className="text-muted-foreground text-sm mb-3">{mission.description}</p>

                            <div className="flex items-center gap-4 text-xs font-medium flex-wrap">
                                <span className={`px-2 py-1 rounded ${mission.category === 'grading' ? 'bg-purple-50 text-purple-700' :
                                    mission.category === 'teaching' ? 'bg-blue-50 text-blue-700' :
                                        mission.category === 'admin' ? 'bg-orange-50 text-orange-700' :
                                            'bg-green-50 text-green-700'
                                    }`}>
                                    {categoryLabels[mission.category as keyof typeof categoryLabels]}
                                </span>

                                {mission.dueDate && (
                                    <span className={`flex items-center gap-1 ${isUrgent ? 'text-orange-600 font-semibold' : 'text-muted-foreground'
                                        }`}>
                                        <Clock className="w-3 h-3" />
                                        Hạn: {new Date(mission.dueDate).toLocaleDateString('vi-VN')}
                                        {!isCompleted && ` (Còn ${getDaysUntilDue(mission.dueDate)} ngày)`}
                                    </span>
                                )}

                                {mission.progress && mission.progress.total > 0 && (
                                    <span className="text-muted-foreground">
                                        {mission.progress.current}/{mission.progress.total} bài đã chấm
                                    </span>
                                )}
                            </div>

                            {/* Progress Bar for Grading Missions */}
                            {mission.progress && mission.progress.total > 0 && (
                                <div className="mt-3">
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                                            style={{ width: `${(mission.progress.current / mission.progress.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Button */}
                        <div className="shrink-0">
                            {isCompleted ? (
                                <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-bold text-sm flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Hoàn thành
                                </div>
                            ) : mission.type === 'system' && mission.category === 'grading' && mission.relatedAssignmentId ? (
                                <Link href={`/dashboard/assignments/${mission.relatedAssignmentId}/submissions`}>
                                    <button className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                                        Xem & Chấm bài
                                    </button>
                                </Link>
                            ) : mission.type === 'custom' ? (
                                <button
                                    onClick={async () => {
                                        await DataService.updateMission(mission.id, {
                                            status: 'completed',
                                            completedAt: new Date().toISOString()
                                        });
                                        window.location.reload();
                                    }}
                                    className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-green-700 transition-all shadow-md"
                                >
                                    Hoàn thành
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            {/* Urgent Alert */}
            {isUrgent && (
                <div className="absolute top-3 right-3">
                    <div className="flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        Khẩn cấp
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper function
function getDaysUntilDue(dueDate: string): number {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// List View
function ListView({ missions }: { missions: Mission[] }) {
    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
                <div className="col-span-4">Tên nhiệm vụ</div>
                <div className="col-span-2">Loại</div>
                <div className="col-span-2">Hạn chót</div>
                <div className="col-span-2">Tiến độ</div>
                <div className="col-span-2">Trạng thái</div>
            </div>

            {missions.map((mission) => {
                const statusConfig = {
                    pending: { label: 'Chờ làm', className: 'bg-yellow-100 text-yellow-700' },
                    in_progress: { label: 'Đang làm', className: 'bg-blue-100 text-blue-700' },
                    completed: { label: 'Hoàn thành', className: 'bg-green-100 text-green-700' },
                };
                const status = statusConfig[mission.status];

                const categoryLabels = {
                    grading: 'Chấm bài',
                    teaching: 'Giảng dạy',
                    admin: 'Quản lý',
                    personal: 'Cá nhân'
                };

                return (
                    <div key={mission.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border hover:bg-muted/30 transition-colors">
                        <div className="col-span-4 font-medium text-sm">{mission.title}</div>
                        <div className="col-span-2 text-sm text-muted-foreground">{categoryLabels[mission.category as keyof typeof categoryLabels]}</div>
                        <div className="col-span-2 text-sm text-muted-foreground">
                            {mission.dueDate ? new Date(mission.dueDate).toLocaleDateString('vi-VN') : '-'}
                        </div>
                        <div className="col-span-2 text-sm">
                            {mission.progress ? `${mission.progress.current}/${mission.progress.total}` : '-'}
                        </div>
                        <div className="col-span-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.className}`}>
                                {status.label}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Grid View
function GridView({ missions }: { missions: Mission[] }) {
    const categoryLabels = {
        grading: 'Chấm bài',
        teaching: 'Giảng dạy',
        admin: 'Quản lý',
        personal: 'Cá nhân'
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {missions.map((mission) => {
                const statusConfig = {
                    pending: { bg: 'bg-yellow-50 border-yellow-300', badge: 'bg-yellow-100 text-yellow-700' },
                    in_progress: { bg: 'bg-blue-50 border-blue-300', badge: 'bg-blue-100 text-blue-700' },
                    completed: { bg: 'bg-green-50 border-green-300', badge: 'bg-green-100 text-green-700' },
                };
                const config = statusConfig[mission.status];

                return (
                    <div key={mission.id} className={`border-2 rounded-xl p-5 hover:shadow-lg transition-all ${config.bg}`}>
                        <div className="flex items-start justify-between mb-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${config.badge}`}>
                                {categoryLabels[mission.category as keyof typeof categoryLabels]}
                            </span>
                            {mission.type === 'system' && (
                                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                                    Auto
                                </span>
                            )}
                        </div>

                        <h3 className="font-bold text-lg mb-2 line-clamp-2">{mission.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{mission.description}</p>

                        {mission.progress && mission.progress.total > 0 && (
                            <div className="mb-3">
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                        style={{ width: `${(mission.progress.current / mission.progress.total) * 100}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {mission.progress.current}/{mission.progress.total} bài đã chấm
                                </p>
                            </div>
                        )}

                        {mission.dueDate && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                <Calendar className="w-3 h-3" />
                                {new Date(mission.dueDate).toLocaleDateString('vi-VN')}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
