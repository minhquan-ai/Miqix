"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserAction, getAssignmentByIdAction, getStudentSubmissionAction } from "@/lib/actions";
import { Assignment, Submission, User } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";
import SubmissionView from "@/components/SubmissionView";
import RubricViewer from "@/components/RubricViewer";
import { BookOpen, Calendar, Clock, FileText, Star, Trophy, Sparkles, AlertTriangle, ArrowLeft } from "lucide-react";
import { MarkdownText } from "@/components/ui/MarkdownText";
import { FileAttachmentCard } from "@/components/ui/FileAttachmentCard";
import { ClassAI } from "@/components/features/ai/ClassAI";
import { motion, AnimatePresence } from "framer-motion";

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAI, setShowAI] = useState(false);

    const loadData = async () => {
        try {
            const currentUser = await getCurrentUserAction();
            if (!currentUser) {
                router.push('/login');
                return;
            }
            if (currentUser.role === 'student') {
                router.push(`/assignments/${id}`);
                return;
            }

            setUser(currentUser);
            // Teacher logic continues below or if we want to fetch submission for teacher (unlikely here)
            // Ideally teacher view fetches assignment stats or specific student submission via other routes/params
            const assignmentData = await getAssignmentByIdAction(id);
            if (!assignmentData) {
                // alert("Bài tập không tồn tại");
                router.push('/dashboard/assignments');
                return;
            }
            setAssignment(assignmentData);

        } catch (error) {
            console.error("Failed to load assignment", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id, router]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-2/3" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-6">
                        <Skeleton className="h-[400px] w-full rounded-xl" />
                    </div>
                    <div className="lg:col-span-4">
                        <Skeleton className="h-[300px] w-full rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!user || !assignment) return null;

    const isOverdue = new Date(assignment.dueDate) < new Date() && !submission;
    const timeLeft = new Date(assignment.dueDate).getTime() - new Date().getTime();
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-background/50">
            {/* Header / Top Bar */}
            <div className="bg-white dark:bg-card border-b border-border sticky top-0 z-30 shadow-sm backdrop-blur-xl bg-white/80 dark:bg-card/80">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <button
                                onClick={() => router.back()}
                                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Quay lại danh sách
                            </button>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                                {assignment.title}
                                {assignment.subject && (
                                    <span className="text-sm font-medium px-2.5 py-1 rounded-md bg-primary/10 text-primary align-middle border border-primary/20">
                                        {assignment.subject}
                                    </span>
                                )}
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* AI Button - Visible on Desktop */}
                            <button
                                onClick={() => setShowAI(true)}
                                className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all text-sm"
                            >
                                <Sparkles className="w-4 h-4" />
                                Trợ lý AI
                            </button>

                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${isOverdue
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-green-50 text-green-700 border-green-200'
                                }`}>
                                <Clock className="w-4 h-4" />
                                {isOverdue ? (
                                    <span>Đã hết hạn</span>
                                ) : (
                                    <span>
                                        Hạn: {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}
                                        <span className="hidden sm:inline opacity-75 ml-1">
                                            ({daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Hôm nay'})
                                        </span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col" style={{ minHeight: 'calc(100vh - 5rem)' }}>
                <div className="flex flex-col lg:flex-row gap-8 flex-1">
                    {/* Left Column: Assignment Content & Resources */}
                    <div className="lg:w-[58%] xl:w-[65%] space-y-8 animate-in slide-in-from-left-4 duration-500">
                        {/* Description Card */}
                        <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-foreground pb-4 border-b border-border">
                                <BookOpen className="w-5 h-5 text-blue-500" />
                                Nội dung hướng dẫn
                            </h3>
                            <div className="min-h-[200px]">
                                <MarkdownText content={assignment.description} className="text-base text-foreground/90" />
                            </div>
                        </div>

                        {/* Attachments Card */}
                        {assignment.attachments && assignment.attachments.length > 0 && (
                            <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                                    <FileText className="w-5 h-5 text-orange-500" />
                                    Tài liệu đính kèm ({assignment.attachments.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {assignment.attachments.map((file) => (
                                        <FileAttachmentCard key={file.id} attachment={file} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Rubric Card */}
                        {assignment.rubric && assignment.rubric.length > 0 && (
                            <div className="bg-white dark:bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                                <RubricViewer rubric={assignment.rubric} />
                            </div>
                        )}
                    </div>

                    {/* Right Column: Submission Panel */}
                    <div className="lg:flex-1 flex flex-col animate-in slide-in-from-right-4 duration-500 delay-100">
                        <div className="bg-white dark:bg-card border border-border rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none overflow-hidden flex flex-col flex-1">
                            <div className="px-4 py-3 border-b border-border bg-gray-50/50 dark:bg-muted/10 flex items-center justify-between shrink-0">
                                <h2 className="font-bold flex items-center gap-2 text-base">
                                    <Trophy className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    Bài làm của bạn
                                </h2>
                                {assignment.maxScore && (
                                    <span className="text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-1 rounded-full flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-current" />
                                        {assignment.maxScore} điểm
                                    </span>
                                )}
                            </div>

                            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                                <SubmissionView
                                    assignmentId={assignment.id}
                                    submission={submission}
                                    currentUser={user}
                                    isTeacher={user.role === 'teacher'}
                                    dueDate={new Date(assignment.dueDate).toISOString()}
                                    classId={assignment.classIds?.[0] || ""}
                                    onSuccess={loadData}
                                    aiEnabled={assignment.aiSettings?.enabled}
                                />
                            </div>
                        </div>

                        {/* Mobile AI Button (If needed explicitly, otherwise stick to FAB) */}
                        <div className="md:hidden bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg flex items-center justify-between cursor-pointer" onClick={() => setShowAI(true)}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div className="font-medium">Cần gợi ý làm bài?</div>
                            </div>
                            <ArrowLeft className="w-5 h-5 rotate-180" />
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Assistant Modal/Panel */}
            <AnimatePresence>
                {showAI && (
                    <ClassAI
                        onClose={() => setShowAI(false)}
                        user={user}
                        // Mock classes array since we are in single assignment context, 
                        // but ClassAI might expect a list. Providing current context is better.
                        classes={[{
                            id: assignment.classIds?.[0],
                            name: assignment.subject || "Lớp học",
                            subject: assignment.subject
                        }]}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
