import { PendingAssignment } from "@/lib/student-analytics";
import { Clock, ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface NextUpWidgetProps {
    assignments: PendingAssignment[];
}

export default function NextUpWidget({ assignments }: NextUpWidgetProps) {
    const nextAssignment = assignments[0]; // Get the most urgent one

    if (!nextAssignment) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-border/50 shadow-sm h-full flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Bạn đã hoàn thành hết!</h3>
                <p className="text-sm text-muted-foreground mt-1">Không có bài tập nào cần làm ngay.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-6 border border-border/50 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Cần làm ngay
                </h3>
                {nextAssignment.urgent && (
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                        Gấp
                    </span>
                )}
            </div>

            <div className="flex-1 flex flex-col justify-center">
                <h4 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
                    {nextAssignment.title}
                </h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <Calendar className="w-4 h-4" />
                    <span>Hạn nộp: {formatDistanceToNow(nextAssignment.dueDate, { addSuffix: true, locale: vi })}</span>
                </div>

                <Link
                    href={`/dashboard/assignments/${nextAssignment.id}`}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-center hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
                >
                    Làm bài ngay
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
