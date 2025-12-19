"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react';
import {
    X, Bell, Check, Clock, Users, AlertTriangle,
    Loader2, ChevronRight, Image as ImageIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
    getWorksheetProgressAction,
    sendWorksheetReminderAction
} from '@/lib/worksheet-actions';
import { useToast } from '@/components/ui/Toast';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import { vi } from 'date-fns/locale';

interface WorksheetProgressDashboardProps {
    assignmentId: string;
    onClose: () => void;
}

interface StudentProgress {
    id: string;
    name: string;
    avatarUrl: string | null;
    status: string;
    completedAt?: Date | null;
}

interface ProgressData {
    assignmentId: string;
    title: string;
    worksheetCode: string | null;
    dueDate: Date;
    total: number;
    completed: number;
    percentage: number;
    students: StudentProgress[];
}

export function WorksheetProgressDashboard({ assignmentId, onClose }: WorksheetProgressDashboardProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [data, setData] = useState<ProgressData | null>(null);
    const [filter, setFilter] = useState<'all' | 'completed' | 'not_started'>('all');

    const loadProgress = async () => {
        setLoading(true);
        const result = await getWorksheetProgressAction(assignmentId);
        if (result.success && result.data) {
            setData(result.data as ProgressData);
        }
        setLoading(false);
    };

    useEffect(() => {
        // eslint-disable-next-line
        loadProgress();
    }, [assignmentId]);


    const handleSendReminder = async () => {
        setSending(true);
        const result = await sendWorksheetReminderAction(assignmentId);
        if (result.success) {
            showToast(result.message || 'Đã gửi nhắc nhở', 'success');
        } else {
            showToast(result.message || 'Có lỗi xảy ra', 'error');
        }
        setSending(false);
    };

    const filteredStudents = data?.students.filter(s => {
        if (filter === 'completed') return s.status === 'completed';
        if (filter === 'not_started') return s.status !== 'completed';
        return true;
    }) || [];

    const isOverdue = data?.dueDate ? isPast(new Date(data.dueDate)) : false;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            📊 Tiến độ làm bài
                        </h2>
                        {data && (
                            <p className="text-sm text-gray-500">
                                {data.worksheetCode && <span className="text-indigo-600">{data.worksheetCode} - </span>}
                                {data.title}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                ) : data ? (
                    <>
                        {/* Stats */}
                        <div className="px-6 py-4 bg-gray-50 border-b">
                            <div className="flex items-center gap-6">
                                {/* Progress Bar */}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-2xl font-bold text-gray-900">
                                            {data.percentage}%
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {data.completed}/{data.total} học sinh
                                        </span>
                                    </div>
                                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${data.percentage === 100
                                                ? 'bg-green-500'
                                                : data.percentage > 50
                                                    ? 'bg-indigo-500'
                                                    : 'bg-amber-500'
                                                }`}
                                            style={{ width: `${data.percentage}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Deadline */}
                                <div className={`px-4 py-2 rounded-lg ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
                                    }`}>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm font-medium">
                                            {isOverdue ? 'Đã hết hạn' : formatDistanceToNow(new Date(data.dueDate), { locale: vi })}
                                        </span>
                                    </div>
                                    <p className="text-xs opacity-75">
                                        {format(new Date(data.dueDate), 'dd/MM/yyyy HH:mm')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-2 px-6 py-3 border-b">
                            {[
                                { key: 'all', label: 'Tất cả', count: data.total },
                                { key: 'completed', label: 'Đã làm', count: data.completed },
                                { key: 'not_started', label: 'Chưa làm', count: data.total - data.completed }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilter(tab.key as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === tab.key
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                >
                                    {tab.label} ({tab.count})
                                </button>
                            ))}
                        </div>

                        {/* Student List */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {filteredStudents.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    Không có học sinh nào
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredStudents.map(student => (
                                        <div
                                            key={student.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border ${student.status === 'completed'
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-white border-gray-200'
                                                }`}
                                        >
                                            {/* Avatar */}
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-medium">
                                                {student.avatarUrl ? (
                                                    <img src={student.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    student.name.charAt(0).toUpperCase()
                                                )}
                                            </div>

                                            {/* Name */}
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{student.name}</p>
                                                {student.status === 'completed' && student.completedAt && (
                                                    <p className="text-xs text-gray-500">
                                                        Hoàn thành {formatDistanceToNow(new Date(student.completedAt), { addSuffix: true, locale: vi })}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Status */}
                                            {student.status === 'completed' ? (
                                                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                    <Check className="w-3 h-3" />
                                                    Đã làm
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                                                    <Clock className="w-3 h-3" />
                                                    Chưa làm
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {data.total - data.completed > 0 && (
                            <div className="px-6 py-4 border-t bg-amber-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-amber-700">
                                        <AlertTriangle className="w-5 h-5" />
                                        <span className="text-sm">
                                            <strong>{data.total - data.completed}</strong> học sinh chưa làm bài
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleSendReminder}
                                        disabled={sending}
                                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50"
                                    >
                                        {sending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Bell className="w-4 h-4" />
                                        )}
                                        Nhắc nhở tất cả
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center p-8 text-gray-500">
                        Không tìm thấy dữ liệu
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
