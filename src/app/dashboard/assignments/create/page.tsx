"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataService } from "@/lib/data";
import { Class, User, FileAttachment } from "@/types";
import { ArrowLeft, BookOpen, Calendar, FileText, Plus, Paperclip, AlertCircle } from "lucide-react";
import Link from "next/link";
import { FileUpload } from "@/components/ui/FileUpload";
import { AIQuizGenerator } from "@/components/features/AIQuizGenerator";
import { QuizQuestion } from "@/lib/ai-service";
import { fileToAttachment } from "@/lib/fileUtils";
import { useToast } from "@/components/ui/Toast";

export default function CreateAssignmentPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAI, setShowAI] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        subject: "Toán",
        type: "exercise" as "exercise" | "test" | "project",
        dueDate: "",
        xpReward: 500,
        maxScore: 10,
        selectedClassIds: [] as string[],
    });

    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [attachments, setAttachments] = useState<FileAttachment[]>([]);
    const { showToast } = useToast();

    useEffect(() => {
        async function loadData() {
            try {
                const currentUser = await DataService.getCurrentUser();
                if (!currentUser || currentUser.role !== 'teacher') {
                    router.push('/dashboard');
                    return;
                }
                setUser(currentUser);

                const teacherClasses = await DataService.getClasses(currentUser.id);
                setClasses(teacherClasses);
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [router]);

    const handleFileChange = async (files: File[]) => {
        setUploadedFiles(files);
        try {
            const fileAttachments = await Promise.all(
                files.map(file => fileToAttachment(file))
            );
            setAttachments(fileAttachments);
        } catch (error) {
            console.error("Failed to process files", error);
            showToast("Có lỗi khi xử lý tệp", "error");
        }
    };

    const handleAIResult = (questions: QuizQuestion[]) => {
        // Convert questions to text format for the description
        const questionsText = questions.map((q, i) => {
            return `Câu ${i + 1}: ${q.question}\n${q.options.map((opt, j) => `${String.fromCharCode(65 + j)}. ${opt}`).join('\n')}\nĐáp án đúng: ${String.fromCharCode(65 + q.correctAnswer)}`;
        }).join('\n\n');

        setFormData(prev => ({
            ...prev,
            description: prev.description + (prev.description ? '\n\n' : '') + "--- BÀI TẬP TẠO BỞI AI ---\n\n" + questionsText
        }));
        setShowAI(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || formData.selectedClassIds.length === 0) {
            showToast("Vui lòng chọn ít nhất một lớp", "error");
            return;
        }

        if (new Date(formData.dueDate) < new Date()) {
            showToast("Hạn nộp phải ở trong tương lai", "error");
            return;
        }

        setSubmitting(true);
        try {
            await DataService.createAssignment({
                title: formData.title,
                description: formData.description,
                subject: formData.subject,
                type: formData.type,
                dueDate: new Date(formData.dueDate).toISOString(),
                xpReward: formData.xpReward,
                maxScore: formData.maxScore,
                teacherId: user.id,
                classIds: formData.selectedClassIds,
                status: "open",
                attachments: attachments.length > 0 ? attachments : undefined,
            });

            showToast("Tạo bài tập thành công!", "success");
            router.push('/dashboard/assignments');
        } catch (error) {
            console.error("Failed to create assignment", error);
            showToast("Có lỗi xảy ra khi tạo bài tập", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleClass = (classId: string) => {
        setFormData(prev => ({
            ...prev,
            selectedClassIds: prev.selectedClassIds.includes(classId)
                ? prev.selectedClassIds.filter(id => id !== classId)
                : [...prev.selectedClassIds, classId]
        }));
    };

    if (loading) return <div className="p-8 text-center">Đang tải...</div>;
    if (!user) return null;

    return (
        <div className="space-y-6 -m-8 p-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/assignments">
                    <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">Tạo Bài Tập Mới</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Thông tin bài tập
                    </h2>

                    <div>
                        <label className="block text-sm font-medium mb-2">Tiêu đề *</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Ví dụ: Bài tập chương Đạo hàm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Mô tả *</label>

                        {/* AI Button */}
                        <div className="mb-2">
                            <button
                                type="button"
                                onClick={() => setShowAI(true)}
                                className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-md hover:bg-purple-200 transition-colors flex items-center gap-1 font-medium"
                            >
                                ✨ Tạo nội dung bằng AI
                            </button>
                        </div>

                        {showAI && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                <AIQuizGenerator
                                    onAccept={handleAIResult}
                                    onCancel={() => setShowAI(false)}
                                />
                            </div>
                        )}

                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                            placeholder="Nội dung chi tiết về bài tập..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Môn học *</label>
                            <select
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="Toán">Toán</option>
                                <option value="Vật lý">Vật lý</option>
                                <option value="Hóa học">Hóa học</option>
                                <option value="Sinh học">Sinh học</option>
                                <option value="Ngữ văn">Ngữ văn</option>
                                <option value="Tiếng Anh">Tiếng Anh</option>
                                <option value="Lịch sử">Lịch sử</option>
                                <option value="Địa lý">Địa lý</option>
                                <option value="GDCD">GDCD</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Loại bài tập *</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="exercise">Bài tập thường</option>
                                <option value="test">Kiểm tra</option>
                                <option value="project">Dự án</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Hạn nộp *
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">XP thưởng</label>
                            <input
                                type="number"
                                min="0"
                                step="50"
                                value={formData.xpReward}
                                onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Thang điểm</label>
                            <select
                                value={formData.maxScore}
                                onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="10">Thang 10</option>
                                <option value="100">Thang 100</option>
                                <option value="4">Thang 4 (GPA)</option>
                            </select>
                        </div>
                    </div>
                </div>


                {/* Class Selection */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Chọn lớp giao bài *
                    </h2>

                    {classes.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Bạn chưa tạo lớp nào. Hãy tạo lớp trước khi giao bài tập.</p>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, selectedClassIds: classes.map(c => c.id) })}
                                    className="text-sm text-primary hover:underline"
                                >
                                    Chọn tất cả
                                </button>
                                <span className="text-muted-foreground">|</span>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, selectedClassIds: [] })}
                                    className="text-sm text-muted-foreground hover:underline"
                                >
                                    Bỏ chọn
                                </button>
                            </div>

                            {classes.map((cls) => (
                                <label
                                    key={cls.id}
                                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${formData.selectedClassIds.includes(cls.id)
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:bg-muted/50'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.selectedClassIds.includes(cls.id)}
                                        onChange={() => toggleClass(cls.id)}
                                        className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium">{cls.name}</p>
                                        <p className="text-sm text-muted-foreground">{cls.subject}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* File Attachments */}
                <div>
                    <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                        <Paperclip className="w-4 h-4" />
                        Tài liệu đính kèm (Tùy chọn)
                    </label>
                    <FileUpload
                        onFilesSelected={handleFileChange}
                        maxFiles={5}
                        maxSizeMB={10}
                        existingFiles={uploadedFiles}
                    />
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                    <Link href="/dashboard/assignments" className="flex-1">
                        <button
                            type="button"
                            className="w-full px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
                        >
                            Hủy
                        </button>
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting || formData.selectedClassIds.length === 0}
                        className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {submitting ? "Đang tạo..." : (
                            <>
                                <Plus className="w-5 h-5" />
                                Tạo bài tập
                            </>
                        )}
                    </button>
                </div>
            </form >
        </div >
    );
}
