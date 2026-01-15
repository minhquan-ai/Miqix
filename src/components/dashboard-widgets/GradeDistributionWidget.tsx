import { BarChart3 } from "lucide-react";

interface GradeDistributionWidgetProps {
    distribution: { range: string; count: number; color: string }[];
}

export default function GradeDistributionWidget({ distribution }: GradeDistributionWidgetProps) {
    const maxCount = Math.max(...distribution.map(d => d.count), 1); // Avoid division by zero

    return (
        <div className="bg-white p-6 rounded-2xl border border-border/50 shadow-sm h-full">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Phân bố điểm số
            </h3>

            <div className="flex items-end justify-between gap-2 h-40 mt-4">
                {distribution.map((item, index) => {
                    const heightPercent = (item.count / maxCount) * 100;
                    return (
                        <div key={index} className="flex flex-col items-center flex-1 group">
                            <div className="relative w-full flex justify-center">
                                <span className="absolute -top-6 text-xs font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                    {item.count}
                                </span>
                                <div
                                    className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ease-out ${item.color} opacity-80 group-hover:opacity-100`}
                                    style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                                />
                            </div>
                            <span className="text-xs text-muted-foreground mt-2 font-medium">{item.range}</span>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-4 border-t border-border/50 flex justify-between text-xs text-muted-foreground">
                <span>Thấp</span>
                <span>Cao</span>
            </div>
        </div>
    );
}
