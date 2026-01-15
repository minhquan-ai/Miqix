"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getCurrentUserAction, getAssignmentByIdAction, getSubmissionsByAssignmentIdAction } from "@/lib/actions";
import { getClassMembersAction } from "@/lib/class-member-actions";
import { Assignment, Submission, User } from "@/types";
import { ArrowLeft, BookOpen, Calendar, CheckCircle, Clock, FileText, Search, User as UserIcon, X } from "lucide-react";
import SubmissionView from "@/components/SubmissionView";
import { useToast } from "@/components/ui/Toast";

export default function AssignmentSubmissionsPage() {
    const params = useParams();
    const router = useRouter();
    const assignmentId = params.id as string;
    const { showToast } = useToast();

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    const loadData = async () => {
        try {
            const user = await getCurrentUserAction();
            if (!user) {
                router.push('/login');
                return;
            }
            setCurrentUser(user as any);

            if (user.role !== 'teacher') {
                router.push(`/dashboard/assignments/${assignmentId}`);
                return;
            }

            const assignmentData = await getAssignmentByIdAction(assignmentId);
            if (!assignmentData) {
                showToast("Bài tập không tồn tại", "error");
                router.push('/dashboard/assignments');
                return;
            }
            setAssignment(assignmentData);

            // Load submissions
            const subs = await getSubmissionsByAssignmentIdAction(assignmentId);
            setSubmissions(subs);

            // Load students from the first class
            if (assignmentData.classIds && assignmentData.classIds.length > 0) {
                const classId = assignmentData.classIds[0];
                const classMembers = await getClassMembersAction(classId);

                // getClassMembersAction already returns flat student objects
                const studentMembers = classMembers
                    .filter((m: any) => m.role === 'student')
                    .map((m: any) => ({
                        userId: m.id,
                        name: m.name,
                        email: m.email,
                        avatarUrl: m.avatarUrl,
                        role: m.role
                    }));
                setStudents(studentMembers);
            }

        } catch (error) {
            console.error("Failed to load data", error);
            showToast("Có lỗi xảy ra khi tải dữ liệu", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [assignmentId, router, showToast]);

    if (loading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;
    if (!currentUser || !assignment) return null;

    const selectedSubmission = selectedStudentId
        ? submissions.find(s => s.studentId === selectedStudentId) || null
        : null;

    const stats = {
        total: students.length,
        submitted: submissions.length,
        graded: submissions.filter(s => s.status === 'graded').length,
        late: submissions.filter(s => {
            const isLate = new Date(s.submittedAt) > new Date(assignment.dueDate);
            return isLate;
        }).length
    };

    return (
        <div className="page-container flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            {assignment.title}
                            <span className={`text-sm font-normal px-2 py-0.5 rounded ${assignment.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                {assignment.status === 'open' ? 'Đang mở' : 'Đã đóng'}
                            </span>
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Hạn nộp: {new Date(assignment.dueDate).toLocaleString('vi-VN')}</span>
                            <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {assignment.subject}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 h-full min-h-0">
                {/* Left Sidebar - Student List */}
                <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-border bg-muted/30">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold">Danh sách học sinh</h3>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                                {stats.submitted}/{stats.total} đã nộp
                            </span>
                        </div>

                        {/* Stats Mini-cards */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="bg-green-50 p-2 rounded border border-green-100 text-center">
                                <div className="text-lg font-bold text-green-700">{stats.graded}</div>
                                <div className="text-xs text-green-600">Đã chấm</div>
                            </div>
                            <div className="bg-orange-50 p-2 rounded border border-orange-100 text-center">
                                <div className="text-lg font-bold text-orange-700">{stats.total - stats.submitted}</div>
                                <div className="text-xs text-orange-600">Chưa nộp</div>
                            </div>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Tìm học sinh..."
                                className="w-full pl-9 pr-4 py-2 text-sm border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {students.map(student => {
                            const sub = submissions.find(s => s.studentId === student.userId);
                            const status = sub?.status || 'pending';
                            const isLate = sub && new Date(sub.submittedAt) > new Date(assignment.dueDate);
                            const isSelected = selectedStudentId === student.userId;

                            return (
                                <div
                                    key={student.userId}
                                    onClick={() => setSelectedStudentId(student.userId)}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-primary/10 border-primary/20 border' : 'hover:bg-muted border border-transparent'
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0 border border-border">
                                        <img src={student.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} alt={student.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{student.name}</div>
                                        <div className="flex items-center gap-2 text-xs">
                                            {status === 'graded' ? (
                                                <span className="text-green-600 font-bold">{sub?.score} điểm</span>
                                            ) : status === 'submitted' ? (
                                                <span className="text-blue-600 font-medium">Đã nộp</span>
                                            ) : (
                                                <span className="text-muted-foreground">Chưa nộp</span>
                                            )}
                                            {isLate && <span className="text-red-500 font-medium">• Muộn</span>}
                                        </div>
                                    </div>
                                    {status === 'graded' && <CheckCircle className="w-4 h-4 text-green-600" />}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Content - Grading Area */}
                <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm h-full">
                    {selectedStudentId ? (
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border border-border">
                                        <img
                                            src={students.find(s => s.userId === selectedStudentId)?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedStudentId}`}
                                            alt="Student"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">{students.find(s => s.userId === selectedStudentId)?.name}</h3>
                                        <div className="text-xs text-muted-foreground">
                                            {selectedSubmission ? `Nộp lúc: ${new Date(selectedSubmission.submittedAt).toLocaleString('vi-VN')}` : 'Chưa nộp bài'}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedStudentId(null)} className="p-2 hover:bg-muted rounded-full">
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <SubmissionView
                                    assignmentId={assignmentId}
                                    submission={selectedSubmission}
                                    currentUser={currentUser}
                                    isTeacher={true}
                                    dueDate={assignment.dueDate}
                                    classId={assignment.classIds?.[0] || ""}
                                    onSuccess={loadData}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <UserIcon className="w-8 h-8 opacity-50" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Chọn một học sinh</h3>
                            <p className="max-w-xs mx-auto">Chọn học sinh từ danh sách bên trái để xem bài làm và chấm điểm.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
