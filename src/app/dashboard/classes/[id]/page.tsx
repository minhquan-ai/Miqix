"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Plus, Users, Trash2, Copy, Check } from "lucide-react";
import { DataService } from "@/lib/data";
import { useToast } from "@/components/ui/Toast";
import { Assignment, Class, Submission, User } from "@/types";
import Link from "next/link";

export default function ClassDetailPage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.id as string;

    const [classData, setClassData] = useState<Class | null>(null);
    const [students, setStudents] = useState<User[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [copied, setCopied] = useState(false);

    const copyCode = () => {
        if (classData?.code) {
            navigator.clipboard.writeText(classData.code);
            setCopied(true);
            showToast("Đã sao chép mã lớp", "success");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleRemoveStudent = async (studentId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa học sinh này khỏi lớp?")) return;

        try {
            await DataService.removeStudentFromClass(classId, studentId);
            setStudents(prev => prev.filter(s => s.id !== studentId));
            showToast("Đã xóa học sinh khỏi lớp", "success");
        } catch (error) {
            showToast("Có lỗi xảy ra khi xóa học sinh", "error");
        }
    };

    useEffect(() => {
        async function loadClassData() {
            if (!classId) return;

            try {
                const cls = await DataService.getClassById(classId);
                if (!cls) {
                    router.push('/dashboard');
                    return;
                }
                setClassData(cls);

                // Load students
                const classStudents = await DataService.getClassMembers(classId);
                setStudents(classStudents);

                // Load assignments for this class
                const allAssignments = await DataService.getAssignments();
                const classAssignments = allAssignments.filter(a => a.classIds.includes(classId));
                setAssignments(classAssignments);

                // Load submissions for these assignments
                const classSubmissions: Submission[] = [];
                for (const assignment of classAssignments) {
                    const subs = await DataService.getSubmissionsByAssignmentId(assignment.id);
                    classSubmissions.push(...subs);
                }
                setSubmissions(classSubmissions);

            } catch (error) {
                console.error("Failed to load class data", error);
            } finally {
                setLoading(false);
            }
        }

        loadClassData();
    }, [classId, router]);

    if (loading) return <div className="p-8 text-center">Đang tải dữ liệu lớp học...</div>;
    if (!classData) return null;

    return (
        <div className="space-y-8 -m-8 p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <button className="p-2 hover:bg-muted rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            {classData.name}
                            <span className="text-sm font-normal text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                                {classData.subject}
                            </span>
                        </h1>
                        <p className="text-muted-foreground">{classData.description}</p>
                    </div>
                </div>

                {/* Class Code Card */}
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">Mã lớp:</div>
                    <div className="text-2xl font-mono font-bold tracking-widest text-primary">{classData.code}</div>
                    <button
                        onClick={copyCode}
                        className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                        title="Sao chép mã lớp"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>

                {/* Analytics Modal Trigger (Skipped) */}
            </div>


            {/* Content Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Student List */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            Danh sách học sinh ({students.length})
                        </h3>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {students.map(student => (
                            <div key={student.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                        {student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">{student.name}</div>
                                        <div className="text-xs text-muted-foreground">{student.email}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-xs font-medium bg-background px-2 py-1 rounded border border-border">
                                        Lv.{student.level || 1}
                                    </div>
                                    <button
                                        onClick={() => handleRemoveStudent(student.id)}
                                        className="p-1.5 hover:bg-red-100 text-muted-foreground hover:text-red-600 rounded-md transition-colors"
                                        title="Xóa khỏi lớp"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Assignment List */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" />
                            Bài tập đã giao ({assignments.length})
                        </h3>
                        <Link href="/dashboard/assignments/create">
                            <button className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Thêm
                            </button>
                        </Link>
                    </div>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {assignments.map(assignment => {
                            const subCount = submissions.filter(s => s.assignmentId === assignment.id).length;
                            return (
                                <Link key={assignment.id} href={`/dashboard/assignments/${assignment.id}/submissions`}>
                                    <div className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium text-sm">{assignment.title}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${assignment.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {assignment.status === 'open' ? 'Đang mở' : 'Đã đóng'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Hạn: {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}</span>
                                            <span>{subCount}/{students.length} đã nộp</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
