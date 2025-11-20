"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Bot, Calendar, CheckCircle, Clock, Send, Trophy, Download, FileText } from "lucide-react";
import { DataService } from "@/lib/data";
import { AIService } from "@/lib/ai-service";
import { Assignment, Submission, User, FileAttachment } from "@/types";
import { cn } from "@/lib/utils";
import { FileUpload } from "@/components/ui/FileUpload";
import { fileToAttachment, downloadFile } from "@/lib/fileUtils";
import { useToast } from "@/components/ui/Toast";
import { ErrorCategoryChart } from "@/components/charts/ErrorCategoryChart";
import { RemedialChecklist } from "@/components/analysis/RemedialChecklist";

export default function AssignmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);
    const [submissionContent, setSubmissionContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // File upload state
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [attachments, setAttachments] = useState<FileAttachment[]>([]);

    // AI Tutor State
    const [aiHint, setAiHint] = useState<string | null>(null);
    const [askingAi, setAskingAi] = useState(false);

    const { showToast } = useToast();

    useEffect(() => {
        async function loadData() {
            if (!id) return;
            try {
                const [assignmentData, userData] = await Promise.all([
                    DataService.getAssignmentById(id),
                    DataService.getCurrentUser()
                ]);

                if (assignmentData) {
                    setAssignment(assignmentData);
                    setCurrentUser(userData);

                    // Check if student already submitted
                    if (userData.role === 'student') {
                        const submission = await DataService.getStudentSubmission(id, userData.id);
                        if (submission) {
                            setExistingSubmission(submission);
                            setSubmissionContent(submission.content);
                        }
                    }
                } else {
                    router.push("/dashboard");
                }
            } catch (error) {
                console.error("Failed to load assignment", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id, router]);



    const handleAskAI = async () => {
        if (!assignment) return;
        setAskingAi(true);
        try {
            const hint = await AIService.getHint(assignment.description, submissionContent);
            setAiHint(hint);
        } catch (error) {
            console.error("Failed to get AI hint", error);
        } finally {
            setAskingAi(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Đang tải...</div>;
    if (!assignment || !currentUser) return null;

    const isGraded = existingSubmission?.status === 'graded';
    const isSubmitted = existingSubmission?.status === 'submitted';

    const now = Date.now();
    const dueDate = new Date(assignment.dueDate).getTime();
    const isOverdue = now > dueDate;

    const timeRemaining = dueDate - now;
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60));

    const handleSubmit = async () => {
        if (!submissionContent.trim() || !assignment || !currentUser) return;

        if (!window.confirm("Bạn có chắc chắn muốn nộp bài không? Bạn sẽ không thể chỉnh sửa sau khi nộp.")) {
            return;
        }

        setSubmitting(true);
        try {
            const newSubmission = await DataService.submitAssignment({
                assignmentId: id,
                studentId: currentUser.id,
                content: submissionContent,
                attachments: attachments.length > 0 ? attachments : undefined
            });
            setExistingSubmission(newSubmission);

            // Gamification Feedback
            showToast(`🎉 Nộp bài thành công! Bạn đã nhận được điểm kinh nghiệm.`, 'success');

            // Simulate Badge Unlock (Mock)
            setTimeout(() => {
                showToast(`🏆 Mở khóa huy hiệu: "Chiến binh Chăm chỉ"`, 'success');
            }, 1500);

        } catch (error) {
            console.error("Failed to submit assignment", error);
            showToast("Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.", 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFilesSelected = async (files: File[]) => {
        setUploadedFiles(files);
        // Convert files to attachments
        const newAttachments = await Promise.all(
            files.map(file => fileToAttachment(file))
        );
        setAttachments(newAttachments);
    };

    // ... (keep handleAskAI)

    if (loading) return <div className="p-8 text-center">Đang tải...</div>;
    if (!assignment || !currentUser) return null;

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
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-blue-100 text-blue-600">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{assignment.title}</h1>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Hạn nộp: {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}
                                    {!isOverdue && daysRemaining > 0 && <span className="text-orange-600 font-medium">({daysRemaining} ngày nữa)</span>}
                                    {!isOverdue && daysRemaining <= 0 && hoursRemaining > 0 && <span className="text-orange-600 font-medium">({hoursRemaining} giờ nữa)</span>}
                                    {isOverdue && <span className="text-red-600 font-medium">(Đã hết hạn)</span>}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Trophy className="w-3 h-3 text-yellow-600" />
                                    {assignment.xpReward} XP
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Badge */}
            {isGraded && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-green-900">Bài tập đã được chấm điểm!</h3>
                        <p className="text-sm text-green-700">Xem kết quả chi tiết bên dưới</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-green-600">{existingSubmission?.score}</div>
                        <div className="text-xs text-green-700">điểm</div>
                    </div>
                </div>
            )}

            {isSubmitted && !isGraded && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
                    <Clock className="w-6 h-6 text-orange-600" />
                    <div>
                        <h3 className="font-semibold text-orange-900">Đã nộp bài - Đang chờ chấm điểm</h3>
                        <p className="text-sm text-orange-700">Giáo viên sẽ sớm chấm và gửi kết quả cho bạn</p>
                    </div>
                </div>
            )}

            {/* Assignment Description */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h2 className="font-semibold text-lg mb-3">Mô tả bài tập</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{assignment.description}</p>

                {/* Teacher Attachments */}
                {assignment.attachments && assignment.attachments.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border">
                        <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Tài liệu đính kèm ({assignment.attachments.length})
                        </h3>
                        <div className="grid gap-2 md:grid-cols-2">
                            {assignment.attachments.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors border border-border/50">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <FileText className="w-5 h-5 text-primary shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{file.name}</div>
                                            <div className="text-xs text-muted-foreground">{file.size}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => downloadFile(file)}
                                        className="ml-2 p-2 hover:bg-background rounded-md transition-colors"
                                        title="Tải xuống"
                                    >
                                        <Download className="w-4 h-4 text-primary" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Graded Results (if graded) */}
            {isGraded && existingSubmission && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm space-y-4">
                    <h2 className="font-semibold text-lg text-green-900 flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Kết quả đánh giá
                    </h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-green-100">
                            <div className="text-sm text-muted-foreground mb-1">Điểm số</div>
                            <div className="text-4xl font-bold text-green-600">{existingSubmission.score}/100</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-green-100">
                            <div className="text-sm text-muted-foreground mb-1">Trạng thái</div>
                            <div className="flex items-center gap-2 text-green-700 font-medium">
                                <CheckCircle className="w-5 h-5" />
                                Đã hoàn thành
                            </div>
                        </div>
                    </div>

                    {existingSubmission.feedback && (
                        <div className="bg-white rounded-lg p-4 border border-green-100">
                            <div className="text-sm font-medium text-green-900 mb-2">Nhận xét của giáo viên</div>
                            <p className="text-muted-foreground whitespace-pre-wrap">{existingSubmission.feedback}</p>
                        </div>
                    )}

                    {/* Error Analysis for Student */}
                    {existingSubmission.errorAnalysis && (
                        <div className="bg-white rounded-lg p-6 border border-border space-y-6">
                            <div className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                Phân tích lỗi sai chi tiết
                            </div>

                            {/* Error Category Chart */}
                            <ErrorCategoryChart categories={existingSubmission.errorAnalysis.categories} />

                            {/* Remedial Checklist */}
                            <RemedialChecklist
                                submissionId={existingSubmission.id}
                                suggestions={existingSubmission.errorAnalysis.suggestions}
                                mainIssues={existingSubmission.errorAnalysis.mainIssues}
                            />
                        </div>
                    )}
                    {/* Submission */}
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <h2 className="font-semibold text-lg mb-4">Nộp bài</h2>
                        <textarea
                            rows={8}
                            value={submissionContent}
                            onChange={(e) => setSubmissionContent(e.target.value)}
                            disabled={isSubmitted || isOverdue}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background resize-none mb-4 disabled:opacity-60"
                            placeholder={
                                isSubmitted ? "Bạn đã nộp bài này rồi" :
                                    isOverdue ? "Bài tập đã hết hạn nộp" :
                                        "Nhập câu trả lời hoặc link tài liệu..."
                            }
                        />

                        {/* File Upload */}
                        {!isSubmitted && !isOverdue && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Đính kèm file (tùy chọn)</label>
                                <FileUpload
                                    onFilesSelected={handleFilesSelected}
                                    maxFiles={5}
                                />
                            </div>
                        )}

                        {/* Show submitted files if exists */}
                        {existingSubmission?.attachments && existingSubmission.attachments.length > 0 && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">File đã nộp</label>
                                <div className="space-y-2">
                                    {existingSubmission.attachments.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate">{file.name}</div>
                                                <div className="text-xs text-muted-foreground">{file.size}</div>
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

                        {!isSubmitted && !isOverdue && (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !submissionContent.trim()}
                                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                                {submitting ? "Đang nộp..." : "Nộp bài"}
                            </button>
                        )}
                        {isOverdue && !isSubmitted && (
                            <div className="text-center p-3 bg-red-50 text-red-600 rounded-md text-sm font-medium">
                                Đã hết hạn nộp bài
                            </div>
                        )}
                    </div>

                    {/* AI Tutor */}
                    <div className="bg-gradient-to-b from-indigo-50 to-white border border-indigo-100 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <Bot className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-indigo-900">AI Tutor</h3>
                                <p className="text-xs text-indigo-600">Trợ lý học tập của bạn</p>
                            </div>
                        </div>

                        {aiHint ? (
                            <div className="bg-white p-4 rounded-lg border border-indigo-100 mb-4">
                                <p className="text-sm text-indigo-900 whitespace-pre-wrap">{aiHint}</p>
                            </div>
                        ) : (
                            <div className="bg-white p-4 rounded-lg border border-indigo-100 mb-4 text-sm text-muted-foreground">
                                Bạn cần hướng dẫn? Hỏi AI Tutor để nhận gợi ý!
                            </div>
                        )}

                        <button
                            onClick={handleAskAI}
                            disabled={askingAi || !submissionContent.trim()}
                            className="w-full text-sm bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            {askingAi ? "Đang suy nghĩ..." : "Hỏi AI Tutor"}
                        </button>
                    </div>
                </div>
            )
            }
        </div >
    );
}
