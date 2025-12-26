"use client";

import { useEffect, useState, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserAction, getAssignmentByIdAction, getStudentSubmissionAction, getUserEnrollmentsAction } from "@/lib/actions";
import { Assignment, Submission, User, Class } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";
import SubmissionView from "@/components/SubmissionView";
import RubricViewer from "@/components/RubricViewer";
import { BookOpen, Calendar, Clock, FileText, Star, Trophy, Sparkles, AlertTriangle, ArrowLeft, Menu, ChevronDown } from "lucide-react";
import { MarkdownText } from "@/components/ui/MarkdownText";
import { FileAttachmentCard } from "@/components/ui/FileAttachmentCard";
import { ClassAI } from "@/components/features/ai/ClassAI";
import { LearningAI } from "@/components/features/ai/LearningAI";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { NavigationProvider } from "@/components/NavigationProvider";

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAI, setShowAI] = useState(false);

    const [isZenMode, setIsZenMode] = useState(false);

    // Resize Logic - Optimized for smooth performance
    const [leftWidth, setLeftWidth] = useState(35); // Percentage
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | undefined>(undefined);

    const startResizing = useCallback(() => {
        setIsResizing(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
        }
    }, []);

    const resize = useCallback((mouseMoveEvent: MouseEvent) => {
        if (isResizing) {
            // Cancel any pending animation frame
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            // Schedule the update in the next animation frame
            rafRef.current = requestAnimationFrame(() => {
                const newWidth = (mouseMoveEvent.clientX / window.innerWidth) * 100;
                // Adjust limits based on zen mode (no sidebar = more space)
                const minWidth = isZenMode ? 20 : 15;
                const maxWidth = isZenMode ? 50 : 60;
                if (newWidth > minWidth && newWidth < maxWidth) {
                    setLeftWidth(newWidth);
                }
            });
        }
    }, [isResizing, isZenMode]);

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [resize, stopResizing]);

    const loadData = async () => {
        try {
            const currentUser = await getCurrentUserAction();
            if (!currentUser) {
                router.push('/login');
                return;
            }
            setUser(currentUser);

            const userClasses = await getUserEnrollmentsAction();
            setClasses(userClasses);

            let assignmentData = await getAssignmentByIdAction(id);
            if (!assignmentData) {
                router.push('/dashboard/assignments');
                return;
            }

            let submissionData: Submission | null = null;
            if (currentUser.role === 'student') {
                submissionData = await getStudentSubmissionAction(id, currentUser.id);
            }

            setAssignment(assignmentData);
            setSubmission(submissionData);

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
            <div className="flex h-screen bg-background text-foreground">
                <div className="hidden md:block w-64 border-r border-border p-4 h-full">
                    <Skeleton className="h-8 w-32 mb-8" />
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
                    </div>
                </div>
                <div className="flex-1 p-8 space-y-6 overflow-hidden">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-10 w-1/2 rounded-xl" />
                        <div className="flex gap-2">
                            <Skeleton className="h-10 w-24 rounded-xl" />
                            <Skeleton className="h-10 w-32 rounded-xl" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full">
                        <div className="md:col-span-1 space-y-4">
                            <Skeleton className="h-6 w-3/4 rounded-lg" />
                            <Skeleton className="h-40 w-full rounded-2xl" />
                            <Skeleton className="h-6 w-1/2 rounded-lg" />
                            <Skeleton className="h-20 w-full rounded-2xl" />
                        </div>
                        <div className="md:col-span-2 space-y-4">
                            <Skeleton className="h-full w-full rounded-2xl" />
                        </div>
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
        <NavigationProvider>
            <div className="flex h-screen bg-background text-foreground overflow-hidden">
                {/* App Sidebar - Hide in Zen Mode */}
                {!isZenMode && (
                    <Sidebar
                        user={user}
                        classes={classes}
                        isLoading={false}
                        counts={{
                            pendingAssignments: 5,
                            unreadNotifications: 3,
                            unreadMessages: 1,
                            draftAssignments: 0
                        }}
                    />
                )}

                {/* 2. Workspace Area */}
                <div className={`flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-zinc-950 transition-all ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
                    {/* Header - Hide in Zen Mode */}
                    {!isZenMode && (
                        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-border flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => router.push('/dashboard/assignments')}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl text-muted-foreground transition-all group"
                                >
                                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                                </button>
                                <div className="h-6 w-px bg-border/60 mx-1" />
                                <div className="flex flex-col min-w-0">
                                    <h1 className="text-base md:text-lg font-bold text-foreground line-clamp-1 flex items-center gap-3">
                                        <span className="truncate">{assignment.title}</span>
                                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] md:text-xs font-bold border border-primary/20 uppercase tracking-tighter">
                                            {assignment.subject || "Bài tập"}
                                        </span>
                                    </h1>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${isOverdue ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800'
                                    }`}>
                                    <Clock className="w-3.5 h-3.5" />
                                    {isOverdue ? "Hết hạn" : `Còn ${daysLeft} ngày`}
                                </div>
                                <button
                                    onClick={() => setShowAI(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <span className="hidden md:inline">Trợ lý AI</span>
                                </button>
                            </div>
                        </header>
                    )}

                    {/* Split View Container */}
                    <main className={`flex-1 flex overflow-hidden ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
                        {/* Left: Instructions - Always show but with different styling in Zen Mode */}
                        <div
                            ref={sidebarRef}
                            className={`bg-white dark:bg-zinc-900 border-r border-border overflow-y-auto custom-scrollbar relative ${isZenMode ? 'bg-gradient-to-b from-white to-gray-50/50 dark:from-zinc-900 dark:to-zinc-950/50' : ''}`}
                            style={{ width: `${leftWidth}%`, transition: isResizing ? 'none' : 'width 150ms ease-out' }}
                        >
                            {/* Zen Mode: Minimal header */}
                            {isZenMode && (
                                <div className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-border/50 px-6 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <BookOpen className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <h1 className="text-sm font-bold text-foreground line-clamp-1">{assignment.title}</h1>
                                            <p className="text-[10px] text-muted-foreground">Chế độ tập trung</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsZenMode(false)}
                                        className="text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        Thoát
                                    </button>
                                </div>
                            )}

                            <div className={`p-6 space-y-8 ${isZenMode ? 'pb-10' : 'pb-20'}`}>
                                <div>
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <BookOpen className="w-3.5 h-3.5" /> Hướng dẫn làm bài
                                    </h3>
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed">
                                        <MarkdownText content={assignment.description} />
                                    </div>
                                </div>

                                {assignment.attachments && assignment.attachments.length > 0 && (
                                    <div className="pt-4 border-t border-border/50">
                                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <FileText className="w-3.5 h-3.5" /> Tài liệu đính kèm
                                        </h3>
                                        <div className="space-y-2.5">
                                            {assignment.attachments.map((file) => (
                                                <FileAttachmentCard key={file.id} attachment={file} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {assignment.rubric && assignment.rubric.length > 0 && (
                                    <div className="pt-4 border-t border-border/50">
                                        <RubricViewer rubric={assignment.rubric} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Resize Handler - Works in both modes */}
                        <div
                            className={`w-1.5 hover:w-2 bg-transparent hover:bg-primary/30 cursor-col-resize z-10 -ml-[3px] flex items-center justify-center group ${isResizing ? 'bg-primary/20' : ''}`}
                            onMouseDown={startResizing}
                            style={{ transition: isResizing ? 'none' : 'all 150ms' }}
                        >
                            <div className={`h-10 w-1 rounded-full transition-colors ${isResizing ? 'bg-primary' : 'bg-border group-hover:bg-primary'}`} />
                        </div>

                        {/* Right: Submission Workspace */}
                        <div
                            style={{ width: `${100 - leftWidth}%`, transition: isResizing ? 'none' : 'width 150ms ease-out' }}
                            className={`flex-1 flex flex-col overflow-hidden relative ${isZenMode ? 'bg-gray-50 dark:bg-zinc-950' : 'bg-muted/5'}`}
                        >
                            <div className={`flex-1 overflow-hidden ${isZenMode ? 'p-4 lg:p-6' : 'p-6 lg:p-10'} max-w-5xl mx-auto w-full flex flex-col`}>
                                <div className={`bg-white dark:bg-zinc-900 border border-border shadow-xl shadow-black/5 flex-1 flex flex-col overflow-hidden ring-1 ring-black/5 ${isZenMode ? 'rounded-2xl' : 'rounded-[24px]'}`}>
                                    {/* Workspace Title Bar */}
                                    <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-gray-50/80 dark:bg-zinc-800/80 backdrop-blur-md">
                                        <div className="flex items-center gap-2.5 text-sm font-bold text-foreground">
                                            <div className="w-7 h-7 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                                                <Trophy className="w-4 h-4 text-yellow-600" />
                                            </div>
                                            <span>Bài làm của bạn</span>
                                        </div>
                                        {assignment.maxScore && (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-zinc-900 rounded-full border border-border shadow-sm">
                                                <Star className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                                                <span className="text-xs font-black tracking-tight">{assignment.maxScore} điểm</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Workspace Content */}
                                    <div className="p-0">
                                        <div className="p-6 md:p-8">
                                            <SubmissionView
                                                assignmentId={assignment.id}
                                                submission={submission}
                                                currentUser={user}
                                                isTeacher={user.role === 'teacher'}
                                                dueDate={new Date(assignment.dueDate).toISOString()}
                                                classId={assignment.classIds?.[0] || ""}
                                                onSuccess={loadData}
                                                aiEnabled={true}
                                                onToggleZenMode={() => setIsZenMode(prev => !prev)}
                                                isZenMode={isZenMode}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>

                {/* AI Assistant Drawer */}
                <AnimatePresence>
                    {showAI && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowAI(false)}
                                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
                            />
                            {/* Drawer */}
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed inset-y-0 right-0 w-full max-w-[500px] bg-white dark:bg-zinc-900 shadow-2xl z-[101] border-l border-border"
                            >
                                <LearningAI
                                    onClose={() => setShowAI(false)}
                                    user={user}
                                    assignmentTitle={assignment.title}
                                    assignmentContext={assignment.description}
                                    submissionContext={submission?.content || ""}
                                />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </NavigationProvider>
    );
}
