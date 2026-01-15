"use client";

import { getKnowledgeGaps, KnowledgeGapItem } from "@/lib/analytics";
import { Submission } from "@/types";

interface KnowledgeGapHeatMapProps {
    submissions: Submission[];
    classStudentIds: string[];
}

export function KnowledgeGapHeatMap({ submissions, classStudentIds }: KnowledgeGapHeatMapProps) {
    const gaps = getKnowledgeGaps(submissions, classStudentIds);

    if (gaps.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                    Chưa có đủ dữ liệu để phân tích khoảng trống kiến thức
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Bản Đồ Khoảng Trống Kiến Thức</h3>
            <p className="text-sm text-muted-foreground mb-4">
                Các loại lỗi phổ biến trong lớp (càng đỏ càng cần chú ý)
            </p>

            <div className="space-y-3">
                {gaps.map((gap, idx) => (
                    <GapBar key={idx} gap={gap} />
                ))}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-border flex gap-4 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span>Tốt (\u003c30%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-yellow-500"></div>
                    <span>Cần chú ý (30-60%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span>Nghiêm trọng (\u003e60%)</span>
                </div>
            </div>
        </div>
    );
}

function GapBar({ gap }: { gap: KnowledgeGapItem }) {
    const severityColors = {
        low: 'bg-green-500',
        medium: 'bg-yellow-500',
        high: 'bg-red-500'
    };

    const severityTextColors = {
        low: 'text-green-700',
        medium: 'text-yellow-700',
        high: 'text-red-700'
    };

    const severityLabels = {
        low: '✓ Tốt',
        medium: '⚠ Cần chú ý',
        high: '🚨 Nghiêm trọng'
    };

    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
                <span className="font-medium text-sm">{gap.category}</span>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${severityTextColors[gap.severity]}`}>
                        {severityLabels[gap.severity]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {gap.errorRate}%
                    </span>
                </div>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                    className={`${severityColors[gap.severity]} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${gap.errorRate}%` }}
                />
            </div>
            <p className="text-xs text-muted-foreground">
                Dữ liệu từ {gap.studentCount} bài làm đã chấm
            </p>
        </div>
    );
}
