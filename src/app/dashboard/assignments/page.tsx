"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, CheckCircle, Clock, Filter, Plus, Search } from "lucide-react";
import { DataService } from "@/lib/data";
import { Assignment, Submission, User } from "@/types";

export default function AssignmentsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'open' | 'submitted' | 'graded'>('all');
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function loadData() {
            try {
                const currentUser = await DataService.getCurrentUser();
                if (!currentUser) {
                    router.push('/login');
                    return;
                }
                setUser(currentUser);

                const [allAssignments, allSubmissions] = await Promise.all([
                    DataService.getAssignments(currentUser.role === 'student' ? currentUser.classId : undefined),
                    currentUser.role === 'teacher'
                        ? DataService.getSubmissions()
                        : DataService.getSubmissions().then(subs => subs.filter(s => s.studentId === currentUser.id))
                ]);

                setAssignments(allAssignments);
                setSubmissions(allSubmissions);
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [router]);

    if (loading) return <div className="p-8 text-center">Đang tải...</div>;
    if (!user) return null;

    const filteredAssignments = assignments.filter(assignment => {
        // Apply search query first
        if (searchQuery && !assignment.title.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }

        // For teachers, only apply search (show all assignments)
        if (user.role === 'teacher') return true;

        // For students, apply status filter
        const submission = submissions.find(s => s.assignmentId === assignment.id);
        const status = submission ? submission.status : 'open';

        if (filter === 'all') return true;
        if (filter === 'open') return status === 'open' || !submission;
        if (filter === 'submitted') return status === 'submitted';
        if (filter === 'graded') return status === 'graded';
        return true;
    });

    return (
        <div className="space-y-6 -m-8 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Danh sách Bài tập</h1>
                    <p className="text-muted-foreground">Các bài tập và nhiệm vụ cần hoàn thành.</p>
                </div>
                {user.role === 'teacher' && (
                    <Link href="/dashboard/assignments/create">
                        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Tạo bài tập
                        </button>
                    </Link>
                )}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                    <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="Tất cả" />
                    <FilterButton active={filter === 'open'} onClick={() => setFilter('open')} label="Đang mở" icon={<Clock className="w-3 h-3" />} />
                    <FilterButton active={filter === 'submitted'} onClick={() => setFilter('submitted')} label="Đã nộp" icon={<CheckCircle className="w-3 h-3" />} />
                    <FilterButton active={filter === 'graded'} onClick={() => setFilter('graded')} label="Đã chấm" icon={<BookOpen className="w-3 h-3" />} />
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm bài tập..."
                        className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm"
                    />
                </div>
            </div>

            {/* Assignments Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAssignments.map((assignment) => {
                    const submission = submissions.find(s => s.assignmentId === assignment.id);
                    const isSubmitted = submission?.status === 'submitted';
                    const isGraded = submission?.status === 'graded';

                    // For teachers, show submission count
                    const submissionCount = user.role === 'teacher'
                        ? submissions.filter(s => s.assignmentId === assignment.id).length
                        : 0;

                    return (
                        <Link key={assignment.id} href={user.role === 'teacher' ? `/dashboard/assignments/${assignment.id}/submissions` : `/dashboard/assignments/${assignment.id}`}>
                            <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col cursor-pointer group">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold border bg-blue-50 border-blue-200 text-blue-600">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    {user.role === 'student' && (
                                        <div className="flex gap-1">
                                            {isGraded && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-medium border border-green-200">Đã chấm</span>}
                                            {isSubmitted && <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded font-medium border border-orange-200">Đã nộp</span>}
                                            {!isSubmitted && !isGraded && <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded font-medium border border-gray-200">Chưa làm</span>}
                                        </div>
                                    )}
                                </div>

                                <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">{assignment.title}</h3>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">{assignment.description}</p>

                                <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}
                                    </span>
                                    {user.role === 'teacher' ? (
                                        <span>{submissionCount} bài nộp</span>
                                    ) : (
                                        <span className="font-medium">Bài tập</span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                })}

                {filteredAssignments.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
                        <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Không tìm thấy bài tập nào</h3>
                        <p className="text-muted-foreground">Thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function FilterButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon?: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
        >
            {icon}
            {label}
        </button>
    );
}
