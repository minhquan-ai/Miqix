"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bot, CheckCircle, Save, User as UserIcon, Download, FileText } from "lucide-react";
import { DataService } from "@/lib/data";
import { AIService } from "@/lib/ai-service";
import { Assignment, Submission, User } from "@/types";
import { downloadFile } from "@/lib/fileUtils";
import { useToast } from "@/components/ui/Toast";

export default function GradingPage() {
    const params = useParams();
    const router = useRouter();
    // In a real app, we would fetch submission by ID. 
    // For this mock, we'll simulate fetching a specific submission.
    const submissionId = params.submissionId as string;

    const [submission, setSubmission] = useState<Submission | null>(null);
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [student, setStudent] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Grading State
    const [score, setScore] = useState<number>(0);
    const [feedback, setFeedback] = useState("");
    const [aiAnalysis, setAiAnalysis] = useState<{ score: number, feedback: string, errorAnalysis?: any } | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        async function loadData() {
            try {
                const submissionData = await DataService.getSubmissionById(submissionId);

                if (submissionData) {
                    setSubmission(submissionData);

                    const [assignData, studentData] = await Promise.all([
                        DataService.getAssignmentById(submissionData.assignmentId),
                        DataService.getCurrentUser() // In real app, fetch student by ID
                    ]);

                    if (assignData) setAssignment(assignData);

                    // Mock student data based on submission name (since we don't have a real user DB yet)
                    setStudent({
                        id: submissionData.studentId,
                        name: submissionData.studentName || "Học sinh ẩn danh",
                        email: "student@ergonix.com",
                        role: "student",
                        classId: "c1",
                        xp: 2450,
                        level: 5
                    });

                    // If already graded, pre-fill
                    if (submissionData.score) setScore(submissionData.score);
                    if (submissionData.feedback) setFeedback(submissionData.feedback);
                    if (submissionData.errorAnalysis) setAiAnalysis({
                        score: submissionData.score || 0,
                        feedback: submissionData.feedback || "",
                        errorAnalysis: submissionData.errorAnalysis
                    });
                }
            } catch (error) {
                console.error("Failed to load grading data", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [submissionId]);

    const handleAIAnalyze = async () => {
        if (!submission || !assignment) return;
        setAnalyzing(true);
        try {
            const analysis = await AIService.analyzeSubmission(submission.content, assignment.description);
            setAiAnalysis(analysis);
            setScore(analysis.score);
            setFeedback(analysis.feedback);
        } catch (error) {
            console.error("AI Analysis failed", error);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSave = async () => {
        if (!submission || !assignment) return;

        const maxScore = assignment.maxScore || 100;
        if (score < 0 || score > maxScore) {
            showToast(`Điểm số phải từ 0 đến ${maxScore}`, "error");
            return;
        }

        try {
            // Save score, feedback AND errorAnalysis
            await DataService.updateSubmission({
                ...submission,
                score,
                feedback,
                status: 'graded',
                errorAnalysis: aiAnalysis?.errorAnalysis
            });

            showToast("Đã lưu kết quả chấm điểm", "success");
            // Navigate back to submissions list for this assignment
            setTimeout(() => {
                router.push(`/dashboard/assignments/${submission.assignmentId}/submissions`);
            }, 1000);
        } catch (error) {
            console.error("Failed to save grading", error);
            showToast("Có lỗi xảy ra khi lưu kết quả", "error");
        }
    };

    if (loading) return <div className="p-8 text-center">Đang tải bài làm...</div>;
    if (!submission || !assignment || !student) return null;

    return (
        <div className="-m-8 p-8 h-[calc(100vh-65px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            Chấm bài: {assignment.title}
                        </h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <UserIcon className="w-3 h-3" />
                            Học sinh: <span className="font-medium text-foreground">{student.name}</span>
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                    <Save className="w-4 h-4" /> Lưu kết quả
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 flex-1 min-h-0">
                {/* Left: Student Submission */}
                <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-border bg-muted/30 font-medium">
                        Bài làm của học sinh
                    </div>
                    <div className="p-6 overflow-y-auto flex-1 space-y-4">
                        {/* Text Content */}
                        <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-wrap">{submission.content}</p>
                        </div>

                        {/* File Attachments */}
                        {submission.attachments && submission.attachments.length > 0 && (
                            <div className="border-t border-border pt-4 mt-4">
                                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    File đính kèm ({submission.attachments.length})
                                </h4>
                                <div className="space-y-2">
                                    {submission.attachments.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate">{file.name}</div>
                                                    <div className="text-xs text-muted-foreground">{file.size}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => downloadFile(file)}
                                                className="p-2 hover:bg-background rounded-md transition-colors"
                                                title="Tải xuống"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Grading & AI */}
                <div className="flex flex-col gap-6 overflow-y-auto pr-1">
                    {/* AI Analysis Card */}
                    <div className="bg-gradient-to-b from-indigo-50 to-white border border-indigo-100 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <Bot className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-indigo-900">AI Trợ giảng</h3>
                                    <p className="text-xs text-indigo-600">Hỗ trợ chấm điểm tự động</p>
                                </div>
                            </div>
                            <button
                                onClick={handleAIAnalyze}
                                disabled={analyzing}
                                className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {analyzing ? "Đang phân tích..." : "Phân tích ngay"}
                            </button>
                        </div>

                        {aiAnalysis ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-2 text-sm text-indigo-800">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Đề xuất điểm số: <strong>{aiAnalysis.score}/100</strong></span>
                                </div>

                                {/* Error Analysis Breakdown */}
                                {aiAnalysis.errorAnalysis && aiAnalysis.errorAnalysis.errors && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">Phân tích lỗi sai:</p>
                                        {aiAnalysis.errorAnalysis.errors.map((err: any, idx: number) => (
                                            <div key={idx} className="bg-white p-3 rounded-lg border border-indigo-100 text-sm shadow-sm">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <span className="font-semibold text-red-600 text-xs px-2 py-0.5 bg-red-50 rounded-full border border-red-100">
                                                        {err.category === 'concept' ? 'Kiến thức' :
                                                            err.category === 'calculation' ? 'Tính toán' :
                                                                err.category === 'presentation' ? 'Trình bày' : 'Khác'}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground font-medium">{err.point}</span>
                                                </div>
                                                <p className="text-indigo-900 mb-1">{err.explanation}</p>
                                                <p className="text-xs text-indigo-600 bg-indigo-50 p-1.5 rounded mt-1">
                                                    💡 Gợi ý ôn tập: {err.remedialAction}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="bg-white p-3 rounded-lg border border-indigo-100 text-sm text-indigo-800">
                                    <span className="font-semibold block mb-1">Nhận xét chung:</span>
                                    {aiAnalysis.feedback}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    * Đây là gợi ý từ AI. Giáo viên cần xem xét kỹ và điều chỉnh điểm số/nhận xét phù hợp trước khi lưu.
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Bấm "Phân tích ngay" để AI đọc bài làm và đưa ra gợi ý chấm điểm.
                            </p>
                        )}
                    </div>

                    {/* Manual Grading Form */}
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex-1">
                        <h3 className="font-semibold mb-4">Kết quả đánh giá</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Điểm số (0-{assignment.maxScore || 100})</label>
                                <input
                                    type="number"
                                    min="0"
                                    max={assignment.maxScore || 100}
                                    value={score}
                                    onChange={(e) => setScore(Number(e.target.value))}
                                    className="w-full px-3 py-2 rounded-md border border-input bg-background"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Nhận xét chi tiết</label>
                                <textarea
                                    rows={6}
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    className="w-full px-3 py-2 rounded-md border border-input bg-background resize-none"
                                    placeholder="Nhập nhận xét cho học sinh..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
