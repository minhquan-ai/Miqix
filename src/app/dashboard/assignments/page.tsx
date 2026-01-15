"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, CheckCircle, Clock, Plus, Search, FileEdit } from "lucide-react";
import { getCurrentUserAction, getAssignmentsAction, getSubmissionsAction } from "@/lib/actions";
import { Assignment, Submission, User } from "@/types";
import { AssignmentsPageSkeleton } from "@/components/skeletons";
import { motion, AnimatePresence } from "framer-motion";
import { AssignmentCreatorModal } from "@/components/features/AssignmentCreatorModal";
import { Suspense } from "react";

function AssignmentsContent() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [viewAllSection, setViewAllSection] = useState<{ title: string; assignments: Assignment[] } | null>(null);

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
                    getAssignmentsAction(currentUser.role === 'student' ? (currentUser as any).classId : undefined),
                    getSubmissionsAction().then(subs =>
                        currentUser.role === 'teacher'
                            ? subs
                            : subs.filter(s => s.studentId === currentUser.id)
                    )
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

    const filteredAssignments = useMemo(() => {
        return assignments.filter(assignment => {
            if (searchQuery && !assignment.title.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            return true;
        });
    }, [assignments, searchQuery]);

    const categorizedAssignments = useMemo(() => {
        const result: { title: string; assignments: Assignment[]; icon: React.ReactNode; color: string }[] = [];
        if (!user) return result;

        if (user.role === 'teacher') {
            const drafts = filteredAssignments.filter(a => a.status === 'draft');
            const needsGrading = filteredAssignments.filter(a => {
                const subs = submissions.filter(s => s.assignmentId === a.id);
                return subs.some(s => s.status === 'submitted');
            });
            const active = filteredAssignments.filter(a => a.status === 'open' && !needsGrading.includes(a) && !drafts.includes(a));
            const closed = filteredAssignments.filter(a => a.status === 'closed');

            if (needsGrading.length > 0) result.push({ title: "Cần chấm bài", assignments: needsGrading, icon: <CheckCircle className="w-5 h-5" />, color: "text-amber-600 bg-amber-50" });
            if (active.length > 0) result.push({ title: "Đang mở", assignments: active, icon: <Clock className="w-5 h-5" />, color: "text-emerald-600 bg-emerald-50" });
            if (drafts.length > 0) result.push({ title: "Bản nháp", assignments: drafts, icon: <FileEdit className="w-5 h-5" />, color: "text-gray-600 bg-gray-50" });
            if (closed.length > 0) result.push({ title: "Đã đóng", assignments: closed, icon: <BookOpen className="w-5 h-5" />, color: "text-rose-600 bg-rose-50" });
        } else {
            const pending = filteredAssignments.filter(a => {
                const sub = submissions.find(s => s.assignmentId === a.id);
                return !sub;
            }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

            const submitted = filteredAssignments.filter(a => {
                const sub = submissions.find(s => s.assignmentId === a.id);
                return sub?.status === 'submitted';
            });

            const graded = filteredAssignments.filter(a => {
                const sub = submissions.find(s => s.assignmentId === a.id);
                return sub?.status === 'graded';
            });

            if (pending.length > 0) result.push({ title: "Cần làm ngay", assignments: pending, icon: <Clock className="w-5 h-5" />, color: "text-blue-600 bg-blue-50" });
            if (submitted.length > 0) result.push({ title: "Đã nộp bài", assignments: submitted, icon: <CheckCircle className="w-5 h-5" />, color: "text-amber-600 bg-amber-50" });
            if (graded.length > 0) result.push({ title: "Đã có kết quả", assignments: graded, icon: <BookOpen className="w-5 h-5" />, color: "text-emerald-600 bg-emerald-50" });
        }

        return result;
    }, [filteredAssignments, submissions, user]);

    if (loading) {
        return <AssignmentsPageSkeleton />;
    }

    if (!user) return null;

    return (
        <div className="page-container">
            <div className="page-content space-y-8 pb-20">
                <AssignmentCreatorModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={async () => {
                        const allAssignments = await getAssignmentsAction();
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
                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-medium text-white/80">
                                    {user.role === 'teacher' ? "Quản lý Giảng dạy" : "Trung tâm Học tập"}
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold mb-2">
                                {user.role === 'teacher' ? "Quản lý Bài tập" : "Nhiệm vụ của tôi"}
                            </h1>
                            <p className="text-white/80 text-sm max-w-md">
                                {user.role === 'teacher'
                                    ? "Thiết kế, giao bài và theo dõi tiến độ học tập của các lớp học bạn quản lý."
                                    : "Quản lý, theo dõi và hoàn thành các nhiệm vụ học tập để đạt kết quả tốt nhất."}
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

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="relative"
                >
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm bài tập..."
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    />
                </motion.div>

                {/* Categorized Sections */}
                <div className="space-y-12">
                    {categorizedAssignments.map((section, idx) => (
                        <motion.section
                            key={section.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${section.color}`}>
                                        {section.icon}
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800">{section.title}</h2>
                                    <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full font-bold">
                                        {section.assignments.length}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-6 overflow-x-auto pb-4 -mx-2 px-2 no-scrollbar snap-x snap-mandatory">
                                <AnimatePresence mode="popLayout">
                                    {section.assignments.slice(0, 5).map((assignment) => (
                                        <motion.div
                                            key={assignment.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="flex-none w-[280px] sm:w-[320px] snap-start"
                                        >
                                            <AssignmentCard assignment={assignment} user={user} submissions={submissions} />
                                        </motion.div>
                                    ))}
                                    {section.assignments.length > 5 && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setViewAllSection({ title: section.title, assignments: section.assignments })}
                                            className="flex-none w-[200px] h-full min-h-[220px] flex flex-col items-center justify-center gap-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 text-gray-500 hover:bg-gray-100 hover:border-blue-300 hover:text-blue-600 transition-all group snap-start"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                                                <Plus className="w-6 h-6" />
                                            </div>
                                            <span className="font-bold">Xem tất cả ({section.assignments.length})</span>
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.section>
                    ))}

                    {categorizedAssignments.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-20 flex flex-col items-center text-center"
                        >
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
                                <Search className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy bài tập nào</h3>
                            <p className="text-gray-500">Thử tìm kiếm với từ khóa khác nhé!</p>
                        </motion.div>
                    )}
                </div>
            </div>

            <SeeAllModal
                section={viewAllSection}
                onClose={() => setViewAllSection(null)}
                user={user}
                submissions={submissions}
            />
        </div>
    );
}

function SeeAllModal({ section, onClose, user, submissions }: { section: { title: string; assignments: Assignment[] } | null; onClose: () => void; user: User; submissions: Submission[] }) {
    if (!section) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                >
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                                <p className="text-sm text-gray-500">Tổng số {section.assignments.length} bài tập</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                            <Plus className="w-6 h-6 rotate-45" />
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto bg-gray-50/30">
                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {section.assignments.map((assignment) => (
                                <AssignmentCard key={assignment.id} assignment={assignment} user={user} submissions={submissions} />
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

function AssignmentCard({ assignment, user, submissions }: { assignment: Assignment; user: User; submissions: Submission[] }) {
    const submission = submissions.find(s => s.assignmentId === assignment.id);
    const isSubmitted = submission?.status === 'submitted';
    const isGraded = submission?.status === 'graded';
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isLate = now > dueDate && !isSubmitted && !isGraded;
    const isUrgent = daysLeft >= 0 && daysLeft <= 3 && !isSubmitted && !isGraded;
    const submissionCount = user.role === 'teacher' ? submissions.filter(s => s.assignmentId === assignment.id).length : 0;

    const urgencyStyles = isLate
        ? "border-rose-200 bg-rose-50/30 ring-1 ring-rose-100"
        : isUrgent
            ? "border-amber-200 bg-amber-50/30 ring-1 ring-amber-100"
            : "border-gray-100 bg-white";

    return (
        <Link href={user.role === 'teacher' ? `/dashboard/assignments/${assignment.id}/submissions` : `/dashboard/assignments/${assignment.id}`}>
            <div className={`${urgencyStyles} rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all h-full flex flex-col cursor-pointer group relative overflow-hidden border`}>
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
    );
}

export default function AssignmentsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AssignmentsContent />
        </Suspense>
    );
}
