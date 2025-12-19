"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Search, Filter, MoreVertical, FileSpreadsheet, Loader2 } from "lucide-react";
import Link from "next/link";
import { getClassGradesAction, updateGradeAction } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import { motion } from "framer-motion";

export default function GradebookPage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.id as string;
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        students: any[];
        assignments: any[];
        submissions: any[];
    } | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const loadData = useCallback(async () => {
        setLoading(true);
        const result = await getClassGradesAction(classId);
        if (result.success && result.data) {
            setData(result.data);
        } else {
            showToast(result.message || "Lỗi tải dữ liệu", "error");
        }
        setLoading(false);
    }, [classId, showToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleExport = () => {
        if (!data) return;

        // Create CSV content
        const headers = ['Học sinh', 'Email', 'Điểm trung bình', ...data.assignments.map(a => a.title)];
        const rows = data.students.map(student => {
            const avg = calculateAverage(student.id);
            const grades = data.assignments.map(a => {
                const submission = getGrade(student.id, a.id);
                return submission?.grade !== null ? submission?.grade : '';
            });
            return [student.name, student.email, avg, ...grades];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `bang_diem_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getGrade = (studentId: string, assignmentId: string) => {
        const submission = data?.submissions.find(
            s => s.studentId === studentId && s.assignmentId === assignmentId
        );
        return submission;
    };

    const calculateAverage = (studentId: string) => {
        if (!data) return 0;
        const studentSubmissions = data.submissions.filter(s => s.studentId === studentId && s.grade !== null);
        if (studentSubmissions.length === 0) return 0;

        const total = studentSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0);
        return (total / studentSubmissions.length).toFixed(1);
    };

    const filteredStudents = data?.students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link
                                href={`/dashboard/classes/${classId}`}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Sổ điểm</h1>
                                <p className="text-xs text-gray-500">Quản lý điểm số học sinh</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative hidden md:block">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm học sinh..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-primary rounded-lg text-sm w-64 transition-all outline-none border"
                                />
                            </div>
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                            >
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">Xuất Excel</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-medium sticky left-0 bg-gray-50 z-10 min-w-[200px]">
                                        Học sinh
                                    </th>
                                    <th className="px-6 py-4 font-medium text-center min-w-[100px]">
                                        Trung bình
                                    </th>
                                    {data?.assignments.map(assignment => (
                                        <th key={assignment.id} className="px-6 py-4 font-medium min-w-[150px]">
                                            <div className="flex flex-col gap-1">
                                                <span className="truncate max-w-[120px]" title={assignment.title}>
                                                    {assignment.title}
                                                </span>
                                                <span className="text-[10px] text-gray-500 font-normal">
                                                    /{assignment.maxScore} điểm
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredStudents.map(student => (
                                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 sticky left-0 bg-white group-hover:bg-gray-50/50 z-10 border-r border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    {student.avatar ? (
                                                        <img src={student.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        student.name.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{student.name}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-[120px]">{student.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center w-10 h-8 rounded bg-gray-100 font-bold text-gray-700">
                                                {calculateAverage(student.id)}
                                            </span>
                                        </td>
                                        {data?.assignments.map(assignment => {
                                            const submission = getGrade(student.id, assignment.id);
                                            return (
                                                <td key={assignment.id} className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={assignment.maxScore}
                                                            defaultValue={submission?.grade ?? ''}
                                                            onBlur={async (e) => {
                                                                const val = parseFloat(e.target.value);
                                                                if (!isNaN(val)) {
                                                                    await updateGradeAction(assignment.id, student.id, val);
                                                                    loadData(); // Reload to update averages
                                                                    showToast("Đã lưu điểm", "success");
                                                                }
                                                            }}
                                                            className={`w-12 text-center border rounded p-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${submission?.grade !== undefined && submission.grade >= 5 ? 'text-green-600 font-medium' :
                                                                submission?.grade !== undefined ? 'text-red-600 font-medium' : 'text-gray-500'
                                                                }`}
                                                        />
                                                        {submission?.submittedAt && (
                                                            <span className="text-[10px] text-gray-400">
                                                                {new Date(submission.submittedAt).toLocaleDateString('vi-VN')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredStudents.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            Không tìm thấy học sinh nào
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
