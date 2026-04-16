"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Download, ArrowLeft, CheckCircle, XCircle, Clock, User as UserIcon, Loader2 } from "lucide-react";
import { getClassSessionsAction, getClassByIdAction } from "@/lib/actions";
import { getClassMembersAction } from "@/lib/actions/class-member-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/Skeleton";

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.03
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
};

type Student = {
    id: string;
    name: string;
    avatarUrl?: string;
    email: string;
};

type DailyStatus = {
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    note?: string;
};

type AttendanceGrid = {
    [studentId: string]: {
        [dateStr: string]: DailyStatus;
    };
};

export default function AttendanceReportPage() {
    const params = useParams();
    const classId = params.id as string;
    const router = useRouter();

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [students, setStudents] = useState<Student[]>([]);
    const [attendanceData, setAttendanceData] = useState<AttendanceGrid>({});
    const [loading, setLoading] = useState(true);
    const [className, setClassName] = useState("");

    const loadData = useCallback(async () => {
        setLoading(true);
        try {

            // 1. Get Class Info & Students
            const members = await getClassMembersAction(classId);
            const studentList = members
                .filter((m: any) => m.role === 'student')
                .map((m: any) => ({
                    id: m.id,
                    name: m.name,
                    avatarUrl: m.avatarUrl,
                    email: m.email
                })).sort((a: any, b: any) => a.name.localeCompare(b.name));
            setStudents(studentList);

            const cls = await getClassByIdAction(classId);
            if (cls) setClassName(cls.name);

            // 2. Get Sessions for the month
            const start = startOfMonth(currentMonth);
            const end = endOfMonth(currentMonth);
            const sessions = await getClassSessionsAction(classId, start, end);

            // 3. Build Grid Data
            const grid: AttendanceGrid = {};

            // Initialize grid
            studentList.forEach((s: any) => {
                grid[s.id] = {};
            });

            sessions.forEach((session: any) => {
                const dateStr = format(new Date(session.date), 'yyyy-MM-dd');
                session.attendanceRecords.forEach((record: any) => {
                    if (grid[record.studentId]) {
                        grid[record.studentId][dateStr] = {
                            status: record.status,
                            note: record.note
                        };
                    }
                });
            });

            setAttendanceData(grid);

        } catch (error) {
            console.error("Load report error:", error);
        } finally {
            setLoading(false);
        }
    }, [classId, currentMonth]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    });

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'PRESENT': return <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-green-600" /></div>;
            case 'ABSENT': return <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center"><XCircle className="w-4 h-4 text-red-600" /></div>;
            case 'LATE': return <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center"><Clock className="w-4 h-4 text-orange-600" /></div>;
            case 'EXCUSED': return <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center"><UserIcon className="w-4 h-4 text-blue-600" /></div>;
            default: return <div className="w-1 h-1 rounded-full bg-gray-200"></div>;
        }
    };

    const calculateStudentStats = (studentId: string) => {
        const records = Object.values(attendanceData[studentId] || {});
        const total = records.length;
        if (total === 0) return { rate: 0, present: 0, absent: 0 };

        const present = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
        const absent = records.filter(r => r.status === 'ABSENT').length;

        // Note: This calculates based on RECORDED sessions only. 
        // If a student has no record for a session, it's ignored here, 
        // but ideally we should know total sessions. 
        // For simplicity, we assume if a session exists, all students have records (which is how our system works).

        return {
            rate: Math.round((present / total) * 100),
            present,
            absent
        };
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50/50">
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/classes/${classId}/attendance`)} className="-ml-2">
                            <ArrowLeft className="w-5 h-5 text-gray-500" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Báo cáo điểm danh</h1>
                            <p className="text-sm text-gray-500">{className}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm p-1">
                            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="h-8 w-8">
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="px-4 text-sm font-semibold min-w-[140px] text-center">
                                {format(currentMonth, "MMMM, yyyy", { locale: vi })}
                            </span>
                            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="h-8 w-8">
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>

                        <Button variant="outline" size="sm" className="hidden sm:flex">
                            <Download className="w-4 h-4 mr-2" />
                            Xuất Excel
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {loading ? (
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="sticky left-0 z-10 bg-gray-50/95 border-b border-r border-gray-200 p-4 min-w-[250px]">
                                                <Skeleton className="h-4 w-20" />
                                            </th>
                                            <th className="sticky left-[250px] z-10 bg-gray-50/95 border-b border-r border-gray-200 p-4 min-w-[100px]">
                                                <Skeleton className="h-4 w-16 mx-auto" />
                                            </th>
                                            {[...Array(10)].map((_, i) => (
                                                <th key={i} className="p-2 border-b border-gray-100 min-w-[50px]">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Skeleton className="h-3 w-6" />
                                                        <Skeleton className="h-4 w-4" />
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...Array(8)].map((_, i) => (
                                            <tr key={i}>
                                                <td className="sticky left-0 z-10 bg-white border-r border-gray-100 p-3">
                                                    <div className="flex items-center gap-3">
                                                        <Skeleton className="h-8 w-8 rounded-full" />
                                                        <div className="space-y-1">
                                                            <Skeleton className="h-3 w-24" />
                                                            <Skeleton className="h-2 w-32" />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="sticky left-[250px] z-10 bg-white border-r border-gray-100 p-3">
                                                    <Skeleton className="h-5 w-8 mx-auto" />
                                                </td>
                                                {[...Array(10)].map((_, j) => (
                                                    <td key={j} className="p-2 border-r border-gray-50">
                                                        <Skeleton className="h-6 w-6 rounded-full mx-auto" />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="sticky left-0 z-10 bg-gray-50/95 backdrop-blur border-b border-r border-gray-200 p-4 text-left min-w-[250px]">
                                                <span className="text-xs font-semibold text-gray-500 uppercase">Học sinh</span>
                                            </th>
                                            <th className="sticky left-[250px] z-10 bg-gray-50/95 backdrop-blur border-b border-r border-gray-200 p-4 text-center min-w-[100px]">
                                                <span className="text-xs font-semibold text-gray-500 uppercase">Chuyên cần</span>
                                            </th>
                                            {daysInMonth.map(day => (
                                                <th key={day.toString()} className={`p-2 border-b border-gray-100 min-w-[50px] text-center ${isSameDay(day, new Date()) ? 'bg-blue-50' : ''}`}>
                                                    <div className="text-[10px] text-gray-400 uppercase">{format(day, "EEE", { locale: vi })}</div>
                                                    <div className={`text-sm font-medium ${isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-700'}`}>
                                                        {format(day, "dd")}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <motion.tbody
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="show"
                                        key={currentMonth.toISOString()} // Re-animate on month change
                                    >
                                        {students.map((student) => {
                                            const stats = calculateStudentStats(student.id);
                                            return (
                                                <motion.tr
                                                    variants={itemVariants}
                                                    key={student.id}
                                                    className="hover:bg-gray-50/50 transition-colors"
                                                >
                                                    <td className="sticky left-0 z-10 bg-white border-r border-gray-100 p-3">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={student.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`}
                                                                className="w-8 h-8 rounded-full bg-gray-100"
                                                                alt=""
                                                            />
                                                            <div className="truncate max-w-[180px]">
                                                                <div className="text-sm font-medium text-gray-900 truncate">{student.name}</div>
                                                                <div className="text-xs text-gray-500 truncate">{student.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="sticky left-[250px] z-10 bg-white border-r border-gray-100 p-3 text-center">
                                                        <div className={`text-sm font-bold ${stats.rate >= 90 ? 'text-green-600' :
                                                            stats.rate >= 70 ? 'text-orange-500' : 'text-red-600'
                                                            }`}>
                                                            {stats.rate}%
                                                        </div>
                                                    </td>
                                                    {daysInMonth.map(day => {
                                                        const dateStr = format(day, 'yyyy-MM-dd');
                                                        const record = attendanceData[student.id]?.[dateStr];
                                                        return (
                                                            <td key={day.toString()} className={`p-2 text-center border-r border-gray-50 ${isSameDay(day, new Date()) ? 'bg-blue-50/30' : ''}`}>
                                                                <div className="flex justify-center">
                                                                    {record ? (
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger>
                                                                                    {getStatusIcon(record.status)}
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    <p>{record.status}</p>
                                                                                    {record.note && <p className="text-xs text-gray-400">{record.note}</p>}
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    ) : (
                                                                        <div className="w-1 h-1 rounded-full bg-gray-100"></div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </motion.tr>
                                            );
                                        })}
                                    </motion.tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
