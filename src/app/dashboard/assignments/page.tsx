"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, CheckCircle, Clock, Plus, Search, FileEdit } from "lucide-react";
import { DataService } from "@/lib/data";
import { getCurrentUserAction } from "@/lib/actions";
import { Assignment, Submission, User } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { AssignmentCreatorModal } from "@/components/features/AssignmentCreatorModal";

import { Class } from "@/types";

import { Suspense } from "react";

function AssignmentsContent() {

    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const [filter, setFilter] = useState<'all' | 'open' | 'submitted' | 'graded' | 'draft' | 'pending'>('all');
    const [searchQuery, setSearchQuery] = useState("");
    const [classes, setClasses] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);


    useEffect(() => {
        async function loadData() {
            try {
                const currentUser = await getCurrentUserAction();
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

                if (currentUser.role === 'teacher') {
                    const teacherClasses = await DataService.getClasses();
                    setClasses(teacherClasses);
                }
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [router]);

    useEffect(() => {
        const filterParam = searchParams.get('filter');
        if (filterParam && ['all', 'open', 'submitted', 'graded', 'draft', 'pending'].includes(filterParam)) {
            setFilter(filterParam as any);
        }
    }, [searchParams]);

    if (loading) {
        return (
            <div className="space-y-6 -m-8 p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-20 rounded-full" />
                        <Skeleton className="h-8 w-24 rounded-full" />
                        <Skeleton className="h-8 w-24 rounded-full" />
                    </div>
                    <Skeleton className="h-10 w-64" />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-5 shadow-sm h-full flex flex-col">
                            <div className="flex justify-between items-start mb-3">
                                <Skeleton className="w-10 h-10 rounded-lg" />
                                <Skeleton className="w-16 h-6 rounded" />
                            </div>
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-full mb-1" />
                            <Skeleton className="h-4 w-2/3 mb-4" />
                            <div className="pt-4 border-t border-border flex items-center justify-between mt-auto">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    if (!user) return null;

    const filteredAssignments = assignments.filter(assignment => {
        // Apply search query first
        if (searchQuery && !assignment.title.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }

        // Teacher Logic
        if (user.role === 'teacher') {
            if (filter === 'all') return true;
            if (filter === 'draft') return assignment.status === 'draft';

            const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignment.id);
            const pendingCount = assignmentSubmissions.filter(s => s.status === 'submitted').length;
            const hasSubmissions = assignmentSubmissions.length > 0;
            const gradedCount = assignmentSubmissions.filter(s => s.status === 'graded').length;

            if (filter === 'pending') return pendingCount > 0;
            if (filter === 'submitted') return hasSubmissions;
            if (filter === 'graded') return gradedCount > 0;
            if (filter === 'open') return assignment.status === 'open';

            return true;
        }

        // Student Logic
        const submission = submissions.find(s => s.assignmentId === assignment.id);
        const myStatus = submission ? submission.status : 'open';

        if (filter === 'all') return true;
        if (filter === 'open') return myStatus === 'open' || !submission;
        if (filter === 'submitted') return myStatus === 'submitted';
        if (filter === 'graded') return myStatus === 'graded';
        if (filter === 'pending') return myStatus === 'open' || !submission;

        return true;
    });

    // Calculate Stats
    const stats = {
        total: assignments.length,
        pending: assignments.filter(a => {
            const sub = submissions.find(s => s.assignmentId === a.id);
            return !sub;
        }).length,
        submitted: submissions.filter(s => s.status === 'submitted').length,
        graded: submissions.filter(s => s.status === 'graded').length,
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white -m-8 p-6">
            <div className="max-w-full mx-auto space-y-6">

                <AssignmentCreatorModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={async () => {
                        const allAssignments = await DataService.getAssignments();
                        setAssignments(allAssignments);
                    }}
                />

                {/* Hero Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20"
                >
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl" />

                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-medium text-white/80">Danh sách bài tập</span>
                            </div>
                            <h1 className="text-3xl font-bold mb-2">Bài tập của tôi</h1>
                            <p className="text-white/80 text-sm max-w-md">
                                Quản lý, theo dõi và hoàn thành các nhiệm vụ học tập của bạn.
                            </p>
                        </div>
                        {user.role === 'teacher' && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowCreateModal(true)}
                                className="hidden md:flex bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Tạo bài tập
                            </motion.button>
                        )}
                    </div>
                </motion.div>



                {/* Search & Filter Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="flex flex-col md:flex-row gap-4"
                >
                    {/* Search Bar */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm bài tập..."
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        />
                    </div>

                    {/* Filter Buttons Group */}
                    <div className="flex items-center gap-2 overflow-x-auto bg-white p-2 rounded-2xl border border-gray-100 shadow-sm custom-scrollbar">
                        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="Tất cả" />
                        <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')} label={user.role === 'teacher' ? "Cần chấm" : "Cần làm"} />
                        <FilterButton active={filter === 'open'} onClick={() => setFilter('open')} label="Đang mở" />
                        <FilterButton active={filter === 'submitted'} onClick={() => setFilter('submitted')} label="Đã nộp" />
                        <FilterButton active={filter === 'graded'} onClick={() => setFilter('graded')} label="Đã chấm" />
                        {user.role === 'teacher' && (
                            <FilterButton active={filter === 'draft'} onClick={() => setFilter('draft')} label="Bản nháp" />
                        )}
                    </div>
                </motion.div>


                {/* Assignments Grid */}
                <motion.div
                    className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                    initial="hidden"
                    animate="show"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredAssignments.map((assignment) => {
                            const submission = submissions.find(s => s.assignmentId === assignment.id);
                            const isSubmitted = submission?.status === 'submitted';
                            const isGraded = submission?.status === 'graded';
                            const submissionCount = user.role === 'teacher'
                                ? submissions.filter(s => s.assignmentId === assignment.id).length
                                : 0;

                            return (
                                <motion.div
                                    key={assignment.id}
                                    layout
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        show: { opacity: 1, y: 0 }
                                    }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Link href={user.role === 'teacher' ? `/dashboard/assignments/${assignment.id}/submissions` : `/dashboard/assignments/${assignment.id}`}>
                                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all h-full flex flex-col cursor-pointer group relative overflow-hidden">
                                            {/* Hover Accent */}
                                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />

                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
                                                    <BookOpen className="w-6 h-6" />
                                                </div>

                                                {user.role === 'student' && (
                                                    <div className="flex gap-1">
                                                        {isGraded && <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">Đã chấm</span>}
                                                        {isSubmitted && <span className="bg-orange-100 text-orange-700 text-xs px-2.5 py-1 rounded-full font-medium">Đã nộp</span>}
                                                        {!isSubmitted && !isGraded && <span className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium">Chưa làm</span>}
                                                    </div>
                                                )}
                                                {user.role === 'teacher' && assignment.status === 'draft' && (
                                                    <span className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                                                        <FileEdit className="w-3 h-3" /> Bản nháp
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{assignment.title}</h3>
                                            <p className="text-sm text-gray-500 mb-6 line-clamp-2 flex-1">{assignment.description}</p>

                                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500 font-medium">
                                                <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}
                                                </span>
                                                {user.role === 'teacher' ? (
                                                    <span className="text-blue-600">{submissionCount} bài nộp</span>
                                                ) : (
                                                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-blue-600">
                                                        Chi tiết <CheckCircle className="w-3 h-3" />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {filteredAssignments.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full py-20 flex flex-col items-center text-center"
                        >
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <Search className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="font-bold text-xl mb-2 text-gray-900">Không tìm thấy bài tập</h3>
                            <p className="text-gray-500">Thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác.</p>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

// Helper updated for new style
// Helper updated for new style
function FilterButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon?: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${active
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

export default function AssignmentsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AssignmentsContent />
        </Suspense>
    );
}

