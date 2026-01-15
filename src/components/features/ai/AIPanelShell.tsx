"use client";

import { Sparkles, X, Loader2, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import Link from "next/link";

interface AIPanelShellProps {
    title?: string;
    onClose: () => void;
    children: ReactNode;
    className?: string;
    loading?: boolean;
    sourceContext?: string; // e.g., "schedule", "class", "learning"
}

// Helper to save conversation to shared localStorage for AI Playground
export function saveToAIHistory(context: string, messages: Array<{ role: string, content: string }>) {
    if (typeof window === 'undefined') return;

    try {
        const sessions = JSON.parse(localStorage.getItem("miqix_chat_sessions") || "[]");
        const newSession = {
            id: Date.now().toString(),
            title: `[${context}] ${messages[0]?.content?.slice(0, 30) || "Cuộc trò chuyện"}...`,
            messages: messages.map((m, idx) => ({
                id: `${Date.now()}-${idx}`,
                role: m.role === 'assistant' ? 'ai' : m.role,
                content: m.content,
                timestamp: Date.now() - (messages.length - idx) * 1000
            })),
            updatedAt: Date.now(),
            source: context
        };
        sessions.unshift(newSession);
        // Keep only last 50 sessions
        localStorage.setItem("miqix_chat_sessions", JSON.stringify(sessions.slice(0, 50)));
    } catch (e) {
        console.error("[SaveToAIHistory Error]:", e);
    }
}

export function AIPanelShell({
    title = "Trợ lý AI",
    onClose,
    children,
    className,
    loading = false,
    sourceContext = "general"
}: AIPanelShellProps) {
    return (
        <div className={cn(
            "h-full flex flex-col bg-white overflow-hidden",
            className
        )}>
            {/* Header */}
            <div className="py-4 px-4 flex items-center justify-between bg-white z-10 shrink-0 border-b border-gray-50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50/50 rounded-xl text-indigo-600">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    </div>
                    <h2 className="font-bold text-lg text-gray-800 tracking-tight">{title}</h2>
                </div>
                <div className="flex items-center gap-2">
                    {/* Link to Main AI Playground */}
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                    >
                        <span>Mở AI chính</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded-full transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
                {children}
            </div>
        </div>
    );
}
