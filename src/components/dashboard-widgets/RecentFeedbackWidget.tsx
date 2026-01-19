import { MessageSquare, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface RecentFeedbackWidgetProps {
    feedback?: {
        assignmentTitle: string;
        score: number;
        maxScore: number;
        feedback?: string;
        submittedAt: Date;
    };
}

export default function RecentFeedbackWidget({ feedback }: RecentFeedbackWidgetProps) {
    if (!feedback) {
        return (
            <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm h-full flex flex-col items-center justify-center text-center opacity-60">
                <MessageSquare className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Chưa có phản hồi mới</p>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm h-full flex flex-col">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                Phản hồi mới nhất
            </h3>

            <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h4 className="font-bold text-foreground line-clamp-1">{feedback.assignmentTitle}</h4>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(feedback.submittedAt, { addSuffix: true, locale: vi })}
                        </p>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="text-2xl font-black text-primary">
                            {feedback.score}<span className="text-sm text-muted-foreground font-normal">/{feedback.maxScore}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-muted rounded-xl p-3 text-sm text-foreground italic border border-border relative">
                    <div className="absolute -top-2 left-4 w-4 h-4 bg-muted border-t border-l border-border transform rotate-45" />
                    &quot;{feedback.feedback || "Làm tốt lắm!"}&quot;
                </div>
            </div>
        </div>
    );
}
