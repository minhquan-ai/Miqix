import { Class } from "@/types";
import { Users, BookOpen, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ClassCardProps {
    classData: Class;
    averageScore?: number;
    activeAssignments?: number;
}

export function ClassCard({ classData, averageScore = 0, activeAssignments = 0 }: ClassCardProps) {
    return (
        <Link href={`/dashboard/classes/${classData.id}`}>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{classData.name}</h3>
                        <p className="text-sm text-muted-foreground">{classData.subject}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                </div>

                <p className="text-sm text-muted-foreground mb-6 line-clamp-2 flex-1">
                    {classData.description || "Không có mô tả"}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                            <Users className="w-3 h-3" /> Sĩ số
                        </div>
                        <div className="font-semibold">--</div>
                    </div>
                    <div className="text-center border-l border-border">
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                            <BookOpen className="w-3 h-3" /> Bài tập
                        </div>
                        <div className="font-semibold">{activeAssignments}</div>
                    </div>
                    <div className="text-center border-l border-border">
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                            <TrendingUp className="w-3 h-3" /> TB
                        </div>
                        <div className={`font-semibold ${averageScore >= 8 ? 'text-green-600' : averageScore >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {averageScore > 0 ? averageScore.toFixed(1) : '--'}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
