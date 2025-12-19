"use client";

import { CheckCircle, Circle, Clock, Star, Target } from "lucide-react";
import { Mission } from "@/types";
import { cn } from "@/lib/utils";

interface MissionCardProps {
    mission: Mission;
}

export default function MissionCard({ mission }: MissionCardProps) {
    const isCompleted = mission.status === 'completed';
    const isDaily = mission.type === 'system';

    return (
        <div className={cn(
            "relative overflow-hidden rounded-xl border p-4 transition-all hover:shadow-md",
            isCompleted
                ? "bg-green-500/5 border-green-500/20"
                : "bg-card border-border"
        )}>
            {/* Background Pattern for Daily Missions */}
            {isDaily && (
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
            )}

            <div className="flex items-start gap-4 relative z-10">
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    isCompleted
                        ? "bg-green-500/10 text-green-600"
                        : isDaily ? "bg-primary/10 text-primary" : "bg-orange-500/10 text-orange-600"
                )}>
                    {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                    ) : isDaily ? (
                        <Star className="w-6 h-6" />
                    ) : (
                        <Target className="w-6 h-6" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className={cn(
                            "font-bold truncate pr-2",
                            isCompleted && "text-muted-foreground line-through"
                        )}>
                            {mission.title}
                        </h4>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {mission.description}
                    </p>

                    {/* Progress Bar (Mock for now, can be real later) */}
                    {!isCompleted && (
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: mission.progress ? `${(mission.progress.current / mission.progress.total) * 100}%` : '0%' }}
                            />
                        </div>
                    )}

                    {mission.dueDate && !isCompleted && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <Clock className="w-3 h-3" />
                            <span>Hết hạn: {new Date(mission.dueDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
