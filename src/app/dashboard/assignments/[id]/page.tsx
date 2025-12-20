"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserAction, getAssignmentByIdAction, getStudentSubmissionAction } from "@/lib/actions";
import { Assignment, Submission, User } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";
import SubmissionView from "@/components/SubmissionView";
import RubricViewer from "@/components/RubricViewer";
import { BookOpen, Calendar, Clock, FileText, Star, Trophy } from "lucide-react";

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const currentUser = await getCurrentUserAction();
            if (!currentUser) {
                router.push('/login');
                return;
            }
            setUser(currentUser);

            const assignmentData = await getAssignmentByIdAction(id);
            if (!assignmentData) {
                alert("Bài tập không tồn tại");
                router.push('/dashboard/assignments');
                return;
            }
            setAssignment(assignmentData);

            if (currentUser.role === 'student') {
                const submissionData = await getStudentSubmissionAction(id, currentUser.id);
                if (submissionData) {
                    setSubmission(submissionData);
                }
            }
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
        return <div className="p-8">Đang tải...</div>;
    }

    if (!user || !assignment) return null;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{assignment.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
                            <Clock className="w-4 h-4" />
                            Hạn nộp: <span className="font-medium text-foreground">{new Date(assignment.dueDate).toLocaleString('vi-VN')}</span>
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Column: Assignment Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                        <div className="prose dark:prose-invert max-w-none">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary">
                                <BookOpen className="w-5 h-5" />
                                Nội dung bài tập
                            </h3>
                            <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed bg-muted/30 p-5 rounded-xl border border-border/50">
                                {assignment.description}
                            </div>
                        </div>

                        {assignment.attachments && assignment.attachments.length > 0 && (
                            <div className="pt-4 border-t border-border">
                                <h4 className="font-medium mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                                    <FileText className="w-4 h-4" />
                                    Tài liệu đính kèm
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Mock attachments display - In real app, map through assignment.attachments */}
                                    <div className="flex items-center gap-3 p-3 bg-card hover:bg-muted/50 rounded-lg border border-border transition-all cursor-pointer group">
                                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate group-hover:text-blue-700 transition-colors">Tai_lieu_tham_khao.pdf</p>
                                            <p className="text-xs text-muted-foreground">PDF • 2.4 MB</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Rubric Viewer */}
                    {assignment.rubric && assignment.rubric.length > 0 && (
                        <RubricViewer rubric={assignment.rubric} />
                    )}
                </div>

                {/* Right Column: Submission (Sticky) */}
                <div className="lg:col-span-1 lg:sticky lg:top-6 space-y-6">
                    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-border bg-muted/30">
                            <h2 className="font-semibold flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                Bài làm của bạn
                            </h2>
                        </div>

                        <div className="p-5">
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
                </div>
            </div>
        </div>
    );
}
