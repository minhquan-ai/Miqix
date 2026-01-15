"use client";

import { useEffect, useState, Suspense } from "react";
import { getCurrentUserAction, getSubmissionsForTeacherAction, getAssignmentsAction } from "@/lib/actions";
import { Assignment, Submission } from "@/types";
import { ArrowLeft, Clock, FileText, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function ActivityPage() {
    const router = useRouter();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            const user = await getCurrentUserAction();
            if (user) {
                const [subs, assigns] = await Promise.all([
                    getSubmissionsForTeacherAction(user.id),
                    getAssignmentsAction()
                ]);
                setSubmissions(subs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
                setAssignments(assigns);
            }
            setLoading(false);
        }
        loadData();
    }, []);

    return (
        <div className="space-y-6 -m-8 p-8">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Hoạt động gần đây</h1>
                    <p className="text-muted-foreground">Theo dõi tất cả các bài nộp và cập nhật từ học sinh.</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">Đang tải hoạt động...</div>
            ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    {submissions.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            Chưa có hoạt động nào được ghi nhận.
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {submissions.map(sub => {
                                const assignment = assignments.find(a => a.id === sub.assignmentId);
                                return (
                                    <Link
                                        href={`/dashboard/grading/${sub.id}`}
                                        key={sub.id}
                                        className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${sub.status === 'graded' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            {sub.status === 'graded' ? <CheckCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-medium truncate">
                                                    {sub.studentName || 'Học sinh'}
                                                    <span className="font-normal text-muted-foreground ml-1">
                                                        {sub.status === 'graded' ? 'đã được chấm điểm' : 'đã nộp bài'}
                                                    </span>
                                                </p>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-primary group-hover:underline truncate">
                                                {assignment?.title || 'Bài tập không xác định'}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
