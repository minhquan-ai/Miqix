"use client";

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Target, BookOpen, Award, AlertCircle } from 'lucide-react';
import { getSubmissionsAction, getAssignmentsAction } from '@/lib/actions';
import { Assignment, Submission } from '@/types';
import {
    calculateTopicPerformance,
    analyzeStrengthsWeaknesses,
    getProgressTimeline,
    calculateOverallStats,
    getPracticeSuggestions,
    TopicPerformance
} from '@/lib/analytics';
import { ProgressTrackingChart } from './ProgressTrackingChart';

export function StudentProgressDashboard({ studentId }: { studentId: string }) {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const allSubmissions = await getSubmissionsAction();
                const studentSubs = allSubmissions.filter(s => s.studentId === studentId);
                setSubmissions(studentSubs);

                const allAssignments = await getAssignmentsAction();
                setAssignments(allAssignments);
            } catch (error) {
                console.error('Failed to load progress data', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [studentId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const topicPerformances = calculateTopicPerformance(submissions, assignments);
    const analysis = analyzeStrengthsWeaknesses(topicPerformances);
    const timeline = getProgressTimeline(submissions, assignments);
    const stats = calculateOverallStats(submissions);
    const suggestions = getPracticeSuggestions(analysis.weaknesses);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Award className="w-7 h-7 text-primary" />
                    Hành Trình Học Tập Của Em
                </h2>
                <p className="text-muted-foreground mt-1">
                    Khám phá điểm mạnh và cơ hội phát triển của bạn
                </p>
            </div>

            {/* Overall Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatCard
                    label="Tổng bài nộp"
                    value={stats.totalSubmissions}
                    icon={<Target className="w-5 h-5" />}
                    color="blue"
                />
                <StatCard
                    label="Điểm trung bình"
                    value={stats.averageScore.toFixed(1)}
                    suffix="/10"
                    icon={<BookOpen className="w-5 h-5" />}
                    color="green"
                />
                <StatCard
                    label="Điểm cao nhất"
                    value={stats.highestScore}
                    suffix="/10"
                    icon={<Award className="w-5 h-5" />}
                    color="purple"
                />
                <StatCard
                    label="Tỷ lệ hoàn thành"
                    value={Math.round(stats.completionRate)}
                    suffix="%"
                    icon={<TrendingUp className="w-5 h-5" />}
                    color="orange"
                />
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Strengths */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-green-900">
                        <Award className="w-5 h-5" />
                        💪 Điểm Mạnh Của Em
                    </h3>
                    <div className="space-y-3">
                        {analysis.strengths.length > 0 ? (
                            analysis.strengths.map((strength, idx) => (
                                <PerformanceCard key={idx} performance={strength} type="strength" />
                            ))
                        ) : (
                            <p className="text-sm text-green-700">Hãy hoàn thành thêm bài tập để xem điểm mạnh!</p>
                        )}
                    </div>
                </div>

                {/* Weaknesses */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-orange-900">
                        <AlertCircle className="w-5 h-5" />
                        🎯 Cơ Hội Phát Triển
                    </h3>
                    <div className="space-y-3">
                        {analysis.weaknesses.length > 0 ? (
                            analysis.weaknesses.map((weakness, idx) => (
                                <PerformanceCard key={idx} performance={weakness} type="weakness" />
                            ))
                        ) : (
                            <p className="text-sm text-orange-700">Tuyệt vời! Em không có điểm yếu rõ rệt.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Practice Suggestions */}
            {suggestions.length > 0 && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-blue-900">
                        <Target className="w-5 h-5" />
                        📚 Gợi Ý Luyện Tập
                    </h3>
                    <ul className="space-y-2">
                        {suggestions.map((suggestion, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                                <span className="text-blue-600 mt-1">•</span>
                                <span>{suggestion}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Progress Timeline */}
            {timeline.length > 0 && (
                <div className="bg-card border-2 border-border rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        📈 Tiến Độ Theo Thời Gian
                    </h3>

                    {/* Chart */}
                    <div className="mb-8 px-2">
                        <ProgressTrackingChart
                            data={timeline.map(t => ({
                                date: t.date,
                                score: t.score,
                                title: t.assignmentTitle
                            }))}
                            height={250}
                        />
                    </div>

                    {/* List */}
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {timeline.slice().reverse().map((point, idx) => (
                            <div key={idx} className="flex items-center gap-4 text-sm py-2 border-b border-border last:border-0 hover:bg-muted/30 px-2 rounded-md transition-colors">
                                <span className="text-muted-foreground w-24 shrink-0 text-xs">
                                    {new Date(point.date).toLocaleDateString('vi-VN')}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{point.assignmentTitle}</p>
                                    <p className="text-xs text-muted-foreground">{point.subject}</p>
                                </div>
                                <div className={`font-bold px-3 py-1 rounded-lg text-xs ${point.score >= 8 ? 'bg-green-100 text-green-700' :
                                    point.score >= 6 ? 'bg-blue-100 text-blue-700' :
                                        point.score >= 4 ? 'bg-orange-100 text-orange-700' :
                                            'bg-red-100 text-red-700'
                                    }`}>
                                    {point.score}/10
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Most Improved */}
            {analysis.mostImproved && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-purple-900">
                        <TrendingUp className="w-5 h-5" />
                        🌟 Tiến Bộ Vượt Bậc
                    </h3>
                    <p className="text-purple-800">
                        Em đã cải thiện rất tốt môn <strong>{analysis.mostImproved.topic}</strong>!
                        Hiện tại đạt <strong>{Math.round(analysis.mostImproved.accuracy)}%</strong> độ chính xác.
                        Hãy tiếp tục phát huy nhé! 🎉
                    </p>
                </div>
            )}
        </div>
    );
}

// Helper Components
function StatCard({ label, value, suffix = '', icon, color }: {
    label: string;
    value: number | string;
    suffix?: string;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'purple' | 'orange';
}) {
    const colorClasses = {
        blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-900',
        green: 'from-green-50 to-green-100 border-green-200 text-green-900',
        purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-900',
        orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-900'
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} border-2 rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium opacity-80">{label}</p>
                {icon}
            </div>
            <p className="text-3xl font-bold">
                {value}{suffix}
            </p>
        </div>
    );
}

function PerformanceCard({ performance, type }: {
    performance: TopicPerformance;
    type: 'strength' | 'weakness';
}) {
    const getTrendIcon = () => {
        if (performance.trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-600" />;
        if (performance.trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-600" />;
        return <Minus className="w-4 h-4 text-gray-400" />;
    };

    const bgColor = type === 'strength' ? 'bg-white/60' : 'bg-white/60';
    const textColor = type === 'strength' ? 'text-green-900' : 'text-orange-900';

    return (
        <div className={`${bgColor} border ${type === 'strength' ? 'border-green-200' : 'border-orange-200'} rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-2">
                <h4 className={`font-bold ${textColor}`}>{performance.topic}</h4>
                {getTrendIcon()}
            </div>
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                    {performance.totalAssignments} bài tập
                </span>
                <span className={`font-bold ${performance.accuracy >= 80 ? 'text-green-600' :
                    performance.accuracy >= 60 ? 'text-blue-600' :
                        performance.accuracy >= 40 ? 'text-orange-600' :
                            'text-red-600'
                    }`}>
                    {Math.round(performance.accuracy)}%
                </span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all ${performance.accuracy >= 80 ? 'bg-green-500' :
                        performance.accuracy >= 60 ? 'bg-blue-500' :
                            performance.accuracy >= 40 ? 'bg-orange-500' :
                                'bg-red-500'
                        }`}
                    style={{ width: `${performance.accuracy}%` }}
                />
            </div>
        </div>
    );
}
