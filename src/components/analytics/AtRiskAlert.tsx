"use client";

import { getEnhancedAtRiskStudents, EnhancedAtRiskStudent } from "@/lib/analytics";
import { User, Submission } from "@/types";
import { AlertTriangle, TrendingDown, CheckCircle2 } from "lucide-react";
import { formatScore } from "@/lib/score-utils";

interface AtRiskAlertProps {
    users: User[];
    submissions: Submission[];
    classStudentIds: string[];
}

export function AtRiskAlert({ users, submissions, classStudentIds }: AtRiskAlertProps) {
    const atRiskStudents = getEnhancedAtRiskStudents(users, submissions, classStudentIds);

    if (atRiskStudents.length === 0) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="font-medium text-green-900">Tuyệt vời!</p>
                <p className="text-sm text-green-700">Hiện không có học sinh nào cần hỗ trợ đặc biệt</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold">Cảnh Báo & Can Thiệp Sớm</h3>
                <span className="ml-auto bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {atRiskStudents.length} học sinh
                </span>
            </div>

            <div className="space-y-3">
                {atRiskStudents.map(student => (
                    <AtRiskCard key={student.studentId} student={student} />
                ))}
            </div>
        </div>
    );
}

function AtRiskCard({ student }: { student: EnhancedAtRiskStudent }) {
    const riskColors = {
        high: 'bg-red-50 border-red-300 text-red-900',
        medium: 'bg-yellow-50 border-yellow-300 text-yellow-900',
        low: 'bg-blue-50 border-blue-300 text-blue-900'
    };

    const riskBadgeColors = {
        high: 'bg-red-600 text-white',
        medium: 'bg-yellow-600 text-white',
        low: 'bg-blue-600 text-white'
    };

    const riskLabels = {
        high: 'Cao',
        medium: 'Trung bình',
        low: 'Thấp'
    };

    return (
        <div className={`border rounded-lg p-4 ${riskColors[student.riskLevel]}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h4 className="font-semibold flex items-center gap-2">
                        {student.studentName}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${riskBadgeColors[student.riskLevel]}`}>
                            Nguy cơ: {riskLabels[student.riskLevel]}
                        </span>
                    </h4>
                    <p className="text-sm opacity-75">Điểm TB: {formatScore(student.averageScore / 10)}/10</p>
                </div>
                <TrendingDown className="w-5 h-5" />
            </div>

            {/* Reasons */}
            <div className="mb-3">
                <p className="text-xs font-medium mb-1.5">⚠️ Vấn đề:</p>
                <ul className="space-y-1">
                    {student.reasons.map((reason, idx) => (
                        <li key={idx} className="text-xs flex gap-2">
                            <span>•</span>
                            <span>{reason}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Suggestions */}
            <div>
                <p className="text-xs font-medium mb-1.5">💡 Gợi ý can thiệp:</p>
                <ul className="space-y-1">
                    {student.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-xs flex gap-2">
                            <span>→</span>
                            <span>{suggestion}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
