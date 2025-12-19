"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bot, CheckCircle, Download, FileText, Save, Send, User } from "lucide-react";
import { AIService } from "@/lib/ai-service";
import { getCurrentUserAction, getSubmissionByIdAction, getAssignmentByIdAction, updateSubmissionAction } from "@/lib/actions";
import { Assignment, Submission, User as UserType } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { downloadFile } from "@/lib/fileUtils";

export default function GradingPage() {
    const params = useParams();
    const router = useRouter();
    const submissionId = params.id as string;

    const [submission, setSubmission] = useState<Submission | null>(null);
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    // Grading State
    const [score, setScore] = useState<number | "">("");
    const [feedback, setFeedback] = useState("");
    const [errorAnalysis, setErrorAnalysis] = useState<any>(null);

    const { showToast } = useToast();

    useEffect(() => {
        async function loadData() {
            try {
                const sub = await getSubmissionByIdAction(submissionId);
                if (sub) {
                    setSubmission(sub);
                    setScore(sub.score !== undefined ? sub.score : "");
                    setFeedback(sub.feedback || "");
                    setErrorAnalysis(sub.errorAnalysis || null);

                    const assign = await getAssignmentByIdAction(sub.assignmentId);
                    if (assign) setAssignment(assign);
                }
            } catch (error) {
                console.error("Failed to load submission", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [submissionId]);

    const handleSave = async () => {
        if (!submission || score === "") return;

        setSaving(true);
        try {
            await updateSubmissionAction({
                id: submission.id,
                score: Number(score),
                feedback,
                errorAnalysis
            });
            showToast("Đã lưu điểm và nhận xét thành công!", "success");
            router.push("/dashboard/grading"); // Go back to queue
        } catch (error) {
            console.error("Failed to save grade", error);
            showToast("Có lỗi xảy ra khi lưu điểm.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleAIAnalyze = async () => {
        if (!assignment || !submission) return;

        setAnalyzing(true);
        try {
            const result = await AIService.analyzeSubmission(assignment.description, submission.content);
            setScore(result.score);
            setFeedback(result.feedback);
            setErrorAnalysis(result.errorAnalysis);
            showToast("AI đã phân tích xong! Hãy kiểm tra lại trước khi lưu.", "success");
        } catch (error) {
            console.error("AI Analysis failed", error);
            showToast("AI gặp sự cố khi phân tích.", "error");
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Đang tải bài làm...</div>;
    if (!submission || !assignment) return <div className="p-8 text-center">Không tìm thấy bài nộp.</div>;

    return (
        <div className="flex h-[calc(100vh-4rem)] -m-6">
            {/* Left Panel: Submission Content (Scrollable) */}
            <div className="flex-1 border-r border-border overflow-y-auto p-6 bg-muted/10">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold">{assignment.title}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="w-4 h-4" />
                            {submission.studentName}
                            <span>•</span>
                            {new Date(submission.submittedAt).toLocaleString('vi-VN')}
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm min-h-[500px]">
                    <h2 className="font-semibold mb-4 border-b border-border pb-2">Bài làm của học sinh</h2>

                    {/* Text Content */}
                    <div
                        className="prose max-w-none mb-6"
                        dangerouslySetInnerHTML={{ __html: submission.content }}
                    />

                    {/* Attachments */}
                    {submission.attachments && submission.attachments.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">File đính kèm:</h3>
                            {submission.attachments.map((file: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-primary" />
                                        <div>
                                            <div className="text-sm font-medium">{file.name}</div>
                                            <div className="text-xs text-muted-foreground">{file.size}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => downloadFile(file)}
                                        className="p-2 hover:bg-background rounded-md transition-colors"
                                    >
                                        <Download className="w-4 h-4 text-primary" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Grading Tools (Fixed width) */}
            <div className="w-[400px] bg-background p-6 flex flex-col gap-6 overflow-y-auto">
                <div>
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        Chấm điểm
                    </h2>

                    {/* AI Button */}
                    <button
                        onClick={handleAIAnalyze}
                        disabled={analyzing}
                        className="w-full mb-6 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                        <Bot className="w-5 h-5" />
                        {analyzing ? "AI đang chấm..." : "Chấm bằng AI"}
                    </button>

                    {/* Score Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Điểm số (0-100)</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={score}
                                onChange={(e) => setScore(Number(e.target.value))}
                                className="w-24 text-center text-2xl font-bold p-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                            <span className="text-muted-foreground font-medium">/ 100</span>
                        </div>
                    </div>

                    {/* Feedback Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Nhận xét</label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Nhập nhận xét cho học sinh..."
                            className="w-full h-40 p-3 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                        />
                    </div>

                    {/* AI Analysis Result (Hidden input but visible summary) */}
                    {errorAnalysis && (
                        <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border text-sm">
                            <div className="font-medium mb-2 flex items-center gap-2">
                                <Bot className="w-4 h-4" />
                                Phân tích từ AI
                            </div>
                            <div className="space-y-2 text-muted-foreground">
                                <p>• Hiểu bài: {errorAnalysis.categories?.understanding}/100</p>
                                <p>• Tính toán: {errorAnalysis.categories?.calculation}/100</p>
                                <p>• Trình bày: {errorAnalysis.categories?.presentation}/100</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-6 border-t border-border">
                    <button
                        onClick={handleSave}
                        disabled={saving || score === ""}
                        className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? "Đang lưu..." : "Hoàn tất & Trả bài"}
                    </button>
                </div>
            </div>
        </div>
    );
}
