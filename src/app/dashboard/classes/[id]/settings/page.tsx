"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Save, Archive, Trash2, AlertTriangle, Loader2,
    RefreshCw, Copy, Check, Download, Eye, EyeOff,
    ArrowLeft, BookOpen, Users, Bell, Shield, FileText,
    Megaphone, GraduationCap, Clock, Lock, UserPlus,
    MessageSquare, Paperclip, FolderOpen, Calendar, Mail,
    Smartphone, ChevronRight, Settings
} from "lucide-react";
import { getCurrentUserAction, getClassByIdAction } from "@/lib/actions";
import {
    updateClassDetailsAction,
    archiveClassAction,
    deleteClassAction
} from "@/lib/actions";
import {
    getClassSettingsAction,
    updateClassSettingsAction,
    regenerateClassCodeAction,
    exportClassRosterAction
} from "@/lib/class-settings-actions";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

type SettingsTab = "general" | "stream" | "assignments" | "resources" | "members" | "grades" | "notifications" | "advanced";

export default function ClassSettingsPage() {
    const params = useParams();
    const classId = params.id as string;
    const router = useRouter();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>("");
    const [activeTab, setActiveTab] = useState<SettingsTab>("general");
    // const [hasChanges, setHasChanges] = useState(false);

    // Basic Info
    const [name, setName] = useState("");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [classCode, setClassCode] = useState("");
    const [codeCopied, setCodeCopied] = useState(false);
    const [regenerating, setRegenerating] = useState(false);

    // Stream Settings
    const [announcementPermission, setAnnouncementPermission] = useState("TEACHER_ONLY");
    const [attachmentPermission, setAttachmentPermission] = useState("TEACHER_ONLY");

    // Assignment Settings
    const [defaultMaxScore, setDefaultMaxScore] = useState(10);
    const [allowLateSubmission, setAllowLateSubmission] = useState(true);
    const [latePenaltyPercent, setLatePenaltyPercent] = useState(10);
    const [autoReminder, setAutoReminder] = useState(true);
    const [reminderDaysBefore, setReminderDaysBefore] = useState(1);

    // Resource Settings
    const [resourceUploadPermission, setResourceUploadPermission] = useState("TEACHER_ONLY");
    const [maxFileSizeMB, setMaxFileSizeMB] = useState(50);

    // Member Settings
    const [requireApproval, setRequireApproval] = useState(false);
    const [allowStudentDirectory, setAllowStudentDirectory] = useState(true);
    const [codeEnabled, setCodeEnabled] = useState(true);

    // Grade Settings
    const [hideGradesFromStudents, setHideGradesFromStudents] = useState(false);
    const [showGradeStatistics, setShowGradeStatistics] = useState(true);

    // Notification Settings
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [newAnnouncementNotify, setNewAnnouncementNotify] = useState(true);
    const [newAssignmentNotify, setNewAssignmentNotify] = useState(true);
    const [deadlineReminderNotify, setDeadlineReminderNotify] = useState(true);
    const [gradePostedNotify, setGradePostedNotify] = useState(true);

    // Dialog State
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [exporting, setExporting] = useState(false);

    const tabs = [
        { id: "general" as const, label: "Thông tin chung", icon: BookOpen, description: "Tên lớp, môn học, mã tham gia" },
        { id: "stream" as const, label: "Bảng tin", icon: Megaphone, description: "Quyền đăng và đính kèm" },
        { id: "assignments" as const, label: "Bài tập", icon: FileText, description: "Điểm, deadline, nhắc nhở" },
        { id: "resources" as const, label: "Tài liệu", icon: FolderOpen, description: "Upload và giới hạn file" },
        { id: "members" as const, label: "Thành viên", icon: Users, description: "Tham gia và phê duyệt" },
        { id: "grades" as const, label: "Điểm số", icon: GraduationCap, description: "Hiển thị và thống kê" },
        { id: "notifications" as const, label: "Thông báo", icon: Bell, description: "Email, push, loại thông báo" },
        { id: "advanced" as const, label: "Nâng cao", icon: Shield, description: "Lưu trữ và xóa lớp" },
    ];

    const permissionOptions = [
        { value: "TEACHER_ONLY", label: "Chỉ giáo viên" },
        { value: "TEACHER_AND_MONITOR", label: "GV + Lớp trưởng" },
        { value: "ALL", label: "Tất cả thành viên" },
    ];

    useEffect(() => {
        async function loadData() {
            try {
                const user = await getCurrentUserAction();
                if (user) setCurrentUserId(user.id);

                const cls = await getClassByIdAction(classId);
                if (cls) {
                    setName(cls.name);
                    setSubject(cls.subject || "");
                    setDescription(cls.description || "");
                    setClassCode(cls.code || "");
                    setCodeEnabled(cls.codeEnabled ?? true);
                } else {
                    showToast("Không tìm thấy lớp học", "error");
                    router.push("/dashboard/classes");
                    return;
                }

                const settingsResult = await getClassSettingsAction(classId);
                if (settingsResult.success && settingsResult.settings) {
                    const s = settingsResult.settings;
                    // Stream permissions
                    setAnnouncementPermission(s.announcementPermission || "TEACHER_ONLY");
                    setAttachmentPermission(s.attachmentPermission || "TEACHER_ONLY");
                    // Assignment settings
                    setDefaultMaxScore(s.defaultMaxScore || 10);
                    setAllowLateSubmission(s.allowLateSubmission ?? true);
                    setLatePenaltyPercent(s.latePenaltyPercent || 10);
                    setAutoReminder(s.autoReminder ?? true);
                    setReminderDaysBefore(s.reminderDaysBefore || 1);
                    // Resource settings
                    setResourceUploadPermission(s.resourceUploadPermission || "TEACHER_ONLY");
                    setMaxFileSizeMB(s.maxFileSizeMB || 50);
                    // Member settings
                    setRequireApproval(s.requireApproval ?? false);
                    setAllowStudentDirectory(s.allowStudentDirectory ?? true);
                    // Grade settings
                    setHideGradesFromStudents(s.hideGradesFromStudents ?? false);
                    setShowGradeStatistics(s.showGradeStatistics ?? true);
                    // Notification settings
                    setEmailNotifications(s.emailNotifications ?? true);
                    setPushNotifications(s.pushNotifications ?? true);
                    setNewAnnouncementNotify(s.newAnnouncementNotify ?? true);
                    setNewAssignmentNotify(s.newAssignmentNotify ?? true);
                    setDeadlineReminderNotify(s.deadlineReminderNotify ?? true);
                    setGradePostedNotify(s.gradePostedNotify ?? true);
                }
            } catch (error) {
                console.error("Load error:", error);
                showToast("Lỗi khi tải thông tin", "error");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [classId, router, showToast]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateClassDetailsAction(classId, { name, subject, description });
            await updateClassSettingsAction(classId, currentUserId, {
                // Stream permissions
                announcementPermission: announcementPermission as any,
                attachmentPermission: attachmentPermission as any,
                allowComments: true,
                allowReactions: true,
                // Assignment settings
                defaultMaxScore,
                allowLateSubmission,
                latePenaltyPercent,
                autoReminder,
                reminderDaysBefore,
                // Resource settings
                resourceUploadPermission: resourceUploadPermission as any,
                maxFileSizeMB,
                // Member settings
                requireApproval,
                allowStudentDirectory,
                // Grade settings
                hideGradesFromStudents,
                showGradeStatistics,
                // Notification settings
                emailNotifications,
                pushNotifications,
                newAnnouncementNotify,
                newAssignmentNotify,
                deadlineReminderNotify,
                gradePostedNotify,
            });
            showToast("Đã lưu cài đặt thành công!", "success");
            // setHasChanges(false);
        } catch (_error) {
            showToast("Có lỗi xảy ra khi lưu", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleCopyCode = async () => {
        await navigator.clipboard.writeText(classCode);
        setCodeCopied(true);
        showToast("Đã sao chép mã lớp", "success");
        setTimeout(() => setCodeCopied(false), 2000);
    };

    const handleRegenerateCode = async () => {
        if (!confirm("Bạn có chắc muốn tạo mã mới? Mã cũ sẽ không còn hoạt động.")) return;
        setRegenerating(true);
        try {
            const result = await regenerateClassCodeAction(classId, currentUserId);
            if (result.success && result.newCode) {
                setClassCode(result.newCode);
                showToast("Đã tạo mã lớp mới", "success");
            }
        } catch { showToast("Lỗi khi tạo mã mới", "error"); }
        finally { setRegenerating(false); }
    };

    const handleExportRoster = async () => {
        setExporting(true);
        try {
            const result = await exportClassRosterAction(classId, currentUserId);
            if (result.success && result.csvContent) {
                const blob = new Blob(["\uFEFF" + result.csvContent], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = result.filename || "danh-sach-lop.csv";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                showToast("Đã xuất danh sách thành công", "success");
            }
        } catch { showToast("Lỗi khi xuất danh sách", "error"); }
        finally { setExporting(false); }
    };

    const handleArchive = async () => {
        if (!confirm("Bạn có chắc muốn lưu trữ lớp học này? Lớp sẽ bị ẩn khỏi danh sách.")) return;
        const result = await archiveClassAction(classId);
        if (result.success) {
            showToast("Đã lưu trữ lớp học", "success");
            router.push("/dashboard/classes");
        }
    };

    const handleDelete = async () => {
        if (deleteConfirmation !== name) {
            showToast("Tên lớp không khớp", "error");
            return;
        }
        setIsDeleting(true);
        try {
            const result = await deleteClassAction(classId);
            if (result.success) {
                showToast("Đã xóa lớp học vĩnh viễn", "success");
                router.push("/dashboard/classes");
            }
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Đang tải cài đặt...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Settings className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-semibold text-gray-900">Cài đặt lớp học</h1>
                                    <p className="text-sm text-gray-500 hidden sm:block">{name}</p>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Lưu thay đổi
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <aside className="lg:w-72 shrink-0">
                        <nav className="lg:sticky lg:top-24 space-y-1 bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
                            {tabs.map((tab, index) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all group ${activeTab === tab.id
                                        ? "bg-blue-50 border border-blue-100"
                                        : "hover:bg-gray-50"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg transition-colors ${activeTab === tab.id
                                            ? "bg-blue-100 text-blue-600"
                                            : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                                            }`}>
                                            <tab.icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-medium ${activeTab === tab.id ? "text-blue-700" : "text-gray-700"
                                                }`}>
                                                {tab.label}
                                            </p>
                                            <p className="text-xs text-gray-400 hidden lg:block">
                                                {tab.description}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 transition-colors ${activeTab === tab.id ? "text-blue-500" : "text-gray-300"
                                        }`} />
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* General Tab */}
                                {activeTab === "general" && (
                                    <div className="space-y-6">
                                        <SettingsCard title="Thông tin cơ bản" icon={BookOpen} iconBg="bg-blue-100" iconColor="text-blue-600">
                                            <div className="space-y-5">
                                                <FormField label="Tên lớp học" required>
                                                    <Input
                                                        value={name}
                                                        onChange={(e) => { setName(e.target.value); /* setHasChanges(true); */ }}
                                                        placeholder="Ví dụ: Toán 10A1"
                                                        className="h-11"
                                                    />
                                                </FormField>
                                                <FormField label="Môn học">
                                                    <Input
                                                        value={subject}
                                                        onChange={(e) => { setSubject(e.target.value); /* setHasChanges(true); */ }}
                                                        placeholder="Ví dụ: Toán học"
                                                        className="h-11"
                                                    />
                                                </FormField>
                                                <FormField label="Mô tả lớp học">
                                                    <textarea
                                                        value={description}
                                                        onChange={(e) => { setDescription(e.target.value); /* setHasChanges(true); */ }}
                                                        placeholder="Mô tả về lớp học của bạn..."
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-colors"
                                                        rows={4}
                                                    />
                                                </FormField>
                                            </div>
                                        </SettingsCard>

                                        <SettingsCard title="Mã tham gia lớp" icon={Shield} iconBg="bg-purple-100" iconColor="text-purple-600">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                                                    <div className="flex-1">
                                                        <p className="text-xs text-gray-500 mb-1">Mã lớp học</p>
                                                        <p className="text-3xl font-mono font-bold tracking-[0.3em] text-purple-700">
                                                            {classCode}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleCopyCode}
                                                            className="p-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-all hover:shadow-sm"
                                                            title="Sao chép mã"
                                                        >
                                                            {codeCopied ? (
                                                                <Check className="w-5 h-5 text-green-500" />
                                                            ) : (
                                                                <Copy className="w-5 h-5 text-gray-600" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={handleRegenerateCode}
                                                            disabled={regenerating}
                                                            className="p-3 bg-white hover:bg-orange-50 rounded-lg border border-gray-200 transition-all hover:shadow-sm hover:border-orange-200 disabled:opacity-50"
                                                            title="Tạo mã mới"
                                                        >
                                                            <RefreshCw className={`w-5 h-5 text-orange-600 ${regenerating ? 'animate-spin' : ''}`} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    Chia sẻ mã này cho học sinh để họ có thể tham gia lớp học của bạn.
                                                </p>
                                            </div>
                                        </SettingsCard>
                                    </div>
                                )}

                                {/* Stream Tab */}
                                {activeTab === "stream" && (
                                    <SettingsCard title="Cài đặt Bảng tin" icon={Megaphone} iconBg="bg-purple-100" iconColor="text-purple-600">
                                        <div className="space-y-4">
                                            <SettingItem
                                                icon={MessageSquare}
                                                iconBg="bg-purple-50"
                                                iconColor="text-purple-600"
                                                title="Quyền đăng thông báo"
                                                description="Ai có thể đăng thông báo lên bảng tin lớp học"
                                            >
                                                <SelectDropdown
                                                    value={announcementPermission}
                                                    options={permissionOptions}
                                                    onChange={(v) => { setAnnouncementPermission(v); /* setHasChanges(true); */ }}
                                                />
                                            </SettingItem>

                                            <SettingItem
                                                icon={Paperclip}
                                                iconBg="bg-blue-50"
                                                iconColor="text-blue-600"
                                                title="Quyền đính kèm file"
                                                description="Ai có thể đính kèm file vào thông báo"
                                            >
                                                <SelectDropdown
                                                    value={attachmentPermission}
                                                    options={permissionOptions}
                                                    onChange={(v) => { setAttachmentPermission(v); /* setHasChanges(true); */ }}
                                                />
                                            </SettingItem>
                                        </div>
                                    </SettingsCard>
                                )}

                                {/* Assignments Tab */}
                                {activeTab === "assignments" && (
                                    <SettingsCard title="Cài đặt Bài tập" icon={FileText} iconBg="bg-green-100" iconColor="text-green-600">
                                        <div className="space-y-4">
                                            <SettingItem
                                                icon={GraduationCap}
                                                iconBg="bg-green-50"
                                                iconColor="text-green-600"
                                                title="Điểm tối đa mặc định"
                                                description="Điểm số tối đa mặc định cho bài tập mới"
                                            >
                                                <Input
                                                    type="number"
                                                    value={defaultMaxScore}
                                                    onChange={(e) => { setDefaultMaxScore(Number(e.target.value)); /* setHasChanges(true); */ }}
                                                    className="w-24 h-10 text-center"
                                                    min={1}
                                                    max={100}
                                                />
                                            </SettingItem>

                                            <SettingItem
                                                icon={Clock}
                                                iconBg="bg-orange-50"
                                                iconColor="text-orange-600"
                                                title="Cho phép nộp muộn"
                                                description="Học sinh có thể nộp bài sau deadline"
                                            >
                                                <Toggle enabled={allowLateSubmission} onChange={(v) => { setAllowLateSubmission(v); /* setHasChanges(true); */ }} />
                                            </SettingItem>

                                            {allowLateSubmission && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="ml-14"
                                                >
                                                    <SettingItem
                                                        icon={AlertTriangle}
                                                        iconBg="bg-red-50"
                                                        iconColor="text-red-600"
                                                        title="Phạt nộp muộn (%)"
                                                        description="Phần trăm điểm trừ khi nộp trễ"
                                                    >
                                                        <Input
                                                            type="number"
                                                            value={latePenaltyPercent}
                                                            onChange={(e) => { setLatePenaltyPercent(Number(e.target.value)); /* setHasChanges(true); */ }}
                                                            className="w-24 h-10 text-center"
                                                            min={0}
                                                            max={100}
                                                        />
                                                    </SettingItem>
                                                </motion.div>
                                            )}

                                            <SettingItem
                                                icon={Bell}
                                                iconBg="bg-yellow-50"
                                                iconColor="text-yellow-600"
                                                title="Nhắc nhở tự động"
                                                description="Gửi thông báo nhắc nhở trước deadline"
                                            >
                                                <Toggle enabled={autoReminder} onChange={(v) => { setAutoReminder(v); /* setHasChanges(true); */ }} />
                                            </SettingItem>

                                            {autoReminder && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    className="ml-14"
                                                >
                                                    <SettingItem
                                                        icon={Calendar}
                                                        iconBg="bg-blue-50"
                                                        iconColor="text-blue-600"
                                                        title="Số ngày trước deadline"
                                                        description="Nhắc nhở trước bao nhiêu ngày"
                                                    >
                                                        <Input
                                                            type="number"
                                                            value={reminderDaysBefore}
                                                            onChange={(e) => { setReminderDaysBefore(Number(e.target.value)); /* setHasChanges(true); */ }}
                                                            className="w-24 h-10 text-center"
                                                            min={1}
                                                            max={7}
                                                        />
                                                    </SettingItem>
                                                </motion.div>
                                            )}
                                        </div>
                                    </SettingsCard>
                                )}

                                {/* Resources Tab */}
                                {activeTab === "resources" && (
                                    <SettingsCard title="Cài đặt Tài liệu" icon={FolderOpen} iconBg="bg-orange-100" iconColor="text-orange-600">
                                        <div className="space-y-4">
                                            <SettingItem
                                                icon={UserPlus}
                                                iconBg="bg-orange-50"
                                                iconColor="text-orange-600"
                                                title="Quyền tải lên tài liệu"
                                                description="Ai có thể tải tài liệu lên lớp học"
                                            >
                                                <SelectDropdown
                                                    value={resourceUploadPermission}
                                                    options={permissionOptions}
                                                    onChange={(v) => { setResourceUploadPermission(v); /* setHasChanges(true); */ }}
                                                />
                                            </SettingItem>

                                            <SettingItem
                                                icon={FileText}
                                                iconBg="bg-blue-50"
                                                iconColor="text-blue-600"
                                                title="Dung lượng tối đa (MB)"
                                                description="Giới hạn kích thước file tải lên"
                                            >
                                                <Input
                                                    type="number"
                                                    value={maxFileSizeMB}
                                                    onChange={(e) => { setMaxFileSizeMB(Number(e.target.value)); /* setHasChanges(true); */ }}
                                                    className="w-24 h-10 text-center"
                                                    min={1}
                                                    max={500}
                                                />
                                            </SettingItem>
                                        </div>
                                    </SettingsCard>
                                )}

                                {/* Members Tab */}
                                {activeTab === "members" && (
                                    <div className="space-y-6">
                                        <SettingsCard title="Cài đặt Thành viên" icon={Users} iconBg="bg-cyan-100" iconColor="text-cyan-600">
                                            <div className="space-y-4">
                                                <SettingItem
                                                    icon={Lock}
                                                    iconBg="bg-cyan-50"
                                                    iconColor="text-cyan-600"
                                                    title="Yêu cầu phê duyệt"
                                                    description="Giáo viên phải phê duyệt khi học sinh tham gia"
                                                >
                                                    <Toggle enabled={requireApproval} onChange={(v) => { setRequireApproval(v); /* setHasChanges(true); */ }} />
                                                </SettingItem>

                                                <SettingItem
                                                    icon={Shield}
                                                    iconBg="bg-green-50"
                                                    iconColor="text-green-600"
                                                    title="Cho phép mã tham gia"
                                                    description="Học sinh có thể tham gia bằng mã lớp"
                                                >
                                                    <Toggle enabled={codeEnabled} onChange={(v) => { setCodeEnabled(v); /* setHasChanges(true); */ }} />
                                                </SettingItem>

                                                <SettingItem
                                                    icon={Users}
                                                    iconBg="bg-purple-50"
                                                    iconColor="text-purple-600"
                                                    title="Hiển thị danh sách lớp"
                                                    description="Học sinh có thể xem danh sách các bạn trong lớp"
                                                >
                                                    <Toggle enabled={allowStudentDirectory} onChange={(v) => { setAllowStudentDirectory(v); /* setHasChanges(true); */ }} />
                                                </SettingItem>
                                            </div>
                                        </SettingsCard>

                                        <SettingsCard title="Xuất dữ liệu" icon={Download} iconBg="bg-blue-100" iconColor="text-blue-600">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900">Xuất danh sách lớp</p>
                                                    <p className="text-sm text-gray-500">Tải xuống file CSV chứa thông tin học sinh</p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    onClick={handleExportRoster}
                                                    disabled={exporting}
                                                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                                >
                                                    {exporting ? (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <Download className="w-4 h-4 mr-2" />
                                                    )}
                                                    Xuất CSV
                                                </Button>
                                            </div>
                                        </SettingsCard>
                                    </div>
                                )}

                                {/* Grades Tab */}
                                {activeTab === "grades" && (
                                    <SettingsCard title="Cài đặt Điểm số" icon={GraduationCap} iconBg="bg-pink-100" iconColor="text-pink-600">
                                        <div className="space-y-4">
                                            <SettingItem
                                                icon={hideGradesFromStudents ? EyeOff : Eye}
                                                iconBg={hideGradesFromStudents ? "bg-gray-100" : "bg-pink-50"}
                                                iconColor={hideGradesFromStudents ? "text-gray-600" : "text-pink-600"}
                                                title="Ẩn điểm với học sinh"
                                                description="Học sinh không thể xem điểm cho đến khi bạn công bố"
                                            >
                                                <Toggle enabled={hideGradesFromStudents} onChange={(v) => { setHideGradesFromStudents(v); /* setHasChanges(true); */ }} />
                                            </SettingItem>

                                            <SettingItem
                                                icon={GraduationCap}
                                                iconBg="bg-green-50"
                                                iconColor="text-green-600"
                                                title="Hiển thị thống kê điểm"
                                                description="Học sinh có thể xem điểm trung bình, cao nhất, thấp nhất"
                                            >
                                                <Toggle enabled={showGradeStatistics} onChange={(v) => { setShowGradeStatistics(v); /* setHasChanges(true); */ }} />
                                            </SettingItem>
                                        </div>
                                    </SettingsCard>
                                )}

                                {/* Notifications Tab */}
                                {activeTab === "notifications" && (
                                    <div className="space-y-6">
                                        <SettingsCard title="Kênh thông báo" icon={Bell} iconBg="bg-yellow-100" iconColor="text-yellow-600">
                                            <div className="space-y-4">
                                                <SettingItem
                                                    icon={Mail}
                                                    iconBg="bg-blue-50"
                                                    iconColor="text-blue-600"
                                                    title="Thông báo Email"
                                                    description="Gửi thông báo qua email cho học sinh"
                                                >
                                                    <Toggle enabled={emailNotifications} onChange={(v) => { setEmailNotifications(v); /* setHasChanges(true); */ }} />
                                                </SettingItem>

                                                <SettingItem
                                                    icon={Smartphone}
                                                    iconBg="bg-green-50"
                                                    iconColor="text-green-600"
                                                    title="Thông báo đẩy"
                                                    description="Gửi thông báo đẩy trên ứng dụng"
                                                >
                                                    <Toggle enabled={pushNotifications} onChange={(v) => { setPushNotifications(v); /* setHasChanges(true); */ }} />
                                                </SettingItem>
                                            </div>
                                        </SettingsCard>

                                        <SettingsCard title="Loại thông báo" icon={Megaphone} iconBg="bg-purple-100" iconColor="text-purple-600">
                                            <div className="space-y-4">
                                                <SettingItem
                                                    icon={Megaphone}
                                                    iconBg="bg-purple-50"
                                                    iconColor="text-purple-600"
                                                    title="Thông báo mới"
                                                    description="Khi có thông báo mới trên bảng tin"
                                                >
                                                    <Toggle enabled={newAnnouncementNotify} onChange={(v) => { setNewAnnouncementNotify(v); /* setHasChanges(true); */ }} />
                                                </SettingItem>

                                                <SettingItem
                                                    icon={FileText}
                                                    iconBg="bg-green-50"
                                                    iconColor="text-green-600"
                                                    title="Bài tập mới"
                                                    description="Khi có bài tập mới được giao"
                                                >
                                                    <Toggle enabled={newAssignmentNotify} onChange={(v) => { setNewAssignmentNotify(v); /* setHasChanges(true); */ }} />
                                                </SettingItem>

                                                <SettingItem
                                                    icon={Clock}
                                                    iconBg="bg-orange-50"
                                                    iconColor="text-orange-600"
                                                    title="Nhắc deadline"
                                                    description="Nhắc nhở trước khi bài tập hết hạn"
                                                >
                                                    <Toggle enabled={deadlineReminderNotify} onChange={(v) => { setDeadlineReminderNotify(v); /* setHasChanges(true); */ }} />
                                                </SettingItem>

                                                <SettingItem
                                                    icon={GraduationCap}
                                                    iconBg="bg-pink-50"
                                                    iconColor="text-pink-600"
                                                    title="Điểm được công bố"
                                                    description="Khi giáo viên chấm điểm bài tập"
                                                >
                                                    <Toggle enabled={gradePostedNotify} onChange={(v) => { setGradePostedNotify(v); /* setHasChanges(true); */ }} />
                                                </SettingItem>
                                            </div>
                                        </SettingsCard>
                                    </div>
                                )}

                                {/* Advanced Tab */}
                                {activeTab === "advanced" && (
                                    <div className="space-y-6">
                                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-orange-100 rounded-xl">
                                                    <Archive className="w-6 h-6 text-orange-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-orange-900 mb-1">Lưu trữ lớp học</h3>
                                                    <p className="text-sm text-orange-700 mb-4">
                                                        Lớp học sẽ bị ẩn khỏi danh sách nhưng tất cả dữ liệu vẫn được giữ lại. Bạn có thể khôi phục lớp bất cứ lúc nào.
                                                    </p>
                                                    <Button
                                                        variant="outline"
                                                        onClick={handleArchive}
                                                        className="border-orange-300 text-orange-700 hover:bg-orange-100"
                                                    >
                                                        <Archive className="w-4 h-4 mr-2" />
                                                        Lưu trữ lớp học
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-red-100 rounded-xl">
                                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-red-900 mb-1">Xóa lớp học vĩnh viễn</h3>
                                                    <p className="text-sm text-red-700 mb-4">
                                                        <strong>Cảnh báo:</strong> Hành động này không thể hoàn tác. Tất cả dữ liệu bao gồm thông báo, bài tập, điểm số sẽ bị xóa vĩnh viễn.
                                                    </p>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={() => setShowDeleteDialog(true)}
                                                        className="bg-red-600 hover:bg-red-700"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Xóa lớp học
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </main>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <DialogTitle className="text-red-900">Xác nhận xóa lớp học</DialogTitle>
                        </div>
                        <DialogDescription className="text-gray-600">
                            Để xác nhận, vui lòng nhập tên lớp học <span className="font-semibold text-gray-900">&quot;{name}&quot;</span> vào ô bên dưới.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            placeholder="Nhập tên lớp học..."
                            className="text-center"
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => { setShowDeleteDialog(false); setDeleteConfirmation(""); }}
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteConfirmation !== name || isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang xóa...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Xóa vĩnh viễn
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Components
function SettingsCard({
    title,
    icon: Icon,
    iconBg,
    iconColor,
    children
}: {
    title: string;
    icon: any;
    iconBg: string;
    iconColor: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className={`p-2 ${iconBg} rounded-lg`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <h2 className="font-semibold text-gray-900">{title}</h2>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function SettingItem({
    icon: Icon,
    iconBg,
    iconColor,
    title,
    description,
    children
}: {
    icon: any;
    iconBg: string;
    iconColor: string;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between py-3 px-4 -mx-4 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
                <div className={`p-2 ${iconBg} rounded-lg`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div>
                    <p className="font-medium text-gray-900">{title}</p>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
            </div>
            <div className="shrink-0 ml-4">{children}</div>
        </div>
    );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {children}
        </div>
    );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${enabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
            />
        </button>
    );
}

function SelectDropdown({
    value,
    options,
    onChange
}: {
    value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}
