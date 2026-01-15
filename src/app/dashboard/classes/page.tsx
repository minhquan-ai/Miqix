"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, GraduationCap, BookOpen, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getClassesAction, togglePinClassAction, joinClassAction } from "@/lib/actions";
import { getCurrentUserAction } from "@/lib/actions";
import { User } from "@/types";
import { ClassCardTeacher } from "@/components/classes/ClassCardTeacher";
import { ClassCardStudent } from "@/components/classes/ClassCardStudent";
import { ClassesFilterBar } from "@/components/classes/ClassesFilterBar";
import { JoinClassWidget } from "@/components/classes/JoinClassWidget";
import { ElegantSelect } from "@/components/ui/ElegantSelect";

import { ClassCreatorModal } from '@/components/features/ClassCreatorModal';

export default function ClassesPage() {
    const router = useRouter();
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [classStats] = useState<Record<string, any>>({});
    const [studentSearch, setStudentSearch] = useState("");

    // State for modal
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    useEffect(() => {
        async function loadData() {
            try {
                const currentUser = await getCurrentUserAction();
                if (!currentUser) {
                    router.push("/login");
                    return;
                }
                setUser(currentUser);

                if (currentUser.role === "teacher") {
                    const classList = await getClassesAction();
                    setClasses(classList);
                } else {
                    const studentClasses = await getClassesAction();
                    setClasses(studentClasses);
                }
            } catch (_error) {
                console.error("Failed to load classes", _error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [router]);

    // Filter logic
    const filteredClasses = useMemo(() => {
        const query = user?.role === "teacher" ? searchQuery : studentSearch;
        return classes.filter((cls) => {
            const matchesSearch = cls.name.toLowerCase().includes(query.toLowerCase()) ||
                cls.subject.toLowerCase().includes(query.toLowerCase());
            const matchesSubject = !selectedSubject || cls.subject === selectedSubject;
            const matchesType = !selectedType || cls.role === selectedType;
            return matchesSearch && matchesSubject && matchesType;
        });
    }, [classes, searchQuery, studentSearch, selectedSubject, selectedType, user]);

    // Sort logic
    const sortedClasses = useMemo(() => {
        return [...filteredClasses].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return 0;
        });
    }, [filteredClasses]);



    const handleJoinClass = async (code: string) => {
        const result = await joinClassAction({ classCode: code });
        if (result.success) {
            const studentClasses = await getClassesAction();
            setClasses(studentClasses);
        } else {
            throw new Error(result.message || "Lỗi khi tham gia lớp");
        }
    };

    const handlePinClass = async (classId: string) => {
        await togglePinClassAction(classId);
        const classList = await getClassesAction();
        setClasses(classList);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;
    const isTeacher = user.role === "teacher";

    // ============ STUDENT VIEW ============
    if (!isTeacher) {
        return (
            <div className="page-container">
                <div className="page-content space-y-6 pb-20">
                    {/* Hero Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20 shrink-0"
                    >
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl" />

                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <span className="text-sm font-medium text-white/80">Danh sách lớp học</span>
                                </div>
                                <h1 className="text-3xl font-bold mb-2">Lớp học của tôi</h1>
                                <p className="text-white/80 text-sm max-w-md">
                                    Tiếp tục hành trình học tập và chinh phục những thử thách mới
                                </p>
                            </div>

                            {/* Stats Badges */}
                            <div className="hidden md:flex flex-col gap-2">
                                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                                    <GraduationCap className="w-4 h-4 text-white" />
                                    <span className="font-bold">{classes.length} Lớp học</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Search & Filters Row */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="flex flex-col md:flex-row items-center gap-4 shrink-0"
                    >
                        <div className="flex-1 w-full">
                            <ClassesFilterBar
                                searchQuery={studentSearch}
                                onSearchChange={setStudentSearch}
                                selectedSubject={selectedSubject}
                                onSubjectChange={setSelectedSubject}
                                selectedType={selectedType}
                                onTypeChange={setSelectedType}
                                viewMode={viewMode}
                                onViewModeChange={setViewMode}
                            />
                        </div>
                        <div className="shrink-0 w-full md:w-auto">
                            <JoinClassWidget onJoin={handleJoinClass} />
                        </div>
                    </motion.div>

                    {/* Classes Grid */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        {sortedClasses.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                <AnimatePresence mode="popLayout">
                                    {sortedClasses.map((cls, index) => (
                                        <motion.div
                                            key={cls.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <ClassCardStudent
                                                classData={cls}
                                                progress={{
                                                    unreadCount: 0
                                                }}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="py-20 flex flex-col items-center text-center"
                            >
                                <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                    <GraduationCap className="w-12 h-12 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {studentSearch ? "Không tìm thấy lớp học" : "Chưa có lớp học nào"}
                                </h3>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    {studentSearch
                                        ? "Thử tìm kiếm với từ khóa khác"
                                        : "Hãy nhập mã lớp từ giáo viên để tham gia lớp học đầu tiên của bạn!"}
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </div>
        );
    }

    // ============ TEACHER VIEW ============
    return (
        <div className="page-container">
            <div className="page-content space-y-6 pb-20">
                {/* Hero Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 rounded-3xl p-8 text-white shadow-xl shadow-teal-500/20 shrink-0"
                >
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl" />

                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <GraduationCap className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-medium text-white/80">Danh sách lớp học</span>
                            </div>
                            <h1 className="text-3xl font-bold mb-2">Quản lý lớp học</h1>
                            <p className="text-white/80 text-sm max-w-md">
                                Quản lý hiệu quả, theo dõi sát sao và nâng cao chất lượng giảng dạy
                            </p>
                        </div>

                        {/* Action Custom Button */}
                        <div className="hidden md:block">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowCreateModal(true)}
                                className="bg-white text-teal-700 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Tạo lớp mới
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Filter & Controls */}
                {/* Filter & Controls */}
                {/* Filter & Controls */}
                <ClassesFilterBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    selectedSubject={selectedSubject}
                    onSubjectChange={setSelectedSubject}
                    selectedType={selectedType}
                    onTypeChange={setSelectedType}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />

                {/* Main Content Grid */}
                <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
                    {/* Class Cards */}
                    <AnimatePresence mode="popLayout">
                        {sortedClasses.map((cls, index) => (
                            <motion.div
                                key={cls.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.05 }}
                                className="h-full"
                            >
                                <ClassCardTeacher
                                    classData={cls}
                                    stats={classStats[cls.id]}
                                    isPinned={cls.isPinned}
                                    onPin={handlePinClass}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Empty State */}
                    {sortedClasses.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="col-span-full py-20 flex flex-col items-center text-center px-4"
                        >
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <GraduationCap className="w-12 h-12 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa tìm thấy lớp học nào</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-8">
                                Bạn chưa có lớp học nào hoặc không tìm thấy kết quả phù hợp.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowCreateModal(true)}
                                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                            >
                                Tạo lớp học đầu tiên
                            </motion.button>
                        </motion.div>
                    )}
                </div>

                <ClassCreatorModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={async () => {
                        setShowCreateModal(false);
                        // Reload classes
                        const classList = await getClassesAction();
                        setClasses(classList);
                    }}
                />
            </div>
        </div>
    );
}
