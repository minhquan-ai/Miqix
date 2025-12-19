"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";
import { getClassSessionsAction } from "@/lib/actions";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { vi } from "date-fns/locale";

interface AttendanceWidgetProps {
    classId: string;
}

export default function AttendanceWidget({ classId }: AttendanceWidgetProps) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<{
        averageRate: number;
        trend: 'up' | 'down' | 'neutral';
        lastSessionDate?: string;
        lastSessionRate?: number;
    }>({ averageRate: 0, trend: 'neutral' });

    useEffect(() => {
        async function loadStats() {
            try {
                // Get sessions for the last 30 days to calculate trends
                const endDate = endOfDay(new Date());
                const startDate = startOfDay(subDays(new Date(), 30));

                const sessions = await getClassSessionsAction(classId, startDate, endDate);

                if (sessions.length === 0) {
                    setStats({ averageRate: 0, trend: 'neutral' });
                    setLoading(false);
                    return;
                }

                // Sort sessions by date descending
                sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                const lastSession = sessions[0];
                const lastSessionRate = calculateRate(lastSession);

                // Calculate average of all sessions
                const totalRate = sessions.reduce((acc, s) => acc + calculateRate(s), 0);
                const averageRate = Math.round(totalRate / sessions.length);

                // Calculate trend (compare last 3 sessions vs previous 3)
                // Simplified: compare last session vs average
                let trend: 'up' | 'down' | 'neutral' = 'neutral';
                if (lastSessionRate > averageRate + 5) trend = 'up';
                else if (lastSessionRate < averageRate - 5) trend = 'down';

                setStats({
                    averageRate,
                    trend,
                    lastSessionDate: lastSession.date,
                    lastSessionRate
                });

            } catch (error) {
                console.error("Failed to load attendance stats", error);
            } finally {
                setLoading(false);
            }
        }

        loadStats();
    }, [classId]);

    const calculateRate = (session: any) => {
        if (!session.attendanceRecords || session.attendanceRecords.length === 0) return 0;
        const present = session.attendanceRecords.filter((r: any) => r.status === 'PRESENT' || r.status === 'LATE').length;
        return Math.round((present / session.attendanceRecords.length) * 100);
    };

    if (loading) {
        return (
            <Card className="min-h-[180px] border-none shadow-none bg-white/50">
                <CardContent className="p-6 flex items-center justify-center h-full">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                        <div className="h-8 w-24 bg-gray-200 rounded"></div>
                        <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="min-h-[180px] border-none shadow-sm bg-gradient-to-br from-white to-blue-50/30 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CalendarDays className="w-24 h-24 text-blue-600" />
            </div>

            <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    Chuyên cần
                </CardTitle>
            </CardHeader>

            <CardContent className="relative z-10">
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <div className="text-3xl font-bold text-gray-900">
                            {stats.averageRate}%
                        </div>
                        <div className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1">
                            {stats.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                            {stats.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                            {stats.trend === 'neutral' && <Minus className="w-3 h-3 text-gray-400" />}
                            <span>Trung bình tháng này</span>
                        </div>
                    </div>

                    {stats.lastSessionDate && (
                        <div className="text-right">
                            <div className={`text-lg font-bold ${(stats.lastSessionRate || 0) >= 90 ? 'text-green-600' :
                                (stats.lastSessionRate || 0) >= 70 ? 'text-orange-500' : 'text-red-600'
                                }`}>
                                {stats.lastSessionRate}%
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase">
                                {format(new Date(stats.lastSessionDate), "dd/MM", { locale: vi })}
                            </div>
                        </div>
                    )}
                </div>

                <Link href={`/dashboard/classes/${classId}/attendance/report`}>
                    <Button variant="outline" size="sm" className="w-full bg-white/50 hover:bg-white border-blue-100 hover:border-blue-200 text-blue-600 group-hover:text-blue-700 transition-all">
                        Xem báo cáo
                        <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}
