"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Clock, Search, User } from "lucide-react";
import { DataService } from "@/lib/data";
import { Assignment, Submission } from "@/types";
import Link from "next/link";

export default function SubmissionListPage() {
    const params = useParams();
    const router = useRouter();
    const assignmentId = params.id as string;

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        async function loadData() {
            try {
                const [assignData, subsData] = await Promise.all([
                    DataService.getAssignmentById(assignmentId),
                    DataService.getSubmissionsByAssignmentId(assignmentId)
                ]);

                if (assignData) setAssignment(assignData);
                setSubmissions(subsData);
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [assignmentId]);

    const filteredSubmissions = submissions.filter(sub =>
        sub.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center">Đang tải danh sách...</div>;
    if (!assignment) return null;

    return (
        <div className="space-y-6 -m-8 p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">{assignment.title}</h1>
                    <p className="text-muted-foreground">Danh sách bài nộp ({submissions.length} học sinh)</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm học sinh..."
                        className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <div className="px-3 py-1.5 rounded-md bg-green-50 text-green-700 text-sm font-medium border border-green-100">
                        Đã chấm: {submissions.filter(s => s.status === 'graded').length}
                    </div>
                    <div className="px-3 py-1.5 rounded-md bg-orange-50 text-orange-700 text-sm font-medium border border-orange-100">
                        Chờ chấm: {submissions.filter(s => s.status === 'submitted').length}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                        <tr>
                            <th className="px-6 py-3">Học sinh</th>
                            <th className="px-6 py-3">Thời gian nộp</th>
                            <th className="px-6 py-3">Trạng thái</th>
                            <th className="px-6 py-3">Điểm số</th>
                            <th className="px-6 py-3 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredSubmissions.map((sub) => (
                            <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                                <td className="px-6 py-4 font-medium flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {sub.studentName?.charAt(0)}
                                    </div>
                                    {sub.studentName}
                                </td>
                                <td className="px-6 py-4 text-muted-foreground">
                                    {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                                </td>
                                <td className="px-6 py-4">
                                    {sub.status === 'graded' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            <CheckCircle className="w-3 h-3" /> Đã chấm
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                            <Clock className="w-3 h-3" /> Chờ chấm
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 font-semibold">
                                    {sub.score !== undefined ? (
                                        <span className={sub.score >= 80 ? "text-green-600" : sub.score >= 50 ? "text-yellow-600" : "text-red-600"}>
                                            {sub.score}/100
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link href={`/dashboard/grading/${sub.id}`}>
                                        <button className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors">
                                            {sub.status === 'graded' ? "Xem lại" : "Chấm bài"}
                                        </button>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredSubmissions.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                        Không tìm thấy học sinh nào.
                    </div>
                )}
            </div>
        </div>
    );
}
