"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getCurrentUserAction, getPendingEnrollmentsAction, approveEnrollmentAction, rejectEnrollmentAction, getClassByIdAction } from "@/lib/actions";
import { getClassMembersAction, removeStudentFromClassAction } from "@/lib/class-member-actions";
import { Class, User } from "@/types";
import { ArrowLeft, Search, Users, Clock, CheckCircle, XCircle, Trash2, Copy } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import InviteStudentModal from "@/components/InviteStudentModal";

// Simplified type for Members from action
type Member = {
    id: string; // User ID
    name: string;
    email: string;
    role: 'teacher' | 'student';
    avatarUrl?: string;
    enrollmentId: string;
    joinedAt: Date;
};

type PendingEnrollment = {
    id: string;
    user: User;
    createdAt: string;
    role: string;
};

import { Suspense } from "react";

function RosterContent() {
    const params = useParams();
    const classId = params.id as string;
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [classData, setClassData] = useState<Class | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<'members' | 'pending'>('members');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const user = await getCurrentUserAction();
            if (!user) {
                router.push('/login');
                return;
            }
            setCurrentUser(user as any);

            const cls = await getClassByIdAction(classId);
            if (!cls) {
                showToast('Lớp học không tồn tại', 'error');
                router.push('/dashboard/classes');
                return;
            }
            setClassData(cls);

            // Only teachers can access roster
            if (user.role !== 'teacher' || cls.teacherId !== user.id) {
                showToast('Bạn không có quyền truy cập trang này', 'error');
                router.push(`/dashboard/classes/${classId}`);
                return;
            }

            const enrollments = await getClassMembersAction(classId);
            const pending = await getPendingEnrollmentsAction(classId);

            setMembers(enrollments as any);
            setPendingEnrollments(pending as any);
        } catch (_error) {
            console.error('Failed to load roster:', _error);
            showToast('Không thể tải danh sách thành viên', 'error');
        } finally {
            setLoading(false);
        }
    }, [classId, router, showToast]);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'pending') {
            setActiveTab('pending');
        }
        loadData();
    }, [classId, searchParams, loadData]);

    async function handleRemoveMember(enrollmentId: string, userName: string) {
        if (!confirm(`Bạn có chắc muốn xóa ${userName} khỏi lớp?`)) {
            return;
        }

        try {
            await removeStudentFromClassAction(enrollmentId);
            showToast(`Đã xóa ${userName} khỏi lớp`, 'success');
            await loadData(); // Reload
        } catch (_error) {
            console.error('Failed to remove member:', _error);
            showToast('Không thể xóa thành viên', 'error');
        }
    }

    async function handleCopyClassCode() {
        if (!classData?.code) return;
        try {
            await navigator.clipboard.writeText(classData.code);
            showToast('Đã copy mã lớp học!', 'success');
        } catch (error) {
            showToast('Không thể copy', 'error');
        }
    }

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-1/3"></div>
                    <div className="h-64 bg-muted rounded"></div>
                </div>
            </div>
        );
    }

    if (!classData || !currentUser) return null;

    const pendingCount = pendingEnrollments.length;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/dashboard/classes/${classId}`}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Danh sách thành viên</h1>
                        <p className="text-muted-foreground">{classData.name}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-card border rounded-lg px-4 py-2 flex items-center gap-2">
                        <code className="text-lg font-mono font-semibold">{classData.code}</code>
                        <button
                            onClick={handleCopyClassCode}
                            className="p-1.5 hover:bg-muted rounded transition-colors"
                            title="Copy mã lớp"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Tổng thành viên</p>
                            <p className="text-2xl font-bold">{members.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-card border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Chờ phê duyệt</p>
                            <p className="text-2xl font-bold">{pendingCount}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-card border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Đã phê duyệt</p>
                            <p className="text-2xl font-bold">{members.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-card border rounded-xl overflow-hidden">
                <div className="border-b flex">
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`flex-1 px-6 py-3 font-medium transition-colors ${activeTab === 'members'
                            ? 'bg-primary/10 text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:bg-muted/50'
                            }`}
                    >
                        Thành viên ({members.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 px-6 py-3 font-medium transition-colors relative ${activeTab === 'pending'
                            ? 'bg-primary/10 text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:bg-muted/50'
                            }`}
                    >
                        Chờ duyệt ({pendingCount})
                        {pendingCount > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'members' && (
                        <div className="space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên hoặc email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>

                            {/* Members List */}
                            {filteredMembers.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    {searchQuery ? 'Không tìm thấy thành viên' : 'Chưa có thành viên nào'}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredMembers.map(member => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={member.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                                                    alt={member.name}
                                                    className="w-10 h-10 rounded-full border"
                                                />
                                                <div>
                                                    <p className="font-medium">{member.name}</p>
                                                    <p className="text-sm text-muted-foreground">{member.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground">
                                                        Tham gia: {new Date(member.joinedAt).toLocaleDateString('vi-VN')}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground capitalize">
                                                        {member.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveMember(member.enrollmentId, member.name)}
                                                    className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                                    title="Xóa khỏi lớp"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'pending' && (
                        <div className="space-y-4">
                            {pendingEnrollments.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    Không có yêu cầu chờ duyệt
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {pendingEnrollments.map(enrollment => (
                                        <div
                                            key={enrollment.id}
                                            className="flex items-center justify-between p-4 border border-orange-200 bg-orange-50/30 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={enrollment.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${enrollment.user.name}`}
                                                    alt={enrollment.user.name}
                                                    className="w-10 h-10 rounded-full border"
                                                />
                                                <div>
                                                    <p className="font-medium">{enrollment.user.name}</p>
                                                    <p className="text-sm text-muted-foreground">{enrollment.user.email}</p>
                                                    <p className="text-xs text-orange-600 mt-1">
                                                        Yêu cầu: {new Date(enrollment.createdAt).toLocaleString('vi-VN')}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const result = await approveEnrollmentAction(enrollment.id);
                                                            if (result.success) {
                                                                showToast(result.message, 'success');
                                                                await loadData();
                                                            } else {
                                                                showToast(result.message, 'error');
                                                            }
                                                        } catch (_error) {
                                                            showToast('Không thể chấp nhận học sinh', 'error');
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                                    title="Phê duyệt"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Duyệt
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm(`Bạn có chắc muốn từ chối ${enrollment.user.name}?`)) return;
                                                        try {
                                                            const result = await rejectEnrollmentAction(enrollment.id);
                                                            if (result.success) {
                                                                showToast(result.message, 'success');
                                                                await loadData();
                                                            } else {
                                                                showToast(result.message, 'error');
                                                            }
                                                        } catch (_error) {
                                                            showToast('Không thể từ chối yêu cầu', 'error');
                                                        }
                                                    }}
                                                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                                                    title="Từ chối"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Từ chối
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function RosterPage() {
    return (
        <Suspense fallback={<div className="max-w-6xl mx-auto p-6 text-center">Đang tải...</div>}>
            <RosterContent />
        </Suspense>
    );
}
