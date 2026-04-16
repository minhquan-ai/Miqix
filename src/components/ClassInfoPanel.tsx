"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
    X,
    Users,
    Bell,
    BellOff,
    Pin,
    Settings,
    Copy,
    Check,
    Crown,
    Star,
    FileText,
    Image as ImageIcon,
    File,
    ChevronRight,
    BookOpen,
    MessageSquare,
    Megaphone,
    UserPlus,
    CalendarCheck,
    FileSpreadsheet,
    GripVertical,
    ChevronLeft,
    Mail,
    Link,
    QrCode,
    Download,
    LogOut,
} from "lucide-react";
import {
    getClassInfoAction,
    assignStudentRoleAction,
    toggleMemberNotificationsAction,
    StudentRole,
} from "@/lib/actions/class-settings-actions";
import { leaveClassAction, exportGradesAction } from "@/lib/actions";

interface ClassInfoPanelProps {
    classId: string;
    currentUserId: string;
    isOpen: boolean;
    onClose: () => void;
}

interface MemberInfo {
    id: string;
    name: string;
    avatarUrl?: string | null;
    role: string;
    joinedAt: Date;
    isPinned: boolean;
    notificationsEnabled: boolean;
}

type SubPanelType = 'invite' | 'attendance' | 'grades' | null;

// Sub-popup component that renders via portal
function SubPopup({
    type,
    classInfo,
    onClose,
    onCopyCode,
    copied,
    classId,
    router,
    panelRef
}: {
    type: SubPanelType;
    classInfo: any;
    onClose: () => void;
    onCopyCode: () => void;
    copied: boolean;
    classId: string;
    router: any;
    panelRef: React.RefObject<HTMLDivElement | null>;
}) {
    const [position, setPosition] = useState({ top: 0, right: 0 });
    const [linkCopied, setLinkCopied] = useState(false);
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [email, setEmail] = useState("");
    const [inviting, setInviting] = useState(false);
    const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (panelRef.current) {
            const rect = panelRef.current.getBoundingClientRect();
            setPosition({
                top: rect.top + 150, // Offset from top of panel
                right: window.innerWidth - rect.left + 8
            });
        }
    }, [panelRef]);

    if (!type) return null;

    const classCode = classInfo?.classInfo?.code;
    const inviteLink = typeof window !== 'undefined'
        ? `${window.location.origin}/join?code=${classCode}`
        : `/join?code=${classCode}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const handleInviteEmail = async () => {
        if (!email.trim()) return;
        setInviting(true);
        setInviteMessage(null);

        try {
            // Import and call inviteStudentAction
            const { inviteStudentAction } = await import("@/lib/actions");
            const result = await inviteStudentAction(classId, email.trim());

            if (result.success) {
                setInviteMessage({ type: 'success', text: result.message });
                setEmail("");
            } else {
                setInviteMessage({ type: 'error', text: result.message });
            }
        } catch (error) {
            setInviteMessage({ type: 'error', text: 'Lỗi khi mời học sinh' });
        }
        setInviting(false);
    };

    // Generate QR code using qrcode.react library
    const renderQRCode = (text: string) => {
        return (
            <div className="flex flex-col items-center">
                <div className="p-3 bg-white rounded-lg border-2 border-gray-200">
                    <QRCodeSVG
                        value={text}
                        size={160}
                        bgColor="#ffffff"
                        fgColor="#1f2937"
                        level="M"
                        includeMargin={false}
                    />
                </div>
            </div>
        );
    };

    const content = {
        invite: (
            <>
                <div className="p-3 border-b border-gray-100 bg-blue-50">
                    <h4 className="text-sm font-semibold text-blue-800">Mời học sinh</h4>
                </div>
                <div className="p-3 space-y-3">
                    {/* Class Code */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Mã lớp học</p>
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-mono font-bold text-gray-900">{classCode}</span>
                            <button onClick={onCopyCode} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                            </button>
                        </div>
                    </div>

                    {/* Copy Invite Link */}
                    <button
                        onClick={handleCopyLink}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Link className="w-4 h-4 text-gray-400" />
                            <span>Sao chép liên kết mời</span>
                        </div>
                        {linkCopied && <Check className="w-4 h-4 text-green-500" />}
                    </button>

                    {/* Email Invite */}
                    {!showEmailForm ? (
                        <button
                            onClick={() => { setShowEmailForm(true); setShowQR(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <Mail className="w-4 h-4 text-gray-400" />
                            Mời qua email
                        </button>
                    ) : (
                        <div className="p-3 bg-blue-50 rounded-lg space-y-2">
                            <p className="text-xs font-medium text-blue-800">Nhập email học sinh:</p>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@example.com"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onKeyDown={(e) => e.key === 'Enter' && handleInviteEmail()}
                            />
                            {inviteMessage && (
                                <p className={`text-xs ${inviteMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                    {inviteMessage.text}
                                </p>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleInviteEmail}
                                    disabled={inviting || !email.trim()}
                                    className="flex-1 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-lg transition-colors"
                                >
                                    {inviting ? 'Đang mời...' : 'Mời'}
                                </button>
                                <button
                                    onClick={() => { setShowEmailForm(false); setInviteMessage(null); }}
                                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    )}

                    {/* QR Code */}
                    {!showQR ? (
                        <button
                            onClick={() => { setShowQR(true); setShowEmailForm(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <QrCode className="w-4 h-4 text-gray-400" />
                            Hiện mã QR
                        </button>
                    ) : (
                        <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-gray-700">Mã QR tham gia lớp</p>
                                <button
                                    onClick={() => setShowQR(false)}
                                    className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                    Đóng
                                </button>
                            </div>
                            {renderQRCode(inviteLink)}
                            <p className="text-[10px] text-center text-gray-400">
                                Quét mã để tham gia lớp học
                            </p>
                        </div>
                    )}
                </div>
            </>
        ),
        attendance: (
            <>
                <div className="p-3 border-b border-gray-100 bg-green-50">
                    <h4 className="text-sm font-semibold text-green-800">Điểm danh</h4>
                </div>
                <div className="p-3 space-y-2">
                    <button
                        onClick={() => { onClose(); router.push(`/dashboard/classes/${classId}?action=attendance`); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                        <CalendarCheck className="w-4 h-4" />
                        Bắt đầu điểm danh
                    </button>
                    <button
                        onClick={() => { onClose(); router.push(`/dashboard/classes/${classId}/attendance-history`); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        <FileText className="w-4 h-4 text-gray-400" />
                        Xem lịch sử điểm danh
                    </button>
                </div>
            </>
        ),
        grades: (
            <>
                <div className="p-3 border-b border-gray-100 bg-purple-50">
                    <h4 className="text-sm font-semibold text-purple-800">Sổ điểm</h4>
                </div>
                <div className="p-3 space-y-2">
                    <button
                        onClick={() => { onClose(); router.push(`/dashboard/classes/${classId}/grades`); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Mở sổ điểm
                    </button>
                    <button
                        onClick={async () => {
                            const result = await exportGradesAction(classId);
                            if (result.success && result.data) {
                                // Download CSV
                                const blob = new Blob([result.data.csvContent], { type: 'text/csv;charset=utf-8;' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `bang-diem-${classId}.csv`;
                                link.click();
                                URL.revokeObjectURL(url);
                            } else {
                                alert(result.error || 'Lỗi khi xuất bảng điểm');
                            }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        <Download className="w-4 h-4 text-gray-400" />
                        Xuất bảng điểm (CSV)
                    </button>
                </div>
            </>
        )
    };

    return createPortal(
        <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
                position: 'fixed',
                top: position.top,
                right: position.right,
                zIndex: 60
            }}
            className="w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
        >
            {content[type]}
        </motion.div>,
        document.body
    );
}

export default function ClassInfoPanel({
    classId,
    currentUserId,
    isOpen,
    onClose,
}: ClassInfoPanelProps) {
    const router = useRouter();
    const panelRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [classInfo, setClassInfo] = useState<any>(null);
    const [copied, setCopied] = useState(false);
    const [showAllMembers, setShowAllMembers] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeSubPanel, setActiveSubPanel] = useState<SubPanelType>(null);

    const loadClassInfo = async () => {
        setLoading(true);
        console.log("ClassInfoPanel: Loading class info for", classId, "user", currentUserId);
        const result = await getClassInfoAction(classId, currentUserId);
        console.log("ClassInfoPanel: Result", result);
        if (result.success && result.data) {
            setClassInfo(result.data);
        } else {
            console.error("ClassInfoPanel: Failed to load", result.error);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen && classId) {
            loadClassInfo();
        }
        if (!isOpen) {
            setActiveSubPanel(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, classId]);

    const copyCode = () => {
        if (classInfo?.classInfo.code) {
            navigator.clipboard.writeText(classInfo.classInfo.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleAssignRole = async (studentId: string, role: StudentRole) => {
        setSaving(true);
        const result = await assignStudentRoleAction(classId, currentUserId, studentId, role);
        if (result.success) {
            loadClassInfo();
        }
        setSaving(false);
    };

    const handleToggleNotifications = async () => {
        if (!classInfo) return;
        const enrollment = classInfo.members.find((m: MemberInfo) => m.id === currentUserId);
        if (!enrollment) return;
        setSaving(true);
        const newValue = !enrollment.notificationsEnabled;
        const result = await toggleMemberNotificationsAction(classId, currentUserId, newValue);
        if (result.success) {
            loadClassInfo();
        }
        setSaving(false);
    };

    if (!classInfo) {
        return null;
    }

    const isTeacher = classInfo.teacher.id === currentUserId;
    const userEnrollment = classInfo.members.find((m: MemberInfo) => m.id === currentUserId);

    // Sort members: Owner > Teacher > Monitor > Vice Monitor > Student
    const sortedMembers = [...classInfo.members].sort((a, b) => {
        if (a.id === classInfo.teacher.id) return -1;
        if (b.id === classInfo.teacher.id) return 1;

        const roleOrder: Record<string, number> = {
            teacher: 1,
            monitor: 2,
            vice_monitor: 3,
            student: 4
        };
        const priorityA = roleOrder[a.role] || 4;
        const priorityB = roleOrder[b.role] || 4;

        return priorityA - priorityB;
    });

    const displayedMembers = showAllMembers ? sortedMembers : sortedMembers.slice(0, 5);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Click-away layer - fully transparent, no visual effect */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => { setActiveSubPanel(null); onClose(); }}
                    />

                    {/* Sub-popup rendered via portal */}
                    <AnimatePresence>
                        {activeSubPanel && (
                            <SubPopup
                                type={activeSubPanel}
                                classInfo={classInfo}
                                onClose={() => { setActiveSubPanel(null); onClose(); }}
                                onCopyCode={copyCode}
                                copied={copied}
                                classId={classId}
                                router={router}
                                panelRef={panelRef}
                            />
                        )}
                    </AnimatePresence>

                    {/* Draggable Popup Panel - Larger & Better Design */}
                    <motion.div
                        ref={panelRef}
                        drag
                        dragMomentum={false}
                        dragElastic={0.1}
                        initial={{ opacity: 0, x: 40, scale: 0.96 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 40, scale: 0.96 }}
                        transition={{
                            type: "spring",
                            damping: 28,
                            stiffness: 350
                        }}
                        className="fixed right-6 top-1/2 -translate-y-1/2 w-[400px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200/60 z-50 flex flex-col cursor-move overflow-hidden"
                        style={{ touchAction: 'none' }}
                    >
                        {/* Header - Clean & Modern */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50 cursor-move">
                            <div className="flex items-center gap-3">
                                {/* Drag handle */}
                                <div className="flex flex-col gap-0.5 opacity-40">
                                    <div className="w-5 h-0.5 bg-gray-400 rounded-full"></div>
                                    <div className="w-5 h-0.5 bg-gray-400 rounded-full"></div>
                                </div>
                                <h2 className="text-base font-semibold text-gray-800">Thông tin lớp học</h2>
                            </div>
                            <button
                                onClick={() => { setActiveSubPanel(null); onClose(); }}
                                className="p-2 hover:bg-gray-200/80 rounded-lg transition-all"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex-1 flex items-center justify-center py-12">
                                <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full" />
                            </div>
                        ) : classInfo ? (
                            <div className="flex-1 overflow-y-auto">
                                {/* Class Header - Enhanced */}
                                <div className="p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-${classInfo.classInfo.color}-500 to-${classInfo.classInfo.color}-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                                            {classInfo.classInfo.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-gray-900 truncate">{classInfo.classInfo.name}</h3>
                                            <p className="text-sm text-gray-600 mt-0.5">{classInfo.classInfo.subject}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="w-6 h-6 rounded-full bg-white shadow-sm overflow-hidden flex items-center justify-center">
                                                    <span className="text-xs">👨‍🏫</span>
                                                </div>
                                                <span className="text-xs text-gray-500">{classInfo.teacher.name}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats - Enhanced Grid */}
                                    <div className="grid grid-cols-4 gap-2 mt-4">
                                        <div className="bg-white/80 backdrop-blur-sm rounded-xl py-2.5 px-2 text-center shadow-sm">
                                            <div className="text-lg font-bold text-blue-600">{classInfo.stats.studentCount}</div>
                                            <div className="text-[10px] text-gray-500 font-medium">Học sinh</div>
                                        </div>
                                        <div className="bg-white/80 backdrop-blur-sm rounded-xl py-2.5 px-2 text-center shadow-sm">
                                            <div className="text-lg font-bold text-purple-600">{classInfo.stats.announcementCount}</div>
                                            <div className="text-[10px] text-gray-500 font-medium">Thông báo</div>
                                        </div>
                                        <div className="bg-white/80 backdrop-blur-sm rounded-xl py-2.5 px-2 text-center shadow-sm">
                                            <div className="text-lg font-bold text-green-600">{classInfo.stats.assignmentCount}</div>
                                            <div className="text-[10px] text-gray-500 font-medium">Bài tập</div>
                                        </div>
                                        <div className="bg-white/80 backdrop-blur-sm rounded-xl py-2.5 px-2 text-center shadow-sm">
                                            <div className="text-lg font-bold text-orange-600">{classInfo.stats.resourceCount}</div>
                                            <div className="text-[10px] text-gray-500 font-medium">Tài liệu</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions - Teacher Menu */}
                                {isTeacher && (
                                    <div className="p-3 border-b border-gray-100">
                                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2 px-1">Quản lý lớp học</p>
                                        <div className="space-y-1">
                                            {/* Invite Students */}
                                            <button
                                                onClick={() => setActiveSubPanel(activeSubPanel === 'invite' ? null : 'invite')}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors group ${activeSubPanel === 'invite' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <UserPlus className={`w-4 h-4 ${activeSubPanel === 'invite' ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                                                    <span>Mời học sinh</span>
                                                </div>
                                                <ChevronLeft className={`w-4 h-4 transition-transform ${activeSubPanel === 'invite' ? 'text-blue-500' : 'text-gray-300'}`} />
                                            </button>

                                            {/* Attendance */}
                                            <button
                                                onClick={() => setActiveSubPanel(activeSubPanel === 'attendance' ? null : 'attendance')}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors group ${activeSubPanel === 'attendance' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-green-50 hover:text-green-700'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <CalendarCheck className={`w-4 h-4 ${activeSubPanel === 'attendance' ? 'text-green-600' : 'text-gray-400 group-hover:text-green-600'}`} />
                                                    <span>Điểm danh</span>
                                                </div>
                                                <ChevronLeft className={`w-4 h-4 transition-transform ${activeSubPanel === 'attendance' ? 'text-green-500' : 'text-gray-300'}`} />
                                            </button>

                                            {/* Grades */}
                                            <button
                                                onClick={() => setActiveSubPanel(activeSubPanel === 'grades' ? null : 'grades')}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors group ${activeSubPanel === 'grades' ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FileSpreadsheet className={`w-4 h-4 ${activeSubPanel === 'grades' ? 'text-purple-600' : 'text-gray-400 group-hover:text-purple-600'}`} />
                                                    <span>Sổ điểm</span>
                                                </div>
                                                <ChevronLeft className={`w-4 h-4 transition-transform ${activeSubPanel === 'grades' ? 'text-purple-500' : 'text-gray-300'}`} />
                                            </button>

                                            {/* Settings - Direct link */}
                                            <button
                                                onClick={() => { setActiveSubPanel(null); onClose(); router.push(`/dashboard/classes/${classId}/settings`); }}
                                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Settings className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                                                    <span>Cài đặt lớp học</span>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-300" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Notification Toggle - For all users */}
                                {userEnrollment && (
                                    <div className="p-3 border-b border-gray-100">
                                        <button
                                            onClick={handleToggleNotifications}
                                            disabled={saving}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${userEnrollment.notificationsEnabled
                                                ? "bg-gray-50 text-gray-700 hover:bg-gray-100"
                                                : "bg-red-50 text-red-700 hover:bg-red-100"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {userEnrollment.notificationsEnabled ? (
                                                    <Bell className="w-4 h-4" />
                                                ) : (
                                                    <BellOff className="w-4 h-4" />
                                                )}
                                                <span>{userEnrollment.notificationsEnabled ? "Thông báo đang bật" : "Thông báo đã tắt"}</span>
                                            </div>
                                            <div className={`w-10 h-5 rounded-full transition-colors relative ${userEnrollment.notificationsEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${userEnrollment.notificationsEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {/* Class Code */}
                                {classInfo.classInfo.codeEnabled && (
                                    <div className="p-4 border-b border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Mã lớp học</p>
                                                <p className="text-lg font-mono font-bold text-gray-900">{classInfo.classInfo.code}</p>
                                            </div>
                                            <button
                                                onClick={copyCode}
                                                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                            >
                                                {copied ? (
                                                    <Check className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <Copy className="w-5 h-5 text-gray-600" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Pinned Announcements */}
                                {classInfo.pinnedAnnouncements.length > 0 && (
                                    <div className="p-4 border-b border-gray-100">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <Pin className="w-4 h-4 text-yellow-600" />
                                            Thông báo đã ghim ({classInfo.pinnedAnnouncements.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {classInfo.pinnedAnnouncements.slice(0, 3).map((ann: any) => (
                                                <div key={ann.id} className="p-2 bg-yellow-50/50 rounded-lg border border-yellow-100">
                                                    <p className="text-xs text-gray-700 line-clamp-2">{ann.content}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        {new Date(ann.createdAt).toLocaleDateString("vi-VN")}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Members Section */}
                                <div className="p-4 border-b border-gray-100">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-blue-600" />
                                        Thành viên ({classInfo.members.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {displayedMembers.map((member: MemberInfo) => (
                                            <div
                                                key={member.id}
                                                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${member.id === classInfo.teacher.id
                                                    ? "bg-blue-50/50"
                                                    : "hover:bg-gray-50"
                                                    }`}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-medium">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-1">
                                                        {member.name}
                                                        {member.role === "CLASS_MONITOR" && (
                                                            <Crown className="w-3.5 h-3.5 text-yellow-500" />
                                                        )}
                                                        {member.role === "VICE_MONITOR" && (
                                                            <Star className="w-3.5 h-3.5 text-blue-500" />
                                                        )}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500">
                                                        {member.id === classInfo.teacher.id ? (
                                                            <span className="text-blue-600 flex items-center gap-1">
                                                                <BookOpen className="w-3 h-3" /> GV Chủ Nhiệm
                                                            </span>
                                                        ) : member.role === "teacher" ? (
                                                            <span className="text-indigo-600 font-medium">GV Bộ Môn</span>
                                                        ) : member.role === "monitor" ? (
                                                            "Lớp trưởng"
                                                        ) : member.role === "vice_monitor" ? (
                                                            "Lớp phó"
                                                        ) : (
                                                            "Học sinh"
                                                        )}
                                                    </p>
                                                </div>
                                                {/* Role assignment for teachers */}
                                                {isTeacher && member.id !== classInfo.teacher.id && (
                                                    <select
                                                        value={member.role}
                                                        onChange={(e) => handleAssignRole(member.id, e.target.value as StudentRole)}
                                                        disabled={saving}
                                                        className="text-[10px] bg-white border border-gray-200 rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        <option value="student">HS</option>
                                                        <option value="monitor">LT</option>
                                                        <option value="vice_monitor">LP</option>
                                                        <option value="teacher">GV</option>
                                                    </select>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {classInfo.members.length > 5 && (
                                        <button
                                            onClick={() => setShowAllMembers(!showAllMembers)}
                                            className="w-full mt-2 text-xs text-blue-600 hover:text-blue-700 py-1"
                                        >
                                            {showAllMembers ? "Thu gọn" : `Xem tất cả ${classInfo.members.length} thành viên`}
                                        </button>
                                    )}
                                </div>

                                {/* Recent Media */}
                                {classInfo.recentMedia.length > 0 && (
                                    <div className="p-4 border-b border-gray-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4 text-green-600" />
                                                File & media gần đây
                                            </h4>
                                            <button
                                                onClick={() => {
                                                    onClose();
                                                    router.push(`/dashboard/classes/${classId}?tab=resources`);
                                                }}
                                                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                            >
                                                Xem tất cả
                                                <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {classInfo.recentMedia.slice(0, 6).map((media: any, i: number) => (
                                                <a
                                                    key={i}
                                                    href={media.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                                                    title={media.announcementId ? `Từ thông báo • ${media.name}` : media.name}
                                                >
                                                    {/* File Preview/Icon */}
                                                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                        {media.type?.startsWith("image") ? (
                                                            <img
                                                                src={media.url}
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : media.type?.includes("pdf") ? (
                                                            <FileText className="w-5 h-5 text-red-500" />
                                                        ) : (
                                                            <File className="w-5 h-5 text-gray-400" />
                                                        )}
                                                    </div>

                                                    {/* File Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-gray-800 truncate">
                                                            {media.name || 'File đính kèm'}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                                            {media.announcementId && (
                                                                <>
                                                                    <MessageSquare className="w-3 h-3 text-blue-500" />
                                                                    <span className="text-blue-500">Từ thông báo</span>
                                                                    <span>•</span>
                                                                </>
                                                            )}
                                                            <span>{media.type?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                                                        </div>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                        {classInfo.recentMedia.length > 6 && (
                                            <p className="text-[10px] text-gray-400 mt-2 text-center">
                                                +{classInfo.recentMedia.length - 6} file khác
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Leave Class - For students only */}
                                {!isTeacher && (
                                    <div className="p-3 border-t border-gray-100">
                                        <button
                                            onClick={async () => {
                                                if (confirm("Bạn có chắc muốn rời khỏi lớp học này?")) {
                                                    const result = await leaveClassAction(classId);
                                                    if (result.success) {
                                                        onClose();
                                                        router.push('/dashboard/classes');
                                                    } else {
                                                        alert(result.message);
                                                    }
                                                }
                                            }}
                                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Rời lớp học
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-500">
                                Không thể tải thông tin lớp học
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
