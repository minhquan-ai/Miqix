"use client";

import React, { useState, useEffect } from 'react';
import {
    CheckCircle2, XCircle, Clock, AlertCircle,
    Calendar as CalendarIcon, Save, Plus, ChevronRight,
    Users, BookOpen, Info, Loader2, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    createClassSessionAction,
    updateAttendanceAction,
    getClassSessionsAction
} from '@/lib/actions/attendance-actions';
import { useToast } from '../ui/Toast';
import { cn } from '@/lib/utils';

interface AttendanceManagerProps {
    classId: string;
    students: any[];
}

export default function AttendanceManager({ classId, students }: AttendanceManagerProps) {
    const { showToast } = useToast();
    const [sessions, setSessions] = useState<any[]>([]);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCreatingSession, setIsCreatingSession] = useState(false);

    const loadSessions = async () => {
        setIsLoading(true);
        const data = await getClassSessionsAction(classId);
        setSessions(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadSessions();
    }, [classId]);

    const handleCreateSession = async () => {
        setIsCreatingSession(true);
        const result = await createClassSessionAction({
            classId,
            date: new Date(),
            period: 1, // Default to period 1 for now
        });

        if (result.success) {
            showToast("Đã tạo buổi học mới", "success");
            loadSessions();
            setActiveSession(result.session);
            // Default everyone to present
            const initialData: Record<string, string> = {};
            students.forEach(s => initialData[s.userId] = 'PRESENT');
            setAttendanceData(initialData);
        } else {
            showToast("Lỗi khi tạo buổi học", "error");
        }
        setIsCreatingSession(false);
    };

    const handleSelectSession = (session: any) => {
        setActiveSession(session);
        const initialData: Record<string, string> = {};
        session.attendanceRecords.forEach((r: any) => {
            initialData[r.studentId] = r.status;
        });
        setAttendanceData(initialData);
    };

    const toggleStatus = (studentId: string, status: string) => {
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleSave = async () => {
        if (!activeSession) return;
        setIsSaving(true);

        const records = Object.entries(attendanceData).map(([studentId, status]) => ({
            sessionId: activeSession.id,
            studentId,
            status
        }));

        const result = await updateAttendanceAction(records);
        if (result.success) {
            showToast("Đã lưu điểm danh", "success");
            loadSessions();
        } else {
            showToast("Lỗi khi lưu điểm danh", "error");
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Đang tải dữ liệu điểm danh...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {!activeSession ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Quản lý điểm danh</h2>
                        <button
                            onClick={handleCreateSession}
                            disabled={isCreatingSession}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                            {isCreatingSession ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Plus className="w-4 h-4" />
                            )}
                            Điểm danh hôm nay
                        </button>
                    </div>

                    {sessions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sessions.map((session) => (
                                <button
                                    key={session.id}
                                    onClick={() => handleSelectSession(session)}
                                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left group"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <CalendarIcon className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            Tiết {session.period}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-1">
                                        {format(new Date(session.date), 'dd MMMM, yyyy', { locale: vi })}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-4 text-xs font-medium text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3.5 h-3.5" />
                                            {session.attendanceRecords?.length || 0} học sinh
                                        </span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                        <span className="text-emerald-600 font-bold">
                                            {session.attendanceRecords?.filter((r: any) => r.status === 'PRESENT').length || 0} hiện diện
                                        </span>
                                    </div>
                                    <div className="mt-4 flex items-center text-sm font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Chi tiết <ChevronRight className="w-4 h-4" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-blue-50 text-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Chưa có dữ liệu điểm danh</h3>
                            <p className="text-gray-500 mt-2 max-w-xs mx-auto">
                                Bắt đầu bằng cách tạo buổi học đầu tiên để theo dõi chuyên cần của học sinh.
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setActiveSession(null)}
                                className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Điểm danh: {format(new Date(activeSession.date), 'dd/MM/yyyy')}
                                </h2>
                                <p className="text-sm text-gray-500">Tiết học số {activeSession.period}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    const allPresent: Record<string, string> = {};
                                    students.forEach(s => allPresent[s.userId] = 'PRESENT');
                                    setAttendanceData(allPresent);
                                }}
                                className="px-4 py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                                Có mặt tất cả
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-md disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Lưu kết quả
                            </button>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Học sinh</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Trạng thái</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Ghi chú</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {students.map((student) => (
                                        <tr key={student.userId} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 font-bold overflow-hidden">
                                                        {student.avatarUrl ? (
                                                            <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            student.name.charAt(0)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{student.name}</p>
                                                        <p className="text-xs text-gray-500">{student.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <AttendanceToggle
                                                        active={attendanceData[student.userId] === 'PRESENT'}
                                                        onClick={() => toggleStatus(student.userId, 'PRESENT')}
                                                        icon={<CheckCircle2 className="w-4 h-4" />}
                                                        label="Có mặt"
                                                        color="emerald"
                                                    />
                                                    <AttendanceToggle
                                                        active={attendanceData[student.userId] === 'ABSENT'}
                                                        onClick={() => toggleStatus(student.userId, 'ABSENT')}
                                                        icon={<XCircle className="w-4 h-4" />}
                                                        label="Vắng"
                                                        color="rose"
                                                    />
                                                    <AttendanceToggle
                                                        active={attendanceData[student.userId] === 'LATE'}
                                                        onClick={() => toggleStatus(student.userId, 'LATE')}
                                                        icon={<Clock className="w-4 h-4" />}
                                                        label="Muộn"
                                                        color="amber"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    placeholder="Thêm ghi chú..."
                                                    className="w-full bg-transparent text-sm text-gray-600 focus:outline-none placeholder:text-gray-300"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AttendanceToggle({ active, onClick, icon, label, color }: {
    active: boolean,
    onClick: () => void,
    icon: React.ReactNode,
    label: string,
    color: 'emerald' | 'rose' | 'amber'
}) {
    const colorClasses = {
        emerald: active ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100",
        rose: active ? "bg-rose-100 text-rose-700 border-rose-200" : "bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100",
        amber: active ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100",
    };

    return (
        <button
            onClick={onClick}
            type="button"
            className={cn(
                "flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl border-2 transition-all font-bold text-[10px] uppercase tracking-wider min-w-[70px]",
                colorClasses[color]
            )}
        >
            {icon}
            {label}
        </button>
    );
}
