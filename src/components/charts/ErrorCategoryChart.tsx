"use client";

interface ErrorCategoryChartProps {
    categories: {
        understanding: number;
        calculation: number;
        presentation: number;
        logic: number;
    };
}

const CATEGORY_CONFIG = {
    understanding: { label: "Hiểu bài", color: "bg-blue-500", textColor: "text-blue-700" },
    calculation: { label: "Tính toán", color: "bg-red-500", textColor: "text-red-700" },
    presentation: { label: "Trình bày", color: "bg-yellow-500", textColor: "text-yellow-700" },
    logic: { label: "Lập luận", color: "bg-purple-500", textColor: "text-purple-700" }
};

export function ErrorCategoryChart({ categories }: ErrorCategoryChartProps) {
    const total = Object.values(categories).reduce((sum, val) => sum + val, 0);

    // If no errors detected
    if (total === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-2">✨</div>
                <p className="font-medium">Không phát hiện lỗi nào!</p>
                <p className="text-sm">Bài làm rất tốt!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h4 className="font-semibold text-sm">Phân tích lỗi theo danh mục</h4>

            {/* Bar Chart */}
            <div className="space-y-3">
                {Object.entries(categories).map(([key, value]) => {
                    const config = CATEGORY_CONFIG[key as keyof typeof categories];
                    const percentage = total > 0 ? (value / total) * 100 : 0;

                    if (value === 0) return null;

                    return (
                        <div key={key} className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="font-medium">{config.label}</span>
                                <span className={config.textColor}>{percentage.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                                <div
                                    className={`${config.color} h-full rounded-full transition-all duration-500`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
                {Object.entries(categories).map(([key, value]) => {
                    const config = CATEGORY_CONFIG[key as keyof typeof categories];
                    if (value === 0) return null;

                    return (
                        <div key={key} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-sm ${config.color}`} />
                            <span className="text-xs text-muted-foreground">{config.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
