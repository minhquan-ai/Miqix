"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
    Calendar,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    PieChart
} from "lucide-react";
import { getStudentAttendanceAction } from "@/lib/actions";

interface AttendanceStudentViewProps {
    classId: string;
    studentId: string;
}

export default function AttendanceStudentView({ classId, studentId }: AttendanceStudentViewProps) {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [classId, studentId]);

    const loadData = async () => {
        setIsLoading(true);
        const result = await getStudentAttendanceAction(classId, studentId);
        setData(result);
        setIsLoading(false);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PRESENT': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'ABSENT': return <XCircle className="w-5 h-5 text-red-500" />;
            case 'LATE': return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'EXCUSED': return <AlertCircle className="w-5 h-5 text-blue-500" />;
            default: return null;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PRESENT': return 'Có mặt';
            case 'ABSENT': return 'Vắng';
            case 'LATE': return 'Muộn';
            case 'EXCUSED': return 'Có phép';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PRESENT': return 'bg-green-100 text-green-800 border-green-200';
            case 'ABSENT': return 'bg-red-100 text-red-800 border-red-200';
            case 'LATE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'EXCUSED': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return <div className="text-center py-12 text-muted-foreground">Đang tải dữ liệu...</div>;
    }

    if (!data || data.records.length === 0) {
        return (
            <div className="text-center py-12 bg-muted/20 rounded-xl border-2 border-dashed border-border max-w-4xl mx-auto">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Chưa có dữ liệu điểm danh nào.</p>
            </div>
        );
    }

    const { stats, records } = data;
    const attendanceRate = Math.round((stats.present / stats.total) * 100) || 0;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                        <PieChart className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold">{attendanceRate}%</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Tỷ lệ chuyên cần</div>
                </div>

                <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold">{stats.present}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Có mặt</div>
                </div>

                <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
                        <XCircle className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold">{stats.absent}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Vắng</div>
                </div>

                <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mb-2">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold">{stats.late + stats.excused}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Muộn / Phép</div>
                </div>
            </div>

            {/* History List */}
            <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Lịch sử điểm danh
                </h3>
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <div className="divide-y divide-border">
                        {records.map((record: any) => (
                            <div key={record.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-muted flex flex-col items-center justify-center font-bold text-muted-foreground border border-border">
                                        <span className="text-xs uppercase">{format(new Date(record.session.date), 'MMM', { locale: vi })}</span>
                                        <span className="text-lg">{format(new Date(record.session.date), 'dd')}</span>
                                    </div>
                                    <div>
                                        <div className="font-medium">
                                            {format(new Date(record.session.date), "'Thứ' eeee, dd/MM/yyyy", { locale: vi })}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {format(new Date(record.session.date), "HH:mm")}
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 border ${getStatusColor(record.status)}`}>
                                    {getStatusIcon(record.status)}
                                    {getStatusLabel(record.status)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
