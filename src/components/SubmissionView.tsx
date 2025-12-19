import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Send, X, Loader2, Paperclip, Sparkles, Bot } from "lucide-react";
import { Submission, User, FileAttachment } from "@/types";
import { submitAssignmentAction, gradeAssignmentAction, checkAssignmentDraftAction } from "@/lib/actions";
import { useRouter } from "next/navigation";

interface SubmissionViewProps {
    assignmentId: string;
    submission: Submission | null;
    currentUser: User;
    isTeacher: boolean;
    dueDate: string;
    classId: string;
    onSuccess?: () => void;
    aiEnabled?: boolean;
}

export default function SubmissionView({ assignmentId, submission, currentUser, isTeacher, dueDate, classId, onSuccess, aiEnabled }: SubmissionViewProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isCheckingAI, setIsCheckingAI] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<{ feedback: string, suggestions: string[], scoreEstimate: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Student State
    const [content, setContent] = useState(submission?.content || "");
    const [files, setFiles] = useState<FileAttachment[]>(submission?.attachments || []);

    // Teacher State
    const [score, setScore] = useState(submission?.score || 0);
    const [feedback, setFeedback] = useState(submission?.feedback || "");

    const isLate = !submission && new Date() > new Date(dueDate);
    const isGraded = submission?.status === 'graded';

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const selectedFile = e.target.files[0];
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('classId', classId || 'general');

            const response = await fetch('/api/upload-resource', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();

            const newFile: FileAttachment = {
                id: Date.now().toString(),
                name: selectedFile.name,
                url: data.fileUrl,
                type: selectedFile.type,
                size: selectedFile.size,
                uploadedAt: new Date().toISOString()
            };

            setFiles(prev => [...prev, newFile]);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Có lỗi xảy ra khi tải tệp lên');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeFile = (fileId: string) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const handleStudentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await submitAssignmentAction({
                assignmentId,
                studentId: currentUser.id,
                content,
                attachments: files
            });
            if (result.success) {
                router.refresh();
                if (onSuccess) onSuccess();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error(error);
            alert("Lỗi khi nộp bài");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAICheck = async () => {
        if (!content || content.length < 10) {
            alert("Vui lòng nhập nội dung bài làm chi tiết hơn để AI kiểm tra.");
            return;
        }
        setIsCheckingAI(true);
        setAiFeedback(null);
        try {
            const result = await checkAssignmentDraftAction(assignmentId, content);
            if (result.success) {
                setAiFeedback({
                    feedback: result.feedback || "Không có phản hồi",
                    suggestions: result.suggestions || [],
                    scoreEstimate: result.scoreEstimate || "Chưa xác định"
                });
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("AI Check Error:", error);
            alert("Lỗi khi kết nối với AI.");
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
                router.refresh();
                if (onSuccess) onSuccess();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error(error);
            alert("Lỗi khi chấm điểm");
        } finally {
            setIsLoading(false);
        }
    };

    // --- TEACHER VIEW ---
    if (isTeacher) {
        if (!submission) {
            return (
                <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Học sinh chưa nộp bài</p>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Bài làm của học sinh
                    </h3>
                    <div className="whitespace-pre-wrap text-sm mb-4">{submission.content}</div>
                    {submission.attachments && submission.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {submission.attachments.map((file: FileAttachment, idx: number) => (
                                <a
                                    key={idx}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-card p-2 rounded border border-border text-xs hover:bg-blue-50 transition-colors"
                                >
                                    <Paperclip className="w-3 h-3" />
                                    <span>{file.name}</span>
                                </a>
                            ))}
                        </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                        Nộp lúc: {new Date(submission.submittedAt).toLocaleString('vi-VN')}
                        {isLate && <span className="text-destructive ml-2">(Nộp muộn)</span>}
                    </div>
                </div>

                <form onSubmit={handleTeacherGrade} className="space-y-4 border-t border-border pt-4">
                    <h3 className="font-semibold">Chấm điểm & Nhận xét</h3>

                    <div>
                        <label className="block text-sm font-medium mb-1">Điểm số (0-100)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            required
                            className="w-full p-2 rounded-md border border-input bg-background"
                            value={score}
                            onChange={e => setScore(parseInt(e.target.value))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Nhận xét</label>
                        <textarea
                            rows={3}
                            className="w-full p-2 rounded-md border border-input bg-background resize-none"
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            placeholder="Nhập lời nhận xét, động viên..."
                        />
                        {/* Feedback Bank (Placeholder) */}
                        <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                            {["Làm tốt lắm! 🌟", "Cần cố gắng hơn 💪", "Bài làm chi tiết 👌"].map(fb => (
                                <button
                                    key={fb}
                                    type="button"
                                    onClick={() => setFeedback(prev => prev ? prev + "\n" + fb : fb)}
                                    className="text-xs px-2 py-1 bg-muted rounded-full hover:bg-muted/80 whitespace-nowrap"
                                >
                                    {fb}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? "Đang lưu..." : "Lưu kết quả"}
                    </button>
                </form>
            </div>
        );
    }

    // --- STUDENT VIEW ---
    if (isGraded) {
        return (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 rounded-xl text-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-300 shadow-sm">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-green-800 dark:text-green-200 mb-1">Đã chấm điểm</h3>
                <div className="text-4xl font-extrabold text-green-600 dark:text-green-400 mb-4 tracking-tight">{submission.score}<span className="text-xl text-green-600/60 font-medium">/100</span></div>
                {submission.feedback && (
                    <div className="bg-white/80 dark:bg-black/20 p-4 rounded-xl text-sm text-green-800 dark:text-green-200 italic border border-green-100 dark:border-green-800/50 shadow-sm">
                        "{submission.feedback}"
                    </div>
                )}
            </div>
        );
    }

    return (
        <form onSubmit={handleStudentSubmit} className="space-y-5">
            {isLate && (
                <div className="flex items-start gap-3 text-destructive text-sm bg-destructive/5 border border-destructive/20 p-3 rounded-lg">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="font-semibold block mb-0.5">Đã quá hạn nộp bài</span>
                        <span className="opacity-90">Bạn vẫn có thể nộp nhưng sẽ bị đánh dấu là nộp muộn.</span>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-foreground/80">Nội dung bài làm</label>
                    {aiEnabled && !submission && (
                        <button
                            type="button"
                            onClick={handleAICheck}
                            disabled={isCheckingAI || !content}
                            className="text-xs flex items-center gap-1.5 text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                        >
                            {isCheckingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            Kiểm tra với AI
                        </button>
                    )}
                </div>
                <textarea
                    required={files.length === 0}
                    className="w-full p-4 rounded-xl border border-input bg-background min-h-[150px] resize-y focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium leading-relaxed placeholder:text-muted-foreground/50"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Nhập câu trả lời của bạn tại đây..."
                    disabled={!!submission}
                />
            </div>

            {/* AI Feedback Display */}
            {aiFeedback && (
                <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/50 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-semibold">
                        <Bot className="w-5 h-5" />
                        Đánh giá từ AI
                        <span className="text-xs font-normal bg-purple-200 dark:bg-purple-800 px-2 py-0.5 rounded-full ml-auto">
                            Ước tính: {aiFeedback.scoreEstimate}
                        </span>
                    </div>
                    <p className="text-sm text-foreground/90">{aiFeedback.feedback}</p>
                    {aiFeedback.suggestions.length > 0 && (
                        <div className="text-xs bg-white/50 dark:bg-black/20 p-3 rounded-lg">
                            <span className="font-semibold block mb-1">Gợi ý cải thiện:</span>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                {aiFeedback.suggestions.map((s, i) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground/80">Tệp đính kèm</label>
                    <div className="grid gap-2">
                        {files.map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-3 bg-card hover:bg-muted/30 rounded-lg border border-border group transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-md border border-blue-100">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                {!submission && (
                                    <button
                                        type="button"
                                        onClick={() => removeFile(file.id)}
                                        className="p-1.5 hover:bg-red-50 text-muted-foreground hover:text-red-600 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* File Upload */}
            {!submission && (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-muted-foreground hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer group ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                    />
                    <div className="p-3 bg-muted rounded-full mb-3 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {isUploading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <Upload className="w-6 h-6" />
                        )}
                    </div>
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {isUploading ? 'Đang tải lên...' : 'Tải lên tài liệu'}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">PDF, Word, Ảnh (Tối đa 10MB)</span>
                </div>
            )}

            {!submission ? (
                <button
                    type="submit"
                    disabled={isLoading || (!content && files.length === 0)}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-base font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Đang nộp...
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5" />
                            Nộp bài
                        </>
                    )}
                </button>
            ) : (
                <div className="space-y-3">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border border-green-200 dark:border-green-800">
                        <CheckCircle className="w-5 h-5" />
                        Đã nộp bài thành công
                    </div>
                    <button
                        type="button"
                        onClick={() => setContent(submission.content)} // Reset to original if needed or enable edit mode
                        className="w-full py-2.5 bg-muted text-muted-foreground hover:text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
                    >
                        Xem lại bài làm
                    </button>
                </div>
            )}
        </form>
    );
}
