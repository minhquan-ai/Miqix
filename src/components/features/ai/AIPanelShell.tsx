"use client";

import { Sparkles, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AIPanelShellProps {
    title?: string;
    onClose: () => void;
    children: ReactNode;
    className?: string;
    loading?: boolean;
}

export function AIPanelShell({
    title = "Trợ lý AI",
    onClose,
    children,
    className,
    loading = false
}: AIPanelShellProps) {
    return (
        <div className={cn(
            "h-full flex flex-col bg-white overflow-hidden",
            className
        )}>
            {/* Header */}
            <div className="p-5 flex items-center justify-between bg-white z-10 shrink-0 border-b border-gray-50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50/50 rounded-xl text-indigo-600">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    </div>
                    <h2 className="font-bold text-lg text-gray-800 tracking-tight">{title}</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded-full transition-all"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
                {children}
            </div>
        </div>
    );
}
