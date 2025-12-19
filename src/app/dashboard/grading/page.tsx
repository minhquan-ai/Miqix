"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle, Clock, Filter, Search, User as UserIcon } from "lucide-react";
import { DataService } from "@/lib/data";
import { getCurrentUserAction } from "@/lib/actions";
import { User } from "@/types";

interface PendingSubmission {
    id: string;
    studentName: string;
    studentAvatar?: string;
    assignmentTitle: string;
    className: string;
    submittedAt: string;
    isLate: boolean;
    assignmentId: string;
}

export default function GradingQueuePage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterClass, setFilterClass] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        async function loadData() {
            try {
                const user = await getCurrentUserAction();
                if (!user || user.role !== 'teacher') {
                    router.push('/dashboard');
                    return;
                }
                setCurrentUser(user);

                const pending = await DataService.getPendingSubmissions();
                setSubmissions(pending as any);
            } catch (error) {
                console.error("Failed to load grading queue", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [router]);

    if (loading) return <div className="p-8 text-center">Đang tải danh sách chấm điểm...</div>;
    if (!currentUser) return null;

    // Filter Logic
    const filteredSubmissions = submissions.filter(sub => {
        const matchesSearch = sub.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClass = filterClass === 'all' || sub.className === filterClass;
        return matchesSearch && matchesClass;
    });

    // Get unique classes for filter
    const uniqueClasses = Array.from(new Set(submissions.map(s => s.className)));

    return (
        <div className="space-y-6 -m-8 p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            if (window.history.length > 1) {
                                router.back();
                            } else {
                                router.push('/dashboard');
                            }
                        }}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Cần chấm điểm</h1>
                        <p className="text-muted-foreground">Danh sách các bài tập đã nộp đang chờ bạn chấm.</p>
                    </div>
                </div>
                <div className="bg-primary/10 text-primary px-4 py-2 rounded-full font-bold">
                    {submissions.length} bài cần chấm
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên học sinh hoặc bài tập..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <select
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                        className="p-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="all">Tất cả các lớp</option>
                        {uniqueClasses.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Submission List */}
            <div className="grid gap-4">
                {filteredSubmissions.length === 0 ? (
                    <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Tuyệt vời! Bạn đã chấm hết bài.</h3>
                        <p className="text-muted-foreground">Không còn bài tập nào cần chấm điểm lúc này.</p>
                    </div>
                ) : (
                    filteredSubmissions.map(sub => (
                        <Link key={sub.id} href={`/dashboard/assignments/${sub.assignmentId}/submissions`}>
                            <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {/* Student Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-muted overflow-hidden shrink-0 border border-border">
                                        <img
                                            src={sub.studentAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.studentName}`}
                                            alt={sub.studentName}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div>
                                        <div className="font-semibold text-lg group-hover:text-primary transition-colors">
                                            {sub.studentName}
                                        </div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                                            <span className="flex items-center gap-1">
                                                <BookOpen className="w-3 h-3" />
                                                {sub.assignmentTitle}
                                            </span>
                                            <span>•</span>
                                            <span className="bg-muted px-2 py-0.5 rounded text-xs">
                                                {sub.className}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Meta & Action */}
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-sm font-medium flex items-center gap-1 justify-end">
                                            <Clock className="w-3 h-3" />
                                            {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                                        </div>
                                        {sub.isLate ? (
                                            <div className="text-xs text-red-600 font-medium">Nộp muộn</div>
                                        ) : (
                                            <div className="text-xs text-green-600">Đúng hạn</div>
                                        )}
                                    </div>
                                    <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                                        Chấm ngay
                                    </button>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
