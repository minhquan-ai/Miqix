import { RubricItem } from "@/types";
import { Info } from "lucide-react";

interface RubricViewerProps {
    rubric: RubricItem[];
}

export default function RubricViewer({ rubric }: RubricViewerProps) {
    if (!rubric || rubric.length === 0) return null;

    const totalPoints = rubric.reduce((sum, item) => sum + item.maxPoints, 0);

    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary">
                <Info className="w-5 h-5" />
                Grading rubric
            </h3>

            <div className="space-y-4">
                {rubric.map((item) => (
                    <div key={item.id} className="bg-muted/30 p-4 rounded-lg border border-border/50">
                        <div className="flex justify-between items-start gap-4 mb-2">
                            <h4 className="font-semibold text-foreground">{item.criteria}</h4>
                            <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                                {item.maxPoints} pts
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {item.description}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border flex justify-end">
                <div className="text-sm font-medium text-muted-foreground">
                    Total possible points: <span className="text-foreground font-bold">{totalPoints}</span>
                </div>
            </div>
        </div>
    );
}
