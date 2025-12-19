"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, Clock, Copy, LayoutDashboard, MessageSquare, Settings, Users, CalendarCheck, Home, Trash2, Plus, Check, Trophy, Calendar, FolderOpen, Search, Filter, CheckCircle, FileSpreadsheet, FileEdit, Sparkles, Bell, AlertTriangle, Info, ChevronRight } from "lucide-react";
import { DataService } from "@/lib/data";
import StreamTabContent from '@/components/features/StreamTabContent';
import { createAnnouncementAction, getClassAnnouncementsAction, getStudentSubmissionsAction, getTeacherAssignmentsAction, updateClassDetailsAction, getClassResourcesAction, getCurrentUserAction } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import { Assignment, Class, Submission, User } from "@/types";
import { ResourceCard } from "@/components/ResourceCard";
import { NoAssignmentsEmpty, NoStudentsEmpty, NoSearchResults } from "@/components/EmptyStates";
import { FileUpload } from "@/components/FileUpload";
import AttendanceStudentView from "@/components/AttendanceStudentView";
import AnnouncementCard from "@/components/AnnouncementCard";
import AnnouncementComposer from "@/components/AnnouncementComposer";
import StreamFilterSidebar from "@/components/StreamFilterSidebar";
// StreamWidgetsSidebar deleted
import { useStreamFilters } from "@/hooks/useStreamFilters";
import BackToTopButton from "@/components/BackToTopButton";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { fadeInUp, staggerContainer, pageTransition } from "@/utils/motionConfig";
import Link from "next/link";
import { ClassDashboardSkeleton as ClassPageSkeleton } from "@/components/skeletons/ClassPageSkeletons";
import { AlertCircle } from "lucide-react";


import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
// import { toast } from "react-hot-toast";
import TeacherClassOverview from "@/components/features/TeacherClassOverview";

import PeopleTabContent from "@/components/features/PeopleTabContent";
import InviteStudentModal from "@/components/InviteStudentModal";
import CSVImportModal from "@/components/CSVImportModal";
import { DraggableModal } from "@/components/ui/DraggableModal";

import ResourcesTabContent from "@/components/features/ResourcesTabContent";
import ScheduleTabContent from "../../../../components/features/ScheduleTabContent";
import QuickActionModal from "@/components/QuickActionModal";
import ClassInfoPanel from "@/components/ClassInfoPanel";
import { InClassAssignmentCreator } from "@/components/features/InClassAssignmentCreator";
import StudentOverviewTab from "@/components/features/StudentOverviewTab";
import AIAssistantFAB from "@/components/AIAssistantFAB";

const formatSchedule = (scheduleStr: string | null | undefined) => {
    if (!scheduleStr) return 'Chưa có lịch';
    try {
        const schedule = JSON.parse(scheduleStr);
        if (typeof schedule !== 'object') return scheduleStr;

        const daysMap: Record<string, string> = {
            'Mon': 'Thứ 2',
            'Tue': 'Thứ 3',
            'Wed': 'Thứ 4',
            'Thu': 'Thứ 5',
            'Fri': 'Thứ 6',
            'Sat': 'Thứ 7',
            'Sun': 'CN'
        };

        const formattedParts = Object.keys(schedule).map(key => {
            const [day, period] = key.split('-');
            const dayName = daysMap[day] || day;
            return `${dayName} (Tiết ${period})`;
        });

        return formattedParts.join(', ');
    } catch (e) {
        return scheduleStr;
    }
};

export default function ClassDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const classId = params.id as string;

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [classData, setClassData] = useState<Class | null>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [pendingStudents, setPendingStudents] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);

    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [filterType, setFilterType] = useState("ALL");
    const [teacherName, setTeacherName] = useState<string>("Giáo viên");
    const [myEnrollmentId, setMyEnrollmentId] = useState<string | null>(null);
    const [myRole, setMyRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"dashboard" | "stream" | "classwork" | "people" | "settings" | "resources" | "schedule">("dashboard");
    const [peopleSubTab, setPeopleSubTab] = useState<'roster' | 'attendance'>('roster');
    const [showMenu, setShowMenu] = useState(false);
    const [resources, setResources] = useState<any[]>([]);

    // Classwork Tab State
    const [classworkFilter, setClassworkFilter] = useState<'all' | 'open' | 'submitted' | 'graded' | 'draft'>('all');
    const [classworkSearch, setClassworkSearch] = useState("");

    const [isInviting, setIsInviting] = useState(false);
    const [quickActionType, setQuickActionType] = useState<'invite' | 'attendance' | 'grades' | 'settings' | null>(null);
    const [isImportingCSV, setIsImportingCSV] = useState(false);
    const [peopleSearch, setPeopleSearch] = useState("");
    const [showClassInfo, setShowClassInfo] = useState(false);
    const [showInClassAssignment, setShowInClassAssignment] = useState(false);

    // Pagination state for Stream
    const [displayCount, setDisplayCount] = useState(20);
    const PAGE_SIZE = 10;

    // Initialize stream filters hook
    const {
        filteredAnnouncements,
        searchQuery,
        filters,
        sortBy,
        setSearchQuery,
        setFilters,
        setSortBy,
        filteredCount
    } = useStreamFilters(announcements);

    // Read tab from URL query params
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['dashboard', 'stream', 'classwork', 'people', 'settings', 'resources', 'schedule'].includes(tab)) {
            setActiveTab(tab as typeof activeTab);
        }
    }, [searchParams]);

    // Reset displayCount when filter changes
    useEffect(() => {
        setDisplayCount(20);
    }, [filters]);

    // Settings State
    const [settingsForm, setSettingsForm] = useState({ name: '', description: '', subject: '' });
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const copyCode = () => {
        if (classData?.code) {
            navigator.clipboard.writeText(classData.code);
            setCopied(true);
            showToast("Đã sao chép mã lớp", "success");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleLeaveClass = async () => {
        if (!myEnrollmentId) return;
        if (!confirm("Bạn có chắc chắn muốn rời khỏi lớp học này? Mọi dữ liệu điểm số và bài làm sẽ được lưu trữ nhưng bạn sẽ không thể truy cập lớp học nữa.")) return;

        try {
            const result = await DataService.removeStudentFromClass(myEnrollmentId);
            if (result.success) {
                showToast("Đã rời lớp học thành công", "success");
                router.push('/dashboard/classes');
            } else {
                showToast(result.message, "error");
            }
        } catch (error) {
            showToast("Có lỗi xảy ra khi rời lớp", "error");
        }
    };

    const handleRemoveStudent = async (studentId: string) => {
        const student = students.find(s => s.userId === studentId);
        if (!student || !student.enrollmentId) return;

        if (confirm(`Bạn có chắc muốn xóa học sinh ${student.name} khỏi lớp?`)) {
            const result = await DataService.removeStudentFromClass(student.enrollmentId);
            if (result.success) {
                setStudents(prev => prev.filter(s => s.userId !== studentId));
                showToast("Đã xóa học sinh khỏi lớp", "success");
            } else {
                showToast(result.message || "Không thể xóa học sinh", "error");
            }
        }
    };

    const handleApproveStudent = async (enrollmentId: string) => {
        const { approveEnrollmentAction } = await import('@/lib/actions');
        const result = await approveEnrollmentAction(enrollmentId);
        if (result.success) {
            showToast("Đã chấp nhận học sinh vào lớp", "success");
            // Refresh counts and lists
            const pending = await (await import('@/lib/actions')).getPendingEnrollmentsAction(classId);
            setPendingStudents(pending);
            const classEnrollments = await DataService.getClassMembers(classId);
            const transformedStudents = classEnrollments.map((e: any) => ({
                ...e,
                userId: e.id,
                name: e.name,
                email: e.email,
                avatarUrl: e.avatarUrl,
                enrollmentId: e.enrollmentId // Ensure enrollmentId is passed
            }));
            setStudents(transformedStudents);
        } else {
            showToast(result.message || "Lỗi khi phê duyệt", "error");
        }
    };

    const handleRejectStudent = async (enrollmentId: string) => {
        if (confirm("Từ chối yêu cầu tham gia này?")) {
            const { rejectEnrollmentAction } = await import('@/lib/actions');
            const result = await rejectEnrollmentAction(enrollmentId);
            if (result.success) {
                showToast("Đã từ chối yêu cầu", "success");
                const pending = await (await import('@/lib/actions')).getPendingEnrollmentsAction(classId);
                setPendingStudents(pending);
            } else {
                showToast(result.message || "Lỗi khi từ chối", "error");
            }
        }
    };

    const handleUpdateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingSettings(true);
        try {
            const result = await updateClassDetailsAction(classId, settingsForm);
            if (result.success) {
                showToast(result.message, "success");
                setClassData(prev => prev ? { ...prev, ...settingsForm } : null);
            } else {
                showToast(result.message, "error");
            }
        } catch (error) {
            showToast("Có lỗi xảy ra khi cập nhật", "error");
        } finally {
            setIsSavingSettings(false);
        }
    };

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadClassData() {
            if (!classId) return;
            setError(null);

            try {
                const user = await getCurrentUserAction();
                if (!user) {
                    router.push('/login');
                    return;
                }
                setCurrentUser(user);

                const cls = await DataService.getClassById(classId);
                if (!cls) {
                    setError("Không tìm thấy lớp học hoặc bạn không có quyền truy cập.");
                    return;
                }
                setClassData(cls as unknown as Class);
                setSettingsForm({
                    name: cls.name,
                    description: cls.description || '',
                    subject: cls.subject
                });

                // Load students (Classmates)
                const classEnrollments = await DataService.getClassMembers(classId);
                // Transform to old format for backward compatibility with PeopleTabContent
                // DataService.getClassMembers now returns User[] directly
                const transformedStudents = classEnrollments.map((e: any) => ({
                    ...e,
                    userId: e.id, // Map for PeopleTabContent
                    name: e.name,
                    email: e.email,
                    avatarUrl: e.avatarUrl,
                    // xp: e.xp, // Removed
                    // level: e.level // Removed
                }));
                setStudents(transformedStudents);

                // Load pending enrollments (Teacher Only)
                if (user.role === 'teacher') {
                    const { getPendingEnrollmentsAction } = await import('@/lib/actions');
                    const pending = await getPendingEnrollmentsAction(classId);
                    setPendingStudents(pending);
                }

                // Load assignments
                const allAssignments = await DataService.getAssignments();
                const classAssignments = allAssignments.filter(a => a.classIds.includes(classId));
                setAssignments(classAssignments);

                // Load submissions based on role
                if (user.role === 'teacher') {
                    const classSubmissions: Submission[] = [];
                    for (const assignment of classAssignments) {
                        const subs = await DataService.getSubmissionsByAssignmentId(assignment.id);
                        classSubmissions.push(...subs);
                    }
                    setSubmissions(classSubmissions);
                } else {
                    // For student, only load their own submissions
                    const mySubmissions: Submission[] = [];
                    for (const assignment of classAssignments) {
                        const sub = await DataService.getStudentSubmission(assignment.id, user.id);
                        if (sub) mySubmissions.push(sub);
                    }
                    setSubmissions(mySubmissions);

                    // Fetch teacher name and my enrollment ID
                    const enrollments = await DataService.getUserEnrollments();
                    const currentEnrollment = enrollments.find((e: any) => e.classId === classId) as any;
                    if (currentEnrollment) {
                        setTeacherName(currentEnrollment.teacherName);
                        setMyEnrollmentId(currentEnrollment.id);
                        setMyRole(currentEnrollment.role);
                    }
                }



                // Load Announcements
                const classAnnouncements = await getClassAnnouncementsAction(classId);
                setAnnouncements(classAnnouncements);

                // Load Resources
                const resourcesResult = await getClassResourcesAction(classId);
                if (resourcesResult.success) {
                    setResources(resourcesResult.data || []);
                }

            } catch (error) {
                console.error("Failed to load class data", error);
                setError("Có lỗi xảy ra khi tải dữ liệu lớp học. Vui lòng thử lại sau.");
            } finally {
                setLoading(false);
            }
        }

        loadClassData();
    }, [classId, router]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input or textarea
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

            // Tab Navigation (Alt + 1-5)
            if (e.altKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        setActiveTab('dashboard');
                        break;
                    case '2':
                        e.preventDefault();
                        setActiveTab('stream');
                        break;
                    case '3':
                        e.preventDefault();
                        setActiveTab('classwork');
                        break;
                    case '4':
                        e.preventDefault();
                        setActiveTab('people');
                        break;
                }
            }

            // Quick Actions
            // New Announcement (Ctrl/Cmd + N) - Teacher/Monitor only
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                if (currentUser?.role === 'teacher' || myRole === 'monitor') {
                    e.preventDefault();
                    // If we are not on stream tab, switch to it first? 
                    // Or just focus the composer if it's visible?
                    // For now, let's switch to stream tab
                    setActiveTab('stream');
                    // Ideally we would focus the composer input, but that requires a ref
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentUser, myRole]);

    if (loading) {
        return <ClassPageSkeleton />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h2>
                <p className="text-gray-600 mb-6 max-w-md">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Tải lại trang
                </button>
            </div>
        );
    }

    if (!classData || !currentUser) return null;

    // --- TEACHER VIEW ---
    if (currentUser.role === 'teacher') {
        return (
            <div className="space-y-6 -m-8 p-8">
                {/* Skip to Content Link for Accessibility */}
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
                >
                    Bỏ qua điều hướng
                </a>



                <InviteStudentModal
                    isOpen={isInviting}
                    onClose={() => setIsInviting(false)}
                    classId={classId}
                    onSuccess={() => {
                        // Refresh student list if needed, or rely on revalidation
                        showToast("Đã gửi lời mời", "success");
                    }}
                />

                {/* Quick Action Preview Modal */}
                {quickActionType && (
                    <QuickActionModal
                        isOpen={!!quickActionType}
                        onClose={() => setQuickActionType(null)}
                        type={quickActionType}
                        classId={classId}
                        className={classData.name}
                        settingsData={{
                            name: classData.name,
                            subject: classData.subject,
                            code: classData.code,
                            studentCount: students.length
                        }}
                        gradesData={{
                            totalAssignments: assignments.length,
                            gradedCount: submissions.filter(s => s.status === 'graded').length,
                            averageScore: submissions.length > 0
                                ? submissions.filter(s => s.score).reduce((sum, s) => sum + (s.score || 0), 0) / submissions.filter(s => s.score).length
                                : 0,
                            pendingCount: submissions.filter(s => s.status === 'submitted').length
                        }}
                        onInviteClick={() => {
                            setQuickActionType(null);
                            setIsInviting(true);
                        }}
                    />
                )}

                {/* Class Info Panel */}
                <ClassInfoPanel
                    classId={classId}
                    currentUserId={currentUser?.id || ""}
                    isOpen={showClassInfo}
                    onClose={() => setShowClassInfo(false)}
                />

                {/* In-Class Assignment Creator Modal */}
                {showInClassAssignment && (
                    <InClassAssignmentCreator
                        classData={classData}
                        onClose={() => setShowInClassAssignment(false)}
                        onSuccess={async () => {
                            // Reload assignments after creating new one
                            const allAssignments = await DataService.getAssignments();
                            const classAssignments = allAssignments.filter(a => a.classIds.includes(classId));
                            setAssignments(classAssignments);
                        }}
                    />
                )}

                {/* Hero Header Container */}
                <div className="relative">
                    {/* Background & Content */}
                    <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg">
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute bottom-0 left-0 p-6 w-full bg-gradient-to-t from-black/80 to-transparent">
                            <div className="flex items-end justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">{classData.name}</h1>
                                    <div className="flex items-center gap-4 text-sm opacity-90">
                                        <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {classData.subject}</span>

                                    </div>
                                </div>
                                <div className="hidden md:block text-right">
                                    <div className="text-sm opacity-75">Mã lớp</div>
                                    <div className="font-mono font-bold text-xl flex items-center gap-2 cursor-pointer hover:text-yellow-300 transition-colors" onClick={copyCode}>
                                        {classData.code} <Copy className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Back Button (Absolute) */}
                    <Link href="/dashboard/classes" className="absolute top-4 left-4 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors z-10">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>

                    {/* Header Actions Menu (Absolute) */}
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                        {/* Class Info Button */}
                        <button
                            onClick={() => setShowClassInfo(true)}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors text-white"
                            title="Thông tin lớp học"
                        >
                            <Info className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
                    <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard className="w-4 h-4" />} label="Tổng quan" />
                    <TabButton active={activeTab === 'stream'} onClick={() => setActiveTab('stream')} icon={<MessageSquare className="w-4 h-4" />} label="Bảng tin" />
                    <TabButton active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon={<Calendar className="w-4 h-4" />} label="Thời khóa biểu" />
                    <TabButton active={activeTab === 'classwork'} onClick={() => setActiveTab('classwork')} icon={<BookOpen className="w-4 h-4" />} label="Bài tập" />
                    <TabButton active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} icon={<FolderOpen className="w-4 h-4" />} label="Tài liệu" />
                    <TabButton active={activeTab === 'people'} onClick={() => setActiveTab('people')} icon={<Users className="w-4 h-4" />} label="Mọi người" />
                </div>

                {/* Tab Content */}
                <div id="main-content" className="min-h-[400px] relative">
                    <AnimatePresence mode="wait">
                        {activeTab === 'dashboard' && (
                            <motion.div
                                key="dashboard"
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                variants={pageTransition}
                                className="w-full"
                            >
                                {/* Teacher Class Dashboard Overview (New) */}
                                <TeacherClassOverview
                                    classId={classId}
                                    classData={classData}
                                    currentUser={currentUser}
                                    announcements={announcements}
                                    assignments={assignments}
                                    submissions={submissions}
                                    students={students}
                                    onCreateAssignment={() => setShowInClassAssignment(true)}
                                    onPostAnnouncement={() => {
                                        // Switch to stream tab and maybe focus input?
                                        // For now just switching tab
                                        const params = new URLSearchParams(searchParams.toString());
                                        params.set('tab', 'stream');
                                        router.push(`/dashboard/classes/${classId}?${params.toString()}`);
                                    }}
                                />
                            </motion.div>
                        )}

                        {activeTab === 'stream' && (
                            <motion.div
                                key="stream"
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                variants={pageTransition}
                                className="w-full"
                            >
                                <StreamTabContent
                                    classId={classId}
                                    classData={classData}
                                    currentUser={currentUser}
                                    myRole={myRole}
                                    announcements={announcements}
                                    assignments={assignments}
                                    submissions={submissions}
                                    students={students}
                                    filters={filters}
                                    setFilters={setFilters}
                                    sortBy={sortBy}
                                    setSortBy={setSortBy}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    onPostAnnouncement={async () => {
                                        const classAnnouncements = await getClassAnnouncementsAction(classId);
                                        setAnnouncements(classAnnouncements);
                                    }}
                                />
                            </motion.div>
                        )}

                        {activeTab === 'schedule' && (
                            <motion.div
                                key="schedule"
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                variants={pageTransition}
                                className="w-full"
                            >
                                <ScheduleTabContent
                                    classData={classData}
                                    currentUser={currentUser}
                                    onUpdateClass={(updated: any) => setClassData(prev => prev ? { ...prev, ...updated } : null)}
                                />
                            </motion.div>
                        )}

                        {activeTab === 'classwork' && (
                            <motion.div
                                key="classwork"
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                variants={pageTransition}
                                className="w-full"
                            >
                                <ClassworkTabContent
                                    assignments={assignments}
                                    submissions={submissions}
                                    students={students}
                                    user={currentUser}
                                    filter={classworkFilter}
                                    setFilter={setClassworkFilter}
                                    searchQuery={classworkSearch}
                                    setSearchQuery={setClassworkSearch}
                                    onCreate={() => setShowInClassAssignment(true)}
                                />
                            </motion.div>
                        )}
                        {activeTab === 'resources' && (
                            <motion.div
                                key="resources"
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                variants={pageTransition}
                                className="w-full"
                            >
                                <ResourcesTabContent classId={classId} currentUser={currentUser} />
                            </motion.div>
                        )}
                        {activeTab === 'people' && (
                            <motion.div
                                key="people"
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                variants={pageTransition}
                                className="w-full"
                            >
                                <PeopleTabContent
                                    students={students}
                                    pendingStudents={pendingStudents}
                                    teacherName={teacherName || currentUser?.name || "Giáo viên"} // Fallback for teacher view
                                    currentUser={currentUser}
                                    classId={classId}
                                    onRemoveStudent={handleRemoveStudent}
                                    onApproveStudent={handleApproveStudent}
                                    onRejectStudent={handleRejectStudent}
                                    onInvite={() => setIsInviting(true)}
                                    onImportCSV={() => setIsImportingCSV(true)}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Modals */}
                    <CSVImportModal
                        isOpen={isImportingCSV}
                        onClose={() => setIsImportingCSV(false)}
                        classId={classId}
                    />

                    {/* Back to Top Button */}
                    <BackToTopButton />

                    {/* AI Assistant FAB */}
                    <AIAssistantFAB />
                </div>
            </div >
        );
    }

    // --- STUDENT VIEW ---
    return (
        <div className="space-y-6 -m-8 p-8">
            {/* Class Info Panel for Students */}
            <ClassInfoPanel
                classId={classId}
                currentUserId={currentUser?.id || ""}
                isOpen={showClassInfo}
                onClose={() => setShowClassInfo(false)}
            />

            {/* Hero Header */}
            <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-0 left-0 p-6 w-full bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{classData.name}</h1>
                            <div className="flex items-center gap-4 text-sm opacity-90">
                                <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {classData.subject}</span>

                            </div>
                        </div>
                        <div className="hidden md:block text-right">
                            <div className="text-sm opacity-75">Giáo viên</div>
                            <div className="font-medium text-lg">{teacherName}</div>
                        </div>
                    </div>
                </div>
                <Link href="/dashboard/classes" className="absolute top-4 left-4 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>

                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={() => setShowClassInfo(true)}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors text-white"
                        title="Thông tin lớp"
                    >
                        <Info className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            {/* Mobile Student View */}
            <div className="flex items-center gap-1 border-b border-border overflow-x-auto md:hidden">
                <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard className="w-4 h-4" />} label="Tổng quan" />
                <TabButton active={activeTab === 'stream'} onClick={() => setActiveTab('stream')} icon={<MessageSquare className="w-4 h-4" />} label="Bảng tin" />
                <TabButton active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon={<Calendar className="w-4 h-4" />} label="TKB" />
                <TabButton active={activeTab === 'classwork'} onClick={() => setActiveTab('classwork')} icon={<BookOpen className="w-4 h-4" />} label="Bài tập" />
                <TabButton active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} icon={<FolderOpen className="w-4 h-4" />} label="Tài liệu" />
                <TabButton active={activeTab === 'people'} onClick={() => setActiveTab('people')} icon={<Users className="w-4 h-4" />} label="Mọi người" />
            </div>
            {/* Desktop Student View */}
            <div className="hidden md:flex items-center gap-1 border-b border-border overflow-x-auto">
                <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard className="w-4 h-4" />} label="Tổng quan" />
                <TabButton active={activeTab === 'stream'} onClick={() => setActiveTab('stream')} icon={<MessageSquare className="w-4 h-4" />} label="Bảng tin" />
                <TabButton active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon={<Calendar className="w-4 h-4" />} label="Thời khóa biểu" />
                <TabButton active={activeTab === 'classwork'} onClick={() => setActiveTab('classwork')} icon={<BookOpen className="w-4 h-4" />} label="Bài tập" />
                <TabButton active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} icon={<FolderOpen className="w-4 h-4" />} label="Tài liệu" />
                <TabButton active={activeTab === 'people'} onClick={() => setActiveTab('people')} icon={<Users className="w-4 h-4" />} label="Mọi người" />
            </div>

            {/* Tab Content */}
            <div id="main-content" className="min-h-[400px] relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' && (
                        <motion.div
                            key="dashboard"
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={pageTransition}
                            className="w-full"
                        >
                            <StudentOverviewTab
                                classId={classId}
                                classData={classData}
                                currentUser={currentUser}
                                announcements={announcements}
                                assignments={assignments}
                                submissions={submissions}
                                students={students}
                            />
                        </motion.div>
                    )}



                    {activeTab === 'schedule' && (
                        <motion.div
                            key="schedule"
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={pageTransition}
                            className="w-full"
                        >
                            <ScheduleTabContent
                                classData={classData}
                                currentUser={currentUser}
                                onUpdateClass={(updated: any) => setClassData(prev => prev ? { ...prev, ...updated } : null)}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'stream' && (
                        <motion.div
                            key="stream"
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={pageTransition}
                            className="w-full"
                        >
                            {/* Student Stream Tab - 2 Column Layout with Inline Filter */}
                            <div className="flex gap-6">
                                {/* Main Feed */}
                                <div className="flex-1 min-w-0 space-y-4">
                                    {/* Compact Filter Bar - Student Version */}
                                    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 px-4 py-2.5 flex items-center gap-3 flex-wrap">
                                        {/* Search - Compact */}
                                        <div className="relative flex-1 min-w-[160px] max-w-[240px]">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Tìm kiếm..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-8 pr-3 py-1.5 bg-gray-50/80 border-0 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all"
                                            />
                                        </div>

                                        {/* Divider */}
                                        <div className="h-5 w-px bg-gray-200" />

                                        {/* Filter Pills - Compact */}
                                        <div className="flex items-center gap-1">
                                            {[
                                                { value: 'ALL', label: 'Tất cả', icon: null, activeColor: 'bg-blue-100 text-blue-700 ring-1 ring-blue-300' },
                                                { value: 'IMPORTANT', label: 'Quan trọng', icon: Bell, activeColor: 'bg-orange-100 text-orange-700 ring-1 ring-orange-300' },
                                                { value: 'URGENT', label: 'Khẩn cấp', icon: AlertTriangle, activeColor: 'bg-red-100 text-red-700 ring-1 ring-red-300' },
                                                { value: 'EVENT', label: 'Sự kiện', icon: Calendar, activeColor: 'bg-purple-100 text-purple-700 ring-1 ring-purple-300' },
                                            ].map((ft) => {
                                                const Icon = ft.icon;
                                                const isActive = filters.type === ft.value;
                                                return (
                                                    <button
                                                        key={ft.value}
                                                        onClick={() => setFilters({ ...filters, type: ft.value as any })}
                                                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${isActive
                                                            ? ft.activeColor
                                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        {Icon && <Icon className="w-3 h-3" />}
                                                        <span className="hidden sm:inline">{ft.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Sort - Minimal */}
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as any)}
                                            className="px-2 py-1 bg-transparent border-0 rounded-md text-xs font-medium text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 cursor-pointer hover:bg-gray-100 transition-all ml-auto"
                                        >
                                            <option value="newest">Mới nhất</option>
                                            <option value="mostEngaged">Nhiều ❤️</option>
                                            <option value="mostActive">Sôi nổi</option>
                                        </select>
                                    </div>

                                    {/* Announcements List */}
                                    <div className="space-y-4">
                                        {(() => {
                                            const displayedList = filteredAnnouncements.slice(0, displayCount);
                                            const hasMore = filteredAnnouncements.length > displayCount;

                                            if (filteredAnnouncements.length === 0) {
                                                return (
                                                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                                                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                            <span className="text-4xl">📢</span>
                                                        </div>
                                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có thông báo nào</h3>
                                                        <p className="text-gray-500 max-w-sm mx-auto">
                                                            Giáo viên chưa đăng thông báo nào. Quay lại sau để kiểm tra nhé!
                                                        </p>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <>
                                                    {displayedList.map((announcement) => (
                                                        <motion.div
                                                            key={announcement.id}
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                        >
                                                            <AnnouncementCard
                                                                announcement={announcement}
                                                                currentUserId={currentUser.id}
                                                                isTeacher={false}
                                                            />
                                                        </motion.div>
                                                    ))}

                                                    {hasMore && (
                                                        <button
                                                            onClick={() => setDisplayCount(prev => prev + 5)}
                                                            className="w-full py-3 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                                                        >
                                                            Xem thêm thông báo cũ hơn
                                                        </button>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Right Sidebar - Student Widgets (Compact Design) */}
                                <div className="w-[280px] flex-shrink-0 hidden lg:block">
                                    <div className="sticky top-24 space-y-4">
                                        {/* Student Progress Widget - Compact */}
                                        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 overflow-hidden">
                                            <div className="px-4 py-3 border-b border-gray-50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                                                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                                    📊 Tiến độ của tôi
                                                </h3>
                                            </div>
                                            <div className="p-3">
                                                {(() => {
                                                    const mySubmissions = submissions.filter(s => s.studentId === currentUser.id);
                                                    const submittedCount = mySubmissions.length;
                                                    const gradedCount = mySubmissions.filter(s => s.status === 'graded').length;
                                                    const pendingCount = assignments.filter(a =>
                                                        a.status === 'open' &&
                                                        !mySubmissions.some(s => s.assignmentId === a.id)
                                                    ).length;
                                                    const avgScore = mySubmissions.filter(s => s.score).length > 0
                                                        ? mySubmissions.filter(s => s.score).reduce((acc, s) => acc + (s.score || 0), 0) / mySubmissions.filter(s => s.score).length
                                                        : 0;
                                                    const totalAssignments = assignments.filter(a => a.status !== 'draft').length;
                                                    const completionRate = totalAssignments > 0 ? (submittedCount / totalAssignments) * 100 : 0;

                                                    return (
                                                        <div className="space-y-3">
                                                            {/* Progress Ring + Stats */}
                                                            <div className="flex items-center gap-3">
                                                                {/* Mini Progress Ring */}
                                                                <div className="relative w-14 h-14 flex-shrink-0">
                                                                    <svg className="w-14 h-14 transform -rotate-90">
                                                                        <circle cx="28" cy="28" r="24" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                                                                        <circle
                                                                            cx="28" cy="28" r="24"
                                                                            stroke="url(#progressGradient)"
                                                                            strokeWidth="4"
                                                                            fill="none"
                                                                            strokeLinecap="round"
                                                                            strokeDasharray={`${completionRate * 1.51} 151`}
                                                                        />
                                                                        <defs>
                                                                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                                                <stop offset="0%" stopColor="#3b82f6" />
                                                                                <stop offset="100%" stopColor="#8b5cf6" />
                                                                            </linearGradient>
                                                                        </defs>
                                                                    </svg>
                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                        <span className="text-xs font-bold text-gray-700">{Math.round(completionRate)}%</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-xs text-gray-500">Điểm trung bình</div>
                                                                    <div className="text-lg font-bold text-gray-900">
                                                                        {avgScore > 0 ? avgScore.toFixed(1) : '—'}
                                                                        <span className="text-xs font-normal text-gray-400 ml-1">/ 10</span>
                                                                    </div>
                                                                    <div className="text-[10px] text-gray-400">{gradedCount} bài đã chấm</div>
                                                                </div>
                                                            </div>

                                                            {/* Mini Stats Row */}
                                                            <div className="flex gap-2">
                                                                <div className="flex-1 text-center py-2 bg-green-50/80 rounded-lg">
                                                                    <div className="text-sm font-bold text-green-600">{submittedCount}</div>
                                                                    <div className="text-[9px] text-green-600/70 font-medium">Đã nộp</div>
                                                                </div>
                                                                <div className="flex-1 text-center py-2 bg-orange-50/80 rounded-lg">
                                                                    <div className="text-sm font-bold text-orange-600">{pendingCount}</div>
                                                                    <div className="text-[9px] text-orange-600/70 font-medium">Chưa làm</div>
                                                                </div>
                                                            </div>

                                                            {/* Warning Banner */}
                                                            {pendingCount > 0 && (
                                                                <Link
                                                                    href={`/dashboard/classes/${classId}?tab=classwork`}
                                                                    className="flex items-center gap-2 p-2 bg-amber-50 text-amber-700 rounded-lg text-[11px] font-medium hover:bg-amber-100 transition-colors"
                                                                >
                                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                                    {pendingCount} bài cần hoàn thành
                                                                    <ChevronRight className="w-3 h-3 ml-auto" />
                                                                </Link>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        {/* Upcoming Assignments Widget - Compact */}
                                        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 overflow-hidden">
                                            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                                    ⏰ Sắp đến hạn
                                                </h3>
                                                {(() => {
                                                    const count = assignments.filter(a => a.status === 'open' && new Date(a.dueDate) > new Date()).length;
                                                    return count > 0 && (
                                                        <span className="text-[10px] font-medium bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                                                            {count}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <div className="p-2">
                                                {(() => {
                                                    const upcomingAssignments = assignments
                                                        .filter(a => a.status === 'open' && new Date(a.dueDate) > new Date())
                                                        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                                                        .slice(0, 3);

                                                    if (upcomingAssignments.length === 0) {
                                                        return (
                                                            <div className="text-center py-4">
                                                                <div className="text-xl mb-1">🎉</div>
                                                                <p className="text-[11px] text-gray-400">Không có deadline sắp tới</p>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className="space-y-1">
                                                            {upcomingAssignments.map((assignment) => {
                                                                const dueDate = new Date(assignment.dueDate);
                                                                const now = new Date();
                                                                const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                                                const isUrgent = daysLeft <= 2;
                                                                const mySubmission = submissions.find(s => s.assignmentId === assignment.id && s.studentId === currentUser.id);

                                                                return (
                                                                    <Link
                                                                        key={assignment.id}
                                                                        href={`/dashboard/assignments/${assignment.id}`}
                                                                        className="flex items-center gap-2 p-2 rounded-lg transition-all hover:bg-gray-50 group"
                                                                    >
                                                                        {/* Status Icon */}
                                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${mySubmission ? 'bg-green-100' : isUrgent ? 'bg-red-100' : 'bg-blue-100'
                                                                            }`}>
                                                                            {mySubmission ? (
                                                                                <Check className="w-3 h-3 text-green-600" />
                                                                            ) : (
                                                                                <Clock className={`w-3 h-3 ${isUrgent ? 'text-red-600' : 'text-blue-600'}`} />
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-xs font-medium text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                                                                                {assignment.title}
                                                                            </p>
                                                                            <p className="text-[10px] text-gray-400">
                                                                                {daysLeft === 0 ? 'Hôm nay' : daysLeft === 1 ? 'Ngày mai' : `${daysLeft} ngày nữa`}
                                                                            </p>
                                                                        </div>
                                                                        <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                                                                    </Link>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        {/* Pinned Posts Widget - Compact */}
                                        {announcements.filter(a => a.isPinned).length > 0 && (
                                            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-amber-100/50 overflow-hidden">
                                                <div className="px-4 py-3 border-b border-amber-50 bg-amber-50/30">
                                                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                                        📌 Quan trọng
                                                    </h3>
                                                </div>
                                                <div className="p-2">
                                                    {announcements.filter(a => a.isPinned).slice(0, 2).map((post) => (
                                                        <div
                                                            key={post.id}
                                                            className="p-2 rounded-lg hover:bg-amber-50/50 cursor-pointer transition-colors"
                                                        >
                                                            <p className="text-xs text-gray-700 font-medium line-clamp-2">
                                                                {post.title || post.content}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400 mt-1">
                                                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: vi })}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}


                    {activeTab === 'classwork' && (
                        <motion.div
                            key="classwork"
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={pageTransition}
                            className="w-full"
                        >
                            <ClassworkTabContent
                                assignments={assignments}
                                submissions={submissions}
                                students={students}
                                user={currentUser}
                                filter={classworkFilter}
                                setFilter={setClassworkFilter}
                                searchQuery={classworkSearch}
                                setSearchQuery={setClassworkSearch}
                            />
                        </motion.div>
                    )
                    }

                    {
                        activeTab === 'resources' && (
                            <motion.div
                                key="resources"
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                variants={pageTransition}
                                className="w-full"
                            >
                                <ResourcesTabContent classId={classId} currentUser={currentUser} />
                            </motion.div>
                        )
                    }

                    {
                        activeTab === 'people' && (
                            <motion.div
                                key="people"
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                variants={pageTransition}
                                className="w-full"
                            >
                                <PeopleTabContent
                                    students={students}
                                    teacherName={teacherName || currentUser.name}
                                    currentUser={currentUser}
                                    classId={classId}
                                    onRemoveStudent={() => { }} // Students can't remove
                                    onApproveStudent={() => { }} // Students can't approve
                                    onRejectStudent={() => { }} // Students can't reject
                                    onInvite={() => { }} // Students can't invite
                                    onImportCSV={() => { }} // Students can't import
                                />
                            </motion.div>
                        )
                    }

                </AnimatePresence >
            </div >
        </div >
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/20'
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

function FilterButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon?: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

function ClassworkTabContent({
    assignments,
    submissions,
    students,
    user,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    onCreate
}: {
    assignments: Assignment[],
    submissions: Submission[],
    students: any[],
    user: User,
    filter: 'all' | 'open' | 'submitted' | 'graded' | 'draft',
    setFilter: (f: 'all' | 'open' | 'submitted' | 'graded' | 'draft') => void,
    searchQuery: string,
    setSearchQuery: (s: string) => void,
    onCreate?: () => void
}) {
    const filteredAssignments = assignments.filter(assignment => {
        if (searchQuery && !assignment.title.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }

        if (user.role === 'teacher') return true;

        const submission = submissions.find(s => s.assignmentId === assignment.id);
        const status = submission ? submission.status : 'open';

        if (filter === 'all') return true;
        if (filter === 'open') return status === 'open' || !submission;
        if (filter === 'submitted') return status === 'submitted';
        if (filter === 'graded') return status === 'graded';
        if (filter === 'draft') return assignment.status === 'draft';
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Header / Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="bg-white/80 backdrop-blur-sm p-1.5 rounded-xl border border-gray-200/60 shadow-sm flex items-center gap-1 overflow-x-auto max-w-full no-scrollbar">
                    <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="Tất cả" />
                    <FilterButton active={filter === 'open'} onClick={() => setFilter('open')} label="Đang mở" icon={<Clock className="w-3.5 h-3.5" />} />
                    <FilterButton active={filter === 'submitted'} onClick={() => setFilter('submitted')} label="Đã nộp" icon={<CheckCircle className="w-3.5 h-3.5" />} />
                    <FilterButton active={filter === 'graded'} onClick={() => setFilter('graded')} label="Đã chấm" icon={<BookOpen className="w-3.5 h-3.5" />} />
                    {user.role === 'teacher' && (
                        <FilterButton active={filter === 'draft'} onClick={() => setFilter('draft')} label="Bản nháp" icon={<FileEdit className="w-3.5 h-3.5" />} />
                    )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm bài tập..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm"
                        />
                    </div>
                    {user.role === 'teacher' && onCreate && (
                        <button
                            onClick={onCreate}
                            className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 shadow-md whitespace-nowrap active:scale-95"
                        >
                            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Tạo bài tập</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Assignments Grid */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                    {filteredAssignments.map((assignment) => {
                        const submission = submissions.find(s => s.assignmentId === assignment.id);
                        const isSubmitted = submission?.status === 'submitted';
                        const isGraded = submission?.status === 'graded';
                        const submissionCount = submissions.filter(s => s.assignmentId === assignment.id).length;
                        const submissionRate = students.length > 0 ? (submissionCount / students.length) * 100 : 0;

                        // Urgency Logic
                        const dueDate = new Date(assignment.dueDate);
                        const now = new Date();
                        const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        const isLate = now > dueDate;
                        const isUrgent = daysLeft >= 0 && daysLeft <= 2;

                        return (
                            <motion.div
                                key={assignment.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Link href={user.role === 'teacher' ? `/dashboard/assignments/${assignment.id}/submissions` : `/dashboard/assignments/${assignment.id}`}>
                                    <div className="group h-full bg-white border border-gray-200/60 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:border-blue-200/80 transition-all flex flex-col cursor-pointer relative overflow-hidden">
                                        {/* Hover Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/30 group-hover:to-indigo-50/30 transition-all duration-500" />

                                        <div className="relative flex justify-between items-start mb-4">
                                            {/* Icon with Gradient */}
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform duration-300">
                                                <BookOpen className="w-6 h-6" />
                                            </div>

                                            {/* Status Badge */}
                                            <div className="flex gap-1">
                                                {user.role === 'teacher' && (
                                                    <>
                                                        {assignment.status === 'draft' && <span className="bg-gray-100 text-gray-600 text-[11px] px-2.5 py-1 rounded-full font-semibold border border-gray-200 uppercase tracking-wide">Nháp</span>}
                                                        {assignment.status === 'open' && <span className="bg-emerald-100 text-emerald-700 text-[11px] px-2.5 py-1 rounded-full font-semibold border border-emerald-200 uppercase tracking-wide flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Đang mở</span>}
                                                        {assignment.status === 'closed' && <span className="bg-rose-100 text-rose-700 text-[11px] px-2.5 py-1 rounded-full font-semibold border border-rose-200 uppercase tracking-wide">Đã đóng</span>}
                                                    </>
                                                )}
                                                {user.role === 'student' && (
                                                    <>
                                                        {isGraded && <span className="bg-emerald-100 text-emerald-700 text-[11px] px-2.5 py-1 rounded-full font-semibold border border-emerald-200 uppercase tracking-wide">Đã chấm</span>}
                                                        {isSubmitted && !isGraded && <span className="bg-amber-100 text-amber-700 text-[11px] px-2.5 py-1 rounded-full font-semibold border border-amber-200 uppercase tracking-wide">Đã nộp</span>}
                                                        {!isSubmitted && !isGraded && isLate && <span className="bg-red-100 text-red-700 text-[11px] px-2.5 py-1 rounded-full font-semibold border border-red-200 uppercase tracking-wide">Quá hạn</span>}
                                                        {!isSubmitted && !isGraded && !isLate && <span className="bg-gray-100 text-gray-600 text-[11px] px-2.5 py-1 rounded-full font-semibold border border-gray-200 uppercase tracking-wide">Chưa làm</span>}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="relative flex-1 mb-4">
                                            <h3 className="font-bold text-lg text-gray-800 mb-1.5 group-hover:text-blue-600 transition-colors line-clamp-1">{assignment.title}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{assignment.description || "Không có mô tả"}</p>
                                        </div>

                                        <div className="relative pt-4 border-t border-gray-100 mt-auto">
                                            {/* Due Date */}
                                            <div className="flex items-center justify-between text-xs mb-3">
                                                <span className={`flex items-center gap-1.5 font-medium ${isUrgent || isLate ? 'text-red-600' : 'text-gray-500'}`}>
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {isLate ? `Đã quá hạn ${formatDistanceToNow(dueDate, { locale: vi })}` :
                                                        isUrgent ? `Hết hạn ${formatDistanceToNow(dueDate, { addSuffix: true, locale: vi })}` :
                                                            new Date(assignment.dueDate).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' })}
                                                </span>

                                                {/* Student: Points or specific status text */}
                                                {user.role === 'student' && assignment.maxScore && (
                                                    <span className="font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                                        {assignment.maxScore} điểm
                                                    </span>
                                                )}
                                            </div>

                                            {/* Teacher: Progress Bar */}
                                            {user.role === 'teacher' && (
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-[11px] font-medium text-gray-500">
                                                        <span>Tiến độ nộp bài</span>
                                                        <span className="text-blue-600">{submissionCount}/{students.length}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                                                            style={{ width: `${submissionRate}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {filteredAssignments.length === 0 && (
                    <div className="col-span-full">
                        {assignments.length === 0 ? (
                            <NoAssignmentsEmpty onCreate={onCreate || (() => { })} />
                        ) : (
                            <NoSearchResults />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
