
'use client';

import React, { useState, useEffect } from 'react';
import { SessionCalendar } from './SessionCalendar';
import { getClassSessionsAction } from '@/lib/actions';
import { ClassSession } from '@/types';
import { startOfWeek, endOfWeek, addDays } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { SessionForm } from './SessionForm';

interface SessionsTabProps {
    classId: string;
    isTeacher: boolean;
}

export function SessionsTab({ classId, isTeacher }: SessionsTabProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [sessions, setSessions] = useState<ClassSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<ClassSession | undefined>(undefined);
    const [selectedSlot, setSelectedSlot] = useState<{ date: Date; period: number } | undefined>(undefined);

    const fetchSessions = async () => {
        setIsLoading(true);
        try {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 });
            const end = endOfWeek(currentDate, { weekStartsOn: 1 });
            const data = await getClassSessionsAction(classId, start, end);
            setSessions(data);
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [classId, currentDate]);

    const handleSessionClick = (session: ClassSession) => {
        if (!isTeacher) return;
        setSelectedSession(session);
        setSelectedSlot(undefined);
        setIsModalOpen(true);
    };

    const handleEmptySlotClick = (date: Date, period: number) => {
        if (!isTeacher) return;
        setSelectedSession(undefined);
        setSelectedSlot({ date, period });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSession(undefined);
        setSelectedSlot(undefined);
    };

    const handleSuccess = () => {
        handleCloseModal();
        fetchSessions();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Sổ Đầu Bài</h2>
                    <p className="text-gray-500">Theo dõi nội dung giảng dạy và nề nếp lớp học</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
            ) : (
                <SessionCalendar
                    sessions={sessions}
                    currentDate={currentDate}
                    onDateChange={setCurrentDate}
                    onSessionClick={handleSessionClick}
                    onEmptySlotClick={handleEmptySlotClick}
                />
            )}

            {isModalOpen && (
                <SessionForm
                    classId={classId}
                    session={selectedSession}
                    initialDate={selectedSlot?.date}
                    initialPeriod={selectedSlot?.period}
                    onClose={handleCloseModal}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}
