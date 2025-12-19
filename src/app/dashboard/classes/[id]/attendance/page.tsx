"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarIcon, Save, CheckCircle, XCircle, Clock, User, ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { DataService } from "@/lib/data";
import { getAttendanceSessionAction, saveAttendanceAction } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/Skeleton";

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

type Student = {
    id: string;
    name: string;
    avatarUrl?: string;
    email: string;
};

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

type AttendanceState = {
    [studentId: string]: {
        status: AttendanceStatus;
        note: string;
    };
};

export default function AttendancePage() {
    const params = useParams();
    const classId = params.id as string;
    const router = useRouter();
    const { showToast } = useToast();

    const [date, setDate] = useState<Date>(new Date());
    const [period, setPeriod] = useState(1);
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<AttendanceState>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [className, setClassName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Load students and existing attendance
    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // 1. Get Class Info & Students
                const enrollments = await DataService.getClassMembers(classId);
                const studentList = enrollments.map((e: any) => ({
                    id: e.userId,
                    name: e.user.name,
                    avatarUrl: e.user.avatarUrl,
                    email: e.user.email
                }));
                setStudents(studentList);

                // Get class name
                const cls = await DataService.getClassById(classId);
                if (cls) setClassName(cls.name);

                // 2. Get existing attendance
                const session = await getAttendanceSessionAction(classId, date, period);
                const newAttendance: AttendanceState = {};

                // Initialize defaults
                studentList.forEach((s: Student) => {
                    newAttendance[s.id] = { status: 'PRESENT', note: '' };
                });

                // Override with saved data
                if (session && session.attendanceRecords) {
                    session.attendanceRecords.forEach((r: any) => {
                        if (newAttendance[r.studentId]) {
                            newAttendance[r.studentId] = {
                                status: r.status as AttendanceStatus,
                                note: r.note || ''
                            };
                        }
                    });
                }

                setAttendance(newAttendance);

            } catch (error) {
                console.error("Load attendance error:", error);
                showToast("Không thể tải danh sách học sinh", "error");
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [classId, date, period]);

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], status }
        }));
    };

    const handleNoteChange = (studentId: string, note: string) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], note }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const records = Object.entries(attendance).map(([studentId, data]) => ({
                studentId,
                status: data.status,
                note: data.note
            }));

            const result = await saveAttendanceAction(classId, date, period, records);

            if (result.success) {
                showToast("Đã lưu điểm danh thành công", "success");
            } else {
                showToast(result.message, "error");
            }
        } catch (error) {
            showToast("Có lỗi xảy ra khi lưu", "error");
        } finally {
            setSaving(false);
        }
    };

    const markAll = (status: AttendanceStatus) => {
        setAttendance(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(id => {
                next[id].status = status;
            });
            return next;
        });
    };

    const stats = {
        present: Object.values(attendance).filter(a => a.status === 'PRESENT').length,
        absent: Object.values(attendance).filter(a => a.status === 'ABSENT').length,
        late: Object.values(attendance).filter(a => a.status === 'LATE').length,
        excused: Object.values(attendance).filter(a => a.status === 'EXCUSED').length,
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const StatusButton = ({ status, current, onClick, icon: Icon, label, colorClass, bgClass }: any) => (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`relative group flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 border ${current === status
                ? `${colorClass} ${bgClass} border-current font-medium shadow-sm`
                : 'text-gray-400 border-transparent hover:bg-gray-50 hover:text-gray-600'
                }`}
            title={label}
        >
            <Icon className={`w-4 h-4 ${current === status ? 'scale-110' : ''}`} />
            <span className={`text-xs uppercase tracking-wider ${current === status ? 'inline-block' : 'hidden xl:inline-block'}`}>{label}</span>
        </motion.button>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50/50">
            {/* Top Bar: Breadcrumbs & Stats */}
            <div className="px-6 py-3 bg-white border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/classes/${classId}`)} className="-ml-2">
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            Sổ điểm danh
                            <span className="text-gray-300 font-light">|</span>
                            <span className="text-base font-normal text-gray-600">{className}</span>
                        </h1>
                    </div>
                </div>

                {/* Compact Stats */}
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
                        <CheckCircle className="w-4 h-4" />
                        <span>{stats.present} Có mặt</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-600 font-medium bg-red-50 px-3 py-1 rounded-full">
                        <XCircle className="w-4 h-4" />
                        <span>{stats.absent} Vắng</span>
                    </div>
                    <div className="flex items-center gap-2 text-orange-600 font-medium bg-orange-50 px-3 py-1 rounded-full">
                        <Clock className="w-4 h-4" />
                        <span>{stats.late} Trễ</span>
                    </div>
                </div>
            </div>

            {/* Toolbar: Date, Search, Actions */}
            <div className="px-6 py-4 flex flex-col lg:flex-row items-center gap-4 justify-between bg-white/50 backdrop-blur-sm sticky top-[60px] z-10 border-b border-gray-200/50">
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    {/* Date Navigator */}
                    <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm p-1">
                        <Button variant="ghost" size="icon" onClick={() => {
                            const prev = new Date(date);
                            prev.setDate(prev.getDate() - 1);
                            setDate(prev);
                        }} className="h-8 w-8 rounded-md hover:bg-gray-100">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>

                        <div className="relative group px-4 py-1 cursor-pointer hover:bg-gray-50 rounded-md transition-colors">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <CalendarIcon className="w-4 h-4 text-gray-500" />
                                {format(date, "EEEE, dd/MM/yyyy", { locale: vi })}
                            </div>
                            <input
                                type="date"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                value={format(date, "yyyy-MM-dd")}
                                onChange={(e) => e.target.value && setDate(new Date(e.target.value))}
                            />
                        </div>

                        <Button variant="ghost" size="icon" onClick={() => {
                            const next = new Date(date);
                            next.setDate(next.getDate() + 1);
                            setDate(next);
                        }} className="h-8 w-8 rounded-md hover:bg-gray-100">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 lg:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm học sinh..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/classes/${classId}/attendance/report`)} className="text-gray-600 border-gray-200 hover:bg-gray-50">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Báo cáo tháng
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => markAll('PRESENT')} className="text-green-700 border-green-200 hover:bg-green-50">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Tất cả có mặt
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                    >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Lưu thay đổi
                    </Button>
                </div>
            </div>

            {/* Main Content: Full Width Table */}
            <div className="flex-1 overflow-auto px-6 py-4">
                {loading ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between gap-4 p-2">
                                    <div className="flex items-center gap-3 w-[30%]">
                                        <Skeleton className="h-9 w-9 rounded-full" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-[120px]" />
                                            <Skeleton className="h-3 w-[150px]" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 w-[40%]">
                                        {[...Array(4)].map((_, j) => (
                                            <Skeleton key={j} className="h-9 w-24 rounded-lg" />
                                        ))}
                                    </div>
                                    <div className="w-[30%]">
                                        <Skeleton className="h-8 w-full rounded-md" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <div className="bg-white p-8 rounded-full shadow-sm mb-4">
                            <User className="w-12 h-12 text-gray-300" />
                        </div>
                        <p className="text-lg font-medium">Không tìm thấy học sinh</p>
                        <p className="text-sm text-gray-400">Thử tìm kiếm với từ khóa khác</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50/80 backdrop-blur border-b border-gray-200 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[30%]">Học sinh</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[40%]">Trạng thái</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[30%]">Ghi chú</th>
                                </tr>
                            </thead>
                            <motion.tbody
                                variants={containerVariants}
                                initial="hidden"
                                animate="show"
                                className="divide-y divide-gray-100"
                            >
                                {filteredStudents.map((student) => {
                                    const status = attendance[student.id]?.status || 'PRESENT';
                                    return (
                                        <motion.tr
                                            variants={itemVariants}
                                            key={student.id}
                                            className="hover:bg-blue-50/10 transition-colors group"
                                        >
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        className="h-9 w-9 rounded-full object-cover border border-gray-200"
                                                        src={student.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`}
                                                        alt=""
                                                    />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                                        <div className="text-xs text-gray-500">{student.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <StatusButton
                                                        status="PRESENT"
                                                        current={status}
                                                        onClick={() => handleStatusChange(student.id, 'PRESENT')}
                                                        icon={CheckCircle}
                                                        label="Có mặt"
                                                        colorClass="text-green-600"
                                                        bgClass="bg-green-50"
                                                    />
                                                    <StatusButton
                                                        status="ABSENT"
                                                        current={status}
                                                        onClick={() => handleStatusChange(student.id, 'ABSENT')}
                                                        icon={XCircle}
                                                        label="Vắng"
                                                        colorClass="text-red-600"
                                                        bgClass="bg-red-50"
                                                    />
                                                    <StatusButton
                                                        status="LATE"
                                                        current={status}
                                                        onClick={() => handleStatusChange(student.id, 'LATE')}
                                                        icon={Clock}
                                                        label="Trễ"
                                                        colorClass="text-orange-600"
                                                        bgClass="bg-orange-50"
                                                    />
                                                    <StatusButton
                                                        status="EXCUSED"
                                                        current={status}
                                                        onClick={() => handleStatusChange(student.id, 'EXCUSED')}
                                                        icon={User}
                                                        label="Phép"
                                                        colorClass="text-blue-600"
                                                        bgClass="bg-blue-50"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <input
                                                    type="text"
                                                    value={attendance[student.id]?.note || ''}
                                                    onChange={(e) => handleNoteChange(student.id, e.target.value)}
                                                    placeholder="Thêm ghi chú..."
                                                    className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none text-sm py-1 transition-all placeholder:text-gray-300"
                                                />
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </motion.tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
