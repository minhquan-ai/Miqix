import { useEffect, useState } from "react";
import { Assignment, Submission, User } from "@/types";
import {
    calculateClassTopicPerformance,
    identifyAtRiskStudents,
    identifyCommonMistakes,
    ClassTopicPerformance,
    AtRiskStudent
} from "@/lib/analytics";
import { AlertTriangle, BarChart2, TrendingDown, TrendingUp, Users } from "lucide-react";

interface TeacherInsightsDashboardProps {
    assignments: Assignment[];
    submissions: Submission[];
    students: User[]; // Need list of students to calculate missing assignments
}

export function TeacherInsightsDashboard({ assignments, submissions, students }: TeacherInsightsDashboardProps) {
    const [classPerformance, setClassPerformance] = useState<ClassTopicPerformance[]>([]);
    const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>("");

    useEffect(() => {
        if (assignments.length > 0 && submissions.length > 0) {
            // Calculate Class Performance
            const performance = calculateClassTopicPerformance(submissions, assignments, students.length);
            setClassPerformance(performance);

            if (performance.length > 0 && !selectedTopic) {
                setSelectedTopic(performance[0].topic);
            }

            // Identify At-Risk Students
            const atRisk = identifyAtRiskStudents(
                submissions,
                students.map(s => ({ id: s.id, name: s.name })),
                assignments
            );
            setAtRiskStudents(atRisk);
        }
    }, [assignments, submissions, students, selectedTopic]);

    const commonMistakes = selectedTopic ? identifyCommonMistakes(selectedTopic) : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <BarChart2 className="w-6 h-6 text-primary" />
                    Phân Tích Lớp Học
                </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Class Performance Card */}
                <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        Hiệu Suất Theo Chủ Đề
                    </h3>
                    <div className="space-y-4">
                        {classPerformance.length === 0 ? (
                            <p className="text-muted-foreground text-sm">Chưa có đủ dữ liệu để phân tích.</p>
                        ) : (
                            classPerformance.map((perf) => (
                                <div key={perf.topic} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">{perf.topic}</span>
                                        <span className={perf.averageScore < 5 ? "text-red-500" : "text-green-600"}>
                                            TB: {perf.averageScore.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${perf.averageScore >= 8 ? 'bg-green-500' :
                                                    perf.averageScore >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${(perf.averageScore / 10) * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Hoàn thành: {Math.round(perf.completionRate)}%</span>
                                        <span>{perf.submissionCount} bài nộp</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* At-Risk Students Card */}
                <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Học Sinh Cần Hỗ Trợ
                    </h3>
                    <div className="space-y-3">
                        {atRiskStudents.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>Không có học sinh nào trong nhóm nguy cơ. Tuyệt vời! 🎉</p>
                            </div>
                        ) : (
                            atRiskStudents.map((student) => (
                                <div key={student.studentId} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                                    <div>
                                        <div className="font-medium text-red-900">{student.studentName}</div>
                                        <div className="text-xs text-red-700 flex gap-2">
                                            <span>TB: {student.averageScore.toFixed(1)}</span>
                                            <span>•</span>
                                            <span>Thiếu {student.missingAssignments} bài</span>
                                        </div>
                                    </div>
                                    {student.trend === 'declining' && (
                                        <div className="flex items-center gap-1 text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                                            <TrendingDown className="w-3 h-3" />
                                            Giảm sút
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Common Mistakes Section */}
            {selectedTopic && (
                <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                    <h3 className="font-semibold mb-4">Lỗi Thường Gặp: {selectedTopic}</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                        {commonMistakes.map((mistake, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-100 rounded-lg">
                                <div className="w-6 h-6 rounded-full bg-orange-200 text-orange-700 flex items-center justify-center text-xs font-bold shrink-0">
                                    {idx + 1}
                                </div>
                                <p className="text-sm text-orange-900">{mistake}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
