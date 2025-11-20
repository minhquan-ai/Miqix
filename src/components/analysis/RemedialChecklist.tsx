"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle } from "lucide-react";

interface RemedialChecklistProps {
    submissionId: string;
    suggestions: string[];
    mainIssues: string[];
}

export function RemedialChecklist({ submissionId, suggestions, mainIssues }: RemedialChecklistProps) {
    const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());
    const storageKey = `remedial_${submissionId}`;

    // Load from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            setCompletedItems(new Set(JSON.parse(stored)));
        }
    }, [storageKey]);

    // Save to localStorage
    const toggleItem = (index: number) => {
        const newCompleted = new Set(completedItems);
        if (newCompleted.has(index)) {
            newCompleted.delete(index);
        } else {
            newCompleted.add(index);
        }
        setCompletedItems(newCompleted);
        localStorage.setItem(storageKey, JSON.stringify(Array.from(newCompleted)));
    };

    const progress = suggestions.length > 0
        ? (completedItems.size / suggestions.length) * 100
        : 0;

    if (suggestions.length === 0) {
        return (
            <div className="text-center py-6 text-muted-foreground text-sm">
                Không có gợi ý khắc phục
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with progress */}
            <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Kế hoạch khắc phục</h4>
                <span className="text-xs text-muted-foreground">
                    {completedItems.size}/{suggestions.length} hoàn thành
                </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2">
                <div
                    className="bg-green-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Main issues summary */}
            {mainIssues.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-900 mb-2">⚠️ Vấn đề chính:</p>
                    <ul className="space-y-1">
                        {mainIssues.map((issue, idx) => (
                            <li key={idx} className="text-xs text-red-800 flex gap-2">
                                <span>•</span>
                                <span>{issue}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Checklist */}
            <div className="space-y-2">
                {suggestions.map((suggestion, index) => {
                    const isCompleted = completedItems.has(index);
                    return (
                        <button
                            key={index}
                            onClick={() => toggleItem(index)}
                            className={`w-full text-left p-3 rounded-lg border transition-all hover:border-primary/50 ${isCompleted
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-card border-border'
                                }`}
                        >
                            <div className="flex gap-3 items-start">
                                {isCompleted ? (
                                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                                ) : (
                                    <Circle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                                )}
                                <span className={`text-sm ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                    {suggestion}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
