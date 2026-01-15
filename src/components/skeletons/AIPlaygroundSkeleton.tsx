"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export function AIPlaygroundSkeleton() {
    return (
        <div className="page-container !p-0 flex overflow-hidden">
            {/* Left Sidebar - Chat History (hidden by default) */}
            <div className="hidden md:flex w-72 bg-muted/30 border-r border-border flex-col p-4">
                <Skeleton variant="button" className="w-full mb-6" />
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                            <Skeleton variant="circle" size="sm" />
                            <Skeleton className="h-4 flex-1" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-background dark:to-background">
                {/* Header */}
                <div className="h-16 px-6 flex items-center justify-between border-b border-border bg-white/50 dark:bg-card/50 backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <Skeleton variant="circle" size="md" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-48 rounded-full" />
                        <Skeleton className="h-8 w-28 rounded-full" />
                    </div>
                </div>

                {/* Center Content - Welcome State */}
                <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
                    <div className="w-full max-w-2xl space-y-8">
                        {/* Greeting */}
                        <div className="text-center space-y-3">
                            <Skeleton className="h-10 w-64 mx-auto rounded-2xl" />
                            <Skeleton className="h-5 w-80 mx-auto" />
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-4 gap-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white/70 dark:bg-card p-4 rounded-2xl border border-border">
                                    <Skeleton className="h-3 w-12 mb-2" />
                                    <Skeleton className="h-6 w-16" />
                                </div>
                            ))}
                        </div>

                        {/* Priority Widgets */}
                        <div className="grid grid-cols-2 gap-4">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="space-y-3">
                                    <Skeleton className="h-4 w-28" />
                                    <div className="bg-white/70 dark:bg-card rounded-2xl p-4 border border-border space-y-3">
                                        {[...Array(2)].map((_, j) => (
                                            <div key={j} className="flex items-center gap-3">
                                                <Skeleton variant="circle" size="sm" />
                                                <Skeleton className="h-4 flex-1" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* AI Card */}
                        <Skeleton className="h-28 w-full rounded-3xl" />

                        {/* Quick Actions */}
                        <div className="grid grid-cols-4 gap-3">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-14 rounded-2xl" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Input Bar */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center px-4">
                    <div className="w-full max-w-2xl">
                        <Skeleton className="h-14 w-full rounded-[2rem]" />
                    </div>
                </div>
            </div>

            {/* Right Panel - Canvas (optional) */}
            <div className="hidden xl:flex w-[450px] bg-white dark:bg-card border-l border-border flex-col">
                <div className="h-14 px-4 flex items-center justify-between border-b border-border shrink-0">
                    <Skeleton className="h-5 w-24" />
                    <div className="flex items-center gap-2">
                        <Skeleton variant="circle" size="sm" />
                        <Skeleton variant="circle" size="sm" />
                    </div>
                </div>
                <div className="flex-1 p-6 space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-40 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}

// Chat loading state (for when messages are being sent)
export function AIChatLoadingSkeleton() {
    return (
        <div className="flex items-start gap-3 p-4">
            <Skeleton variant="avatar" size="md" />
            <div className="flex-1 space-y-3 max-w-xl">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
            </div>
        </div>
    );
}
