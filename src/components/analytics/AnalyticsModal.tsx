"use client";

import { useState } from "react";
import { X, TrendingUp, Users, AlertTriangle, Target } from "lucide-react";
import { ClassPerformanceOverview } from "./ClassPerformanceOverview";
import { AtRiskAlert } from "./AtRiskAlert";
import { KnowledgeGapHeatMap } from "./KnowledgeGapHeatMap";
import { User, Submission, Assignment } from "@/types";

interface AnalyticsModalProps {
    users: User[];
    submissions: Submission[];
    assignments: Assignment[];
    classStudentIds: string[];
    className?: string;
}

export function AnalyticsModal({
    users,
    submissions,
    assignments,
    classStudentIds,
    className
}: AnalyticsModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Trigger Button - Clean & Subtle */}
            <button
                onClick={() => setIsOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors text-sm font-medium ${className}`}
            >
                <TrendingUp className="w-4 h-4" />
                Xem Analytics
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    {/* Modal Content */}
                    <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-foreground">Phân Tích Lớp Học</h2>
                                    <p className="text-sm text-muted-foreground">Insights chi tiết về hiệu suất</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Quick Stats Summary */}
                            <div className="grid grid-cols-4 gap-4">
                                <QuickStat
                                    icon={<Users className="w-5 h-5" />}
                                    label="Tổng học sinh"
                                    value={users.filter(u => classStudentIds.includes(u.id)).length}
                                    color="blue"
                                />
                                <QuickStat
                                    icon={<Target className="w-5 h-5" />}
                                    label="Bài tập"
                                    value={assignments.length}
                                    color="purple"
                                />
                                <QuickStat
                                    icon={<TrendingUp className="w-5 h-5" />}
                                    label="Đã chấm"
                                    value={submissions.filter(s => s.status === 'graded').length}
                                    color="green"
                                />
                                <QuickStat
                                    icon={<AlertTriangle className="w-5 h-5" />}
                                    label="Cần hỗ trợ"
                                    value={(() => {
                                        const { getEnhancedAtRiskStudents } = require("@/lib/analytics");
                                        return getEnhancedAtRiskStudents(users, submissions, classStudentIds).length;
                                    })()}
                                    color="red"
                                />
                            </div>

                            {/* Main Analytics - Organized in Tabs/Sections */}
                            <div className="space-y-6">
                                {/* Performance Overview */}
                                <Section title="Tổng Quan Hiệu Suất">
                                    <ClassPerformanceOverview
                                        users={users}
                                        submissions={submissions}
                                        assignments={assignments}
                                        classStudentIds={classStudentIds}
                                    />
                                </Section>

                                {/* 2-Column: At-Risk + Knowledge Gaps */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <Section title="Cảnh Báo Học Sinh">
                                        <AtRiskAlert
                                            users={users}
                                            submissions={submissions}
                                            classStudentIds={classStudentIds}
                                        />
                                    </Section>

                                    <Section title="Khoảng Trống Kiến Thức">
                                        <KnowledgeGapHeatMap
                                            submissions={submissions}
                                            classStudentIds={classStudentIds}
                                        />
                                    </Section>
                                </div>
                            </div>
                        </div>

                        {/* Footer - Actions */}
                        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-3">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={() => {
                                    // TODO: Export functionality
                                    alert("Xuất báo cáo (Coming soon)");
                                }}
                                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Xuất Báo Cáo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function QuickStat({ icon, label, value, color }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: 'blue' | 'purple' | 'green' | 'red'
}) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 border-blue-200',
        purple: 'bg-purple-50 text-purple-600 border-purple-200',
        green: 'bg-green-50 text-green-600 border-green-200',
        red: 'bg-red-50 text-red-600 border-red-200'
    };

    return (
        <div className="bg-white border border-border rounded-xl p-4 space-y-2">
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${colorClasses[color]}`}>
                {icon}
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
            {children}
        </div>
    );
}
