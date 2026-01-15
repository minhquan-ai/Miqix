
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ClassSession, User } from '@/types';
import { createClassSessionAction, updateClassSessionAction } from '@/lib/actions';
import { getClassMembersAction } from '@/lib/class-member-actions';
import { Loader2, Save, X } from 'lucide-react';

interface SessionFormProps {
    classId: string;
    initialDate?: Date;
    initialPeriod?: number;
    session?: ClassSession;
    onClose: () => void;
    onSuccess: () => void;
}

interface FormData {
    date: string;
    period: number;
    subject: string;
    lessonContent: string;
    note: string;
    classification: string;
}

export function SessionForm({ classId, initialDate, initialPeriod, session, onClose, onSuccess }: SessionFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<Record<string, string>>({}); // studentId -> status

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            date: session ? new Date(session.date).toISOString().split('T')[0] : initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            period: session ? session.period : initialPeriod || 1,
            subject: session?.subject || '',
            lessonContent: session?.lessonContent || '',
            note: session?.note || '',
            classification: session?.classification || 'A'
        }
    });

    useEffect(() => {
        // Load students for attendance
        async function loadStudents() {
            try {
                const members = await getClassMembersAction(classId);
                // Filter only students (the action returns flattened objects)
                const studentMembers = members.filter((m: any) => m.role === 'student');
                setStudents(studentMembers);

                // Initialize attendance from session or default to PRESENT
                const initialAttendance: Record<string, string> = {};
                studentMembers.forEach((s: any) => {
                    const existingRecord = session?.attendanceRecords?.find(r => r.studentId === s.id);
                    initialAttendance[s.id] = existingRecord?.status || 'PRESENT';
                });
                setAttendance(initialAttendance);
            } catch (error) {
                console.error("Failed to load students", error);
            }
        }
        loadStudents();
    }, [classId, session]);

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            const attendanceRecords = Object.entries(attendance).map(([studentId, status]) => ({
                studentId,
                status,
                note: '' // Add note support later if needed
            }));

            let result;
            if (session) {
                result = await updateClassSessionAction(session.id, {
                    subject: data.subject,
                    lessonContent: data.lessonContent,
                    note: data.note,
                    classification: data.classification,
                    attendanceRecords
                });
            } else {
                result = await createClassSessionAction({
                    classId,
                    date: new Date(data.date),
                    period: Number(data.period),
                    subject: data.subject,
                    lessonContent: data.lessonContent,
                    note: data.note,
                    classification: data.classification,
                    attendanceRecords
                });
            }

            if (result.success) {
                onSuccess();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Submit error:", error);
            alert("Có lỗi xảy ra");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {session ? 'Cập nhật Sổ Đầu Bài' : 'Ghi Sổ Đầu Bài'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                            <input
                                type="date"
                                {...register('date', { required: true })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!!session} // Disable date edit for now to simplify
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tiết</label>
                            <select
                                {...register('period', { required: true })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!!session}
                            >
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <option key={i + 1} value={i + 1}>Tiết {i + 1}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Môn học</label>
                        <input
                            type="text"
                            {...register('subject', { required: "Vui lòng nhập môn học" })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ví dụ: Toán, Văn..."
                        />
                        {errors.subject && <span className="text-xs text-red-500">{errors.subject.message}</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên bài / Nội dung</label>
                        <textarea
                            {...register('lessonContent', { required: "Vui lòng nhập nội dung bài dạy" })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ví dụ: Bài 5 - Phương trình bậc hai..."
                        />
                        {errors.lessonContent && <span className="text-xs text-red-500">{errors.lessonContent.message}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Xếp loại tiết học</label>
                            <select
                                {...register('classification')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="A">Tốt (A)</option>
                                <option value="B">Khá (B)</option>
                                <option value="C">Trung bình (C)</option>
                                <option value="D">Yếu (D)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nhận xét (Tùy chọn)</label>
                            <input
                                type="text"
                                {...register('note')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Lớp trật tự, phát biểu sôi nổi..."
                            />
                        </div>
                    </div>

                    {/* Attendance Section */}
                    <div className="border-t border-gray-100 pt-4">
                        <h3 className="font-medium text-gray-900 mb-3">Điểm danh ({students.length} học sinh)</h3>
                        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-2">Học sinh</th>
                                        <th className="px-4 py-2 text-center">Có mặt</th>
                                        <th className="px-4 py-2 text-center">Vắng</th>
                                        <th className="px-4 py-2 text-center">Muộn</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {students.map(student => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 font-medium text-gray-900">{student.name}</td>
                                            <td className="px-4 py-2 text-center">
                                                <input
                                                    type="radio"
                                                    name={`attendance-${student.id}`}
                                                    checked={attendance[student.id] === 'PRESENT'}
                                                    onChange={() => setAttendance(prev => ({ ...prev, [student.id]: 'PRESENT' }))}
                                                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <input
                                                    type="radio"
                                                    name={`attendance-${student.id}`}
                                                    checked={attendance[student.id] === 'ABSENT'}
                                                    onChange={() => setAttendance(prev => ({ ...prev, [student.id]: 'ABSENT' }))}
                                                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <input
                                                    type="radio"
                                                    name={`attendance-${student.id}`}
                                                    checked={attendance[student.id] === 'LATE'}
                                                    onChange={() => setAttendance(prev => ({ ...prev, [student.id]: 'LATE' }))}
                                                    className="w-4 h-4 text-yellow-600 focus:ring-yellow-500"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Lưu sổ
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
