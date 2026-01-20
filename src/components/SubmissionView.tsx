import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Send, X, Loader2, Sparkles, Bot, Trash2, Save, Maximize, Minimize, Mic, Video } from "lucide-react";
import { Submission, User, FileAttachment } from "@/types";
import { submitAssignmentAction, gradeAssignmentAction, checkAssignmentDraftAction } from "@/lib/actions";
import { processTextWithAIAction } from "@/lib/ai-text-action";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { FileAttachmentCard } from "./ui/FileAttachmentCard";
import Editor from "./ui/Editor";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./ui/Toast";
import { MultimediaRecorder } from "./ui/MultimediaRecorder";
import { formatScore } from "@/lib/score-utils";

interface SubmissionViewProps {
    assignmentId: string;
    submission: Submission | null;
    currentUser: User;
    isTeacher: boolean;
    dueDate: string;
    classId: string;
    onSuccess?: () => void;
    aiEnabled?: boolean;
    onToggleZenMode?: () => void;
    isZenMode?: boolean;
}

export default function SubmissionView({ assignmentId, submission, currentUser, isTeacher, dueDate, classId, onSuccess, aiEnabled, onToggleZenMode, isZenMode }: SubmissionViewProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isCheckingAI, setIsCheckingAI] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<{ feedback: string, suggestions: string[], scoreEstimate: string } | null>(null);

    // Student State
    const [content, setContent] = useState(submission?.content || "");
    const [files, setFiles] = useState<FileAttachment[]>(submission?.attachments || []);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeRecorder, setActiveRecorder] = useState<'audio' | 'video' | null>(null);

    // Teacher State
    const [score, setScore] = useState(submission?.score || 0);
    const [feedback, setFeedback] = useState(submission?.feedback || "");

    const isLate = !submission && new Date() > new Date(dueDate);
    const isGraded = submission?.status === 'graded';

    // Sync state with prop if submission changes (e.g. after loading)
    useEffect(() => {
        if (submission) {
            setContent(submission.content || "");
            setFiles(submission.attachments || []);
            setScore(submission.score || 0);
            setFeedback(submission.feedback || "");
        }
    }, [submission]);

    // Auto-save logic
    useEffect(() => {
        if (!submission && !isTeacher) {
            const savedContent = localStorage.getItem(`draft_${assignmentId}`);
            if (savedContent && !content) {
                setContent(savedContent);
            }
        }
    }, [assignmentId, submission, isTeacher]);

    useEffect(() => {
        if (!submission && !isTeacher && content) {
            setIsSaving(true);
            const timer = setTimeout(() => {
                localStorage.setItem(`draft_${assignmentId}`, content);
                setLastSaved(new Date());
                setIsSaving(false);
            }, 1000); // Save after 1 second of inactivity

            return () => clearTimeout(timer);
        }
    }, [content, assignmentId, submission, isTeacher]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                if (!submission && content) {
                    localStorage.setItem(`draft_${assignmentId}`, content);
                    setLastSaved(new Date());
                    setIsSaving(false);
                    showToast("Đã lưu nháp thủ công", "success");
                }
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                if (!submission) {
                    // Only trigger if we have a form reference or similar, but for now let's just show a toast or rely on the button
                    // A proper implementation would need `handleStudentSubmit` to be callable here, checking "content"
                    // Since handleStudentSubmit is defined below, we might need to move this effect or just use a ref for the submit function if strictness is needed.
                    // For simplicity in this iteration, let's just inform the user or use a ref submit button click.
                    const submitBtn = document.getElementById('submit-assignment-btn');
                    if (submitBtn) submitBtn.click();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [assignmentId, submission, content, showToast]);

    // File Upload Handler
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', acceptedFiles[0]); // Handle one file at a time or loop for multiple
            formData.append('classId', classId || 'general');

            const response = await fetch('/api/upload-resource', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            const newFile: FileAttachment = {
                id: Date.now().toString(),
                name: acceptedFiles[0].name,
                url: data.fileUrl,
                type: acceptedFiles[0].type,
                size: acceptedFiles[0].size,
                uploadedAt: new Date().toISOString()
            };

            setFiles(prev => [...prev, newFile]);
            showToast("Tải lên thành công", "success");
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Có lỗi xảy ra khi tải tệp lên', "error");
        } finally {
            setIsUploading(false);
        }
    }, [classId, showToast]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        disabled: !!submission || isUploading,
        maxSize: 10 * 1024 * 1024 // 10MB
    });

    const removeFile = (fileId: string) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const handleStudentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Allow text (checking for stripped content) or files
        const hasText = content.replace(/<[^>]*>?/gm, '').trim().length > 0;

        if (!hasText && files.length === 0) {
            showToast("Vui lòng nhập nội dung hoặc đính kèm tệp", "error");
            return;
        }

        setIsLoading(true);
        try {
            const result = await submitAssignmentAction({
                assignmentId,
                studentId: currentUser.id,
                content,
                attachments: files
            });
            if (result.success) {
                showToast("Nộp bài thành công!", "success");
                localStorage.removeItem(`draft_${assignmentId}`); // Clear draft
                router.refresh();
                if (onSuccess) onSuccess();
            } else {
                showToast(result.message || "Lỗi khi nộp bài", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Lỗi khi nộp bài", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAICheck = async () => {
        const plainText = content.replace(/<[^>]*>?/gm, '');
        if (!plainText || plainText.length < 10) {
            showToast("Vui lòng nhập ít nhất 10 ký tự để AI kiểm tra.", "error");
            return;
        }
        setIsCheckingAI(true);
        setAiFeedback(null);
        try {
            const result = await checkAssignmentDraftAction(assignmentId, plainText);
            if (result.success) {
                setAiFeedback({
                    feedback: result.feedback || "Không có phản hồi",
                    suggestions: result.suggestions || [],
                    scoreEstimate: result.scoreEstimate || "Chưa xác định"
                });
            } else {
                showToast(result.message || "Lỗi khi kiểm tra bài", "error");
            }
        } catch (error) {
            console.error("AI Check Error:", error);
            showToast("Lỗi khi kết nối với AI.", "error");
        } finally {
            setIsCheckingAI(false);
        }
    };

    const handleTeacherGrade = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!submission) return;

        setIsLoading(true);
        try {
            const result = await gradeAssignmentAction(submission.id, score, feedback);
            if (result.success) {
                showToast("Đã lưu kết quả chấm điểm", "success");
                router.refresh();
                if (onSuccess) onSuccess();
            } else {
                showToast(result.message || "Lỗi khi chấm điểm", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Lỗi khi chấm điểm", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // --- TEACHER VIEW ---
    if (isTeacher) {
        if (!submission) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                        <AlertCircle className="w-6 h-6 opacity-50" />
                    </div>
                    <p>Học sinh chưa nộp bài</p>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div className="bg-white dark:bg-card p-5 rounded-xl border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            Bài làm của học sinh
                        </h3>
                        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                            {new Date(submission.submittedAt).toLocaleString('vi-VN')}
                            {isLate && <span className="text-destructive font-medium ml-1">(Muộn)</span>}
                        </div>
                    </div>

                    <div className="prose prose-sm max-w-none dark:prose-invert bg-muted/30 p-4 rounded-lg border border-border/50 mb-4" dangerouslySetInnerHTML={{ __html: submission.content || '<span class="italic text-muted-foreground">Không có nội dung văn bản</span>' }} />

                    {submission.attachments && submission.attachments.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tệp đính kèm ({submission.attachments.length})</h4>
                            <div className="grid grid-cols-1 gap-2">
                                {submission.attachments.map((file: FileAttachment) => (
                                    <FileAttachmentCard key={file.id} attachment={file} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleTeacherGrade} className="bg-white dark:bg-card p-5 rounded-xl border border-border shadow-sm space-y-4">
                    <h3 className="font-semibold text-lg">Chấm điểm & Nhận xét</h3>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Điểm số (0-10)</label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                required
                                className="w-full pl-4 pr-12 py-2.5 rounded-lg border border-input bg-background font-medium text-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                value={score}
                                onChange={e => setScore(parseFloat(e.target.value) || 0)}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">/ 10</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Nhận xét</label>
                        <textarea
                            rows={4}
                            className="w-full p-3 rounded-lg border border-input bg-background resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            placeholder="Nhập lời nhận xét, động viên..."
                        />
                        {/* Feedback Bank */}
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-thin">
                            {["Làm tốt lắm! 🌟", "Cần cố gắng hơn 💪", "Bài làm chi tiết 👌", "Cẩn thận tính toán 🧮"].map(fb => (
                                <button
                                    key={fb}
                                    type="button"
                                    onClick={() => setFeedback(prev => prev ? prev + "\n" + fb : fb)}
                                    className="text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-full whitespace-nowrap transition-colors"
                                >
                                    {fb}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Đang lưu...</span>
                            </div>
                        ) : "Lưu kết quả"}
                    </button>
                </form>
            </div>
        );
    }

    // --- STUDENT VIEW ---
    if (isGraded) {
        return (
            <div className="bg-white dark:bg-card border border-border p-8 rounded-xl text-center space-y-6 shadow-sm">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400"
                >
                    <CheckCircle className="w-10 h-10" />
                </motion.div>

                <div className="space-y-2">
                    <h3 className="text-xl font-bold">Đã chấm điểm</h3>
                    <div className="text-5xl font-black text-green-600 dark:text-green-400 tracking-tighter">
                        {formatScore(submission.score)}
                        <span className="text-2xl text-muted-foreground font-medium ml-1">/10</span>
                    </div>
                </div>

                {submission.feedback && (
                    <div className="bg-muted/50 p-5 rounded-xl text-left border border-border/50 relative">
                        <div className="absolute -top-3 left-4 bg-background px-2 text-xs font-semibold text-muted-foreground">
                            Lời nhận xét
                        </div>
                        <p className="text-foreground/90 italic leading-relaxed">&quot;{submission.feedback}&quot;</p>
                    </div>
                )}

                <button
                    onClick={() => {
                        // Optional: Allow requesting re-grade or just view details
                    }}
                    className="text-sm font-medium text-primary hover:underline"
                >
                    Xem chi tiết bài sửa
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleStudentSubmit} className="flex flex-col h-full">
            {isLate && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 flex items-start gap-4 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-4 rounded-2xl text-sm"
                >
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="font-bold block text-base leading-tight">Quá hạn nộp bài</span>
                        <span className="opacity-80">Bài tập đã kết thúc thời gian nộp. Phản hồi của bạn vẫn được ghi nhận nhưng sẽ bị đánh dấu là "Nộp muộn".</span>
                    </div>
                </motion.div>
            )}

            <div className="space-y-6 flex-1 flex flex-col">
                {/* Content Input - Redesigned */}
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col">
                    {/* Compact Header */}
                    <div className="px-4 py-3 border-b border-border/50 bg-gradient-to-r from-gray-50/80 to-white dark:from-zinc-800/50 dark:to-zinc-900/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    Nội dung bài làm
                                    {lastSaved && !submission && (
                                        <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full transition-all ${isSaving
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            }`}>
                                            {isSaving ? (
                                                <>
                                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                                    Đang lưu...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-2.5 h-2.5" />
                                                    Đã lưu
                                                </>
                                            )}
                                        </span>
                                    )}
                                </h3>
                                <p className="text-[11px] text-muted-foreground">
                                    Viết trực tiếp hoặc dán nội dung từ nguồn khác
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {onToggleZenMode && !submission && (
                                <button
                                    type="button"
                                    onClick={onToggleZenMode}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-background hover:bg-muted/50 rounded-lg transition-all border border-border/50"
                                    title={isZenMode ? "Thoát chế độ tập trung" : "Chế độ tập trung"}
                                >
                                    {isZenMode ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                                    <span className="hidden sm:inline">{isZenMode ? "Thu nhỏ" : "Tập trung"}</span>
                                </button>
                            )}
                            {aiEnabled && !submission && (
                                <button
                                    type="button"
                                    onClick={handleAICheck}
                                    disabled={isCheckingAI || !content}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
                                >
                                    {isCheckingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                    <span className="hidden sm:inline">AI Góp ý</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 min-h-[200px]">
                        <Editor
                            value={content}
                            onChange={setContent}
                            placeholder="Bắt đầu viết nội dung bài làm tại đây..."
                            disabled={!!submission}
                            onAIRequest={async (text, command) => {
                                const result = await processTextWithAIAction(text, command);
                                if (result.success) {
                                    return result.result || null;
                                } else {
                                    showToast(result.message || "Lỗi AI", "error");
                                    return null;
                                }
                            }}
                        />
                    </div>
                </div>

                {/* AI Feedback Panel */}
                <AnimatePresence>
                    {aiFeedback && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 border border-purple-200 dark:border-purple-800/50 rounded-2xl overflow-hidden shadow-sm"
                        >
                            <div className="p-5 space-y-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
                                        <Bot className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-purple-900 dark:text-purple-300">Gợi ý từ AI thông thái</span>
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Dựa trên tiêu chí chấm điểm của bạn</span>
                                    </div>
                                    <div className="ml-auto px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-black">
                                        ~{aiFeedback.scoreEstimate}đ
                                    </div>
                                </div>
                                <div className="bg-white/60 dark:bg-black/20 p-4 rounded-xl text-sm leading-relaxed text-foreground/90 border border-white/40">
                                    {aiFeedback.feedback}
                                </div>
                                {aiFeedback.suggestions.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {aiFeedback.suggestions.map((s, i) => (
                                            <div key={i} className="flex items-start gap-2 p-2.5 bg-white/40 dark:bg-black/10 rounded-lg text-xs text-muted-foreground border border-black/5">
                                                <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                                                <span>{s}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* File Attachment Section */}
                <div className="pt-3 border-t border-border/50">
                    {/* Section Header - only show when has files */}
                    {files.length > 0 && (
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Upload className="w-4 h-4 text-primary" />
                                <span className="text-sm font-bold text-foreground">Tệp đính kèm</span>
                                <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">
                                    {files.length}
                                </span>
                            </div>
                            {!submission && (
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setActiveRecorder(activeRecorder === 'audio' ? null : 'audio')}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeRecorder === 'audio'
                                            ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                                            : 'text-amber-600 hover:bg-amber-50'
                                            }`}
                                    >
                                        <Mic className="w-3.5 h-3.5" />
                                        Ghi âm
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveRecorder(activeRecorder === 'video' ? null : 'video')}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeRecorder === 'video'
                                            ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
                                            : 'text-blue-600 hover:bg-blue-50'
                                            }`}
                                    >
                                        <Video className="w-3.5 h-3.5" />
                                        Video
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Empty State - 3 Large Action Cards */}
                    {!submission && files.length === 0 && !activeRecorder && (
                        <div className="grid grid-cols-3 gap-3">
                            {/* Upload File Card */}
                            <div
                                {...getRootProps()}
                                className={`
                                    flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all group
                                    ${isDragActive
                                        ? 'border-primary bg-primary/5 scale-[1.02]'
                                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                                    }
                                `}
                            >
                                <input {...getInputProps()} />
                                <div className={`
                                    w-14 h-14 rounded-2xl mb-3 flex items-center justify-center transition-all duration-300
                                    ${isDragActive
                                        ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30'
                                        : 'bg-gradient-to-br from-primary/20 to-primary/5 text-primary group-hover:scale-110'
                                    }
                                `}>
                                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                                </div>
                                <p className="text-sm font-semibold text-foreground mb-0.5">
                                    {isDragActive ? 'Thả file!' : 'Tải file lên'}
                                </p>
                                <p className="text-[11px] text-muted-foreground text-center">
                                    PDF, Word, Ảnh...
                                </p>
                            </div>

                            {/* Record Audio Card */}
                            <button
                                type="button"
                                onClick={() => setActiveRecorder('audio')}
                                className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-amber-200 hover:border-amber-400 hover:bg-amber-50/50 cursor-pointer transition-all group"
                            >
                                <div className="w-14 h-14 rounded-2xl mb-3 flex items-center justify-center bg-gradient-to-br from-amber-200 to-amber-100 text-amber-600 group-hover:scale-110 transition-transform">
                                    <Mic className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-semibold text-amber-700 mb-0.5">
                                    Ghi âm
                                </p>
                                <p className="text-[11px] text-amber-600/70 text-center">
                                    Thu giọng nói
                                </p>
                            </button>

                            {/* Record Video Card */}
                            <button
                                type="button"
                                onClick={() => setActiveRecorder('video')}
                                className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all group"
                            >
                                <div className="w-14 h-14 rounded-2xl mb-3 flex items-center justify-center bg-gradient-to-br from-blue-200 to-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
                                    <Video className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-semibold text-blue-700 mb-0.5">
                                    Quay video
                                </p>
                                <p className="text-[11px] text-blue-600/70 text-center">
                                    Camera & màn hình
                                </p>
                            </button>
                        </div>
                    )}

                    {/* Active Recorder */}
                    {!submission && activeRecorder && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className=""
                        >
                            <MultimediaRecorder
                                type={activeRecorder}
                                onRecordingComplete={(file) => {
                                    const newFile: FileAttachment = {
                                        id: Date.now().toString(),
                                        name: file.name,
                                        url: URL.createObjectURL(file),
                                        type: file.type,
                                        size: file.size,
                                        uploadedAt: new Date().toISOString()
                                    };
                                    setFiles(prev => [...prev, newFile]);
                                    setActiveRecorder(null);
                                    showToast(`Đã thêm ${activeRecorder === 'video' ? 'video' : 'bản ghi âm'}`, "success");
                                }}
                                onCancel={() => setActiveRecorder(null)}
                            />
                        </motion.div>
                    )}

                    {/* Compact State - Has Files */}
                    {files.length > 0 && (
                        <div className="rounded-xl border border-border overflow-hidden bg-card">
                            {/* Compact Add More Dropzone */}
                            {!submission && !activeRecorder && (
                                <div
                                    {...getRootProps()}
                                    className={`
                                        p-3 flex items-center gap-3 cursor-pointer transition-all
                                        ${isDragActive ? 'bg-primary/5' : 'hover:bg-muted/30'}
                                    `}
                                >
                                    <input {...getInputProps()} />
                                    <div className={`
                                        w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all
                                        ${isDragActive ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}
                                    `}>
                                        <Upload className="w-4 h-4" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {isDragActive ? 'Thả để thêm file' : 'Thêm file khác...'}
                                    </p>
                                </div>
                            )}

                            {/* Active Recorder in Compact Mode */}
                            {!submission && activeRecorder && (
                                <MultimediaRecorder
                                    type={activeRecorder}
                                    onRecordingComplete={(file) => {
                                        const newFile: FileAttachment = {
                                            id: Date.now().toString(),
                                            name: file.name,
                                            url: URL.createObjectURL(file),
                                            type: file.type,
                                            size: file.size,
                                            uploadedAt: new Date().toISOString()
                                        };
                                        setFiles(prev => [...prev, newFile]);
                                        setActiveRecorder(null);
                                        showToast(`Đã thêm ${activeRecorder === 'video' ? 'video' : 'bản ghi âm'}`, "success");
                                    }}
                                    onCancel={() => setActiveRecorder(null)}
                                />
                            )}

                            {/* File List */}
                            <div className={`p-3 space-y-2 ${!submission && !activeRecorder ? 'border-t border-border/50' : ''}`}>
                                {files.map((file) => (
                                    <motion.div
                                        key={file.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        layout
                                    >
                                        <FileAttachmentCard
                                            attachment={file}
                                            onRemove={!submission ? () => removeFile(file.id) : undefined}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Submission Attachments (Read-only) */}
                    {submission?.attachments && submission.attachments.length > 0 && (
                        <div className="rounded-xl border border-border overflow-hidden bg-card p-3 space-y-2">
                            {submission.attachments.map((file) => (
                                <FileAttachmentCard key={file.id} attachment={file} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Submit Actions Area */}
            <div className="pt-4 mt-4 border-t border-border">
                {!submission ? (
                    <div className="flex items-center gap-4">
                        <div className="flex-1 hidden md:block">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                <CheckCircle className="w-3.5 h-3.5 text-primary" />
                                <span>Kiểm tra kỹ nội dung trước khi nhấn nộp bài</span>
                            </div>
                        </div>
                        <button
                            id="submit-assignment-btn"
                            type="submit"
                            disabled={isLoading || (!content && files.length === 0)}
                            className="w-full md:w-auto md:min-w-[200px] py-4 px-8 bg-primary text-primary-foreground rounded-2xl text-base font-black hover:shadow-2xl hover:shadow-primary/25 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 ring-4 ring-primary/0 hover:ring-primary/10"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Đang nộp bài...</span>
                                </>
                            ) : (
                                <>
                                    <span>Nộp bài ngay</span>
                                    <Send className="w-5 h-5 rotate-12 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="p-4 bg-green-500 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-3 shadow-lg shadow-green-500/20 border-b-4 border-green-700">
                        <CheckCircle className="w-6 h-6" />
                        BÀI LÀM ĐÃ ĐƯỢC GỬI THÀNH CÔNG
                    </div>
                )}
            </div>
        </form>
    );
}
