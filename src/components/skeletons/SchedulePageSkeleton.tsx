"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export function SchedulePageSkeleton() {
    return (
        <div className="page-container flex flex-col">
            <div className="page-content flex flex-col gap-6 h-full min-h-0">
                {/* Hero Section */}
                <div className="relative overflow-hidden bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-fuchsia-600/20 rounded-[2rem] p-4 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Skeleton className="w-10 h-10 rounded-lg" />
                            <Skeleton className="h-7 w-40" />
                        </div>
                        <div className="flex items-center gap-3">
                            <Skeleton variant="button" className="w-28" />
                            <Skeleton variant="button" className="w-32" />
                        </div>
                    </div>
                </div>

                {/* Control Bar */}
                <div className="bg-white dark:bg-card p-3 rounded-[2rem] border border-border shrink-0">
                    <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-24 rounded-2xl" />
                            <div className="flex items-center gap-1">
                                <Skeleton variant="circle" size="md" />
                                <Skeleton variant="circle" size="md" />
                            </div>
                            <Skeleton className="h-6 w-36" />
                        </div>
                        <div className="flex items-center gap-3">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-8 w-20 rounded-full" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Schedule Grid */}
                <div className="flex-1 bg-white dark:bg-card rounded-[2rem] border border-border overflow-hidden flex flex-col min-h-0">
                    {/* Header Row */}
                    <div className="grid grid-cols-8 border-b border-border shrink-0">
                        <div className="p-4 border-r border-border">
                            <Skeleton variant="circle" size="md" className="mx-auto" />
                        </div>
                        {[...Array(7)].map((_, i) => (
                            <div key={i} className="py-4 px-2 text-center border-r border-border last:border-r-0">
                                <Skeleton className="h-3 w-10 mx-auto mb-2" />
                                <Skeleton className="h-10 w-10 mx-auto rounded-2xl" />
                            </div>
                        ))}
                    </div>

                    {/* Time Grid */}
                    <div className="flex-1 overflow-auto">
                        <div className="grid grid-cols-8">
                            {/* Time Column */}
                            <div className="border-r border-border">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="h-20 border-b border-border/60 flex items-start justify-end pr-3 pt-2">
                                        <Skeleton className="h-3 w-10" />
                                    </div>
                                ))}
                            </div>

                            {/* Day Columns */}
                            {[...Array(7)].map((_, dayIndex) => (
                                <div key={dayIndex} className="relative border-r border-border last:border-r-0">
                                    {[...Array(12)].map((_, hourIndex) => (
                                        <div key={hourIndex} className="h-20 border-b border-border/60 relative">
                                            {/* Random events */}
                                            {hourIndex === 2 && dayIndex === 1 && (
                                                <Skeleton className="absolute inset-x-1 top-1 h-16 rounded-xl" />
                                            )}
                                            {hourIndex === 4 && dayIndex === 3 && (
                                                <Skeleton className="absolute inset-x-1 top-1 h-24 rounded-xl" />
                                            )}
                                            {hourIndex === 1 && dayIndex === 5 && (
                                                <Skeleton className="absolute inset-x-1 top-1 h-12 rounded-xl" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Mini calendar skeleton for sidebar
export function MiniCalendarSkeleton() {
    return (
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-28" />
                <div className="flex items-center gap-1">
                    <Skeleton variant="circle" size="sm" />
                    <Skeleton variant="circle" size="sm" />
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
                {[...Array(7)].map((_, i) => (
                    <Skeleton key={`h-${i}`} className="h-4 w-4 mx-auto mb-2" />
                ))}
                {[...Array(35)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-8 mx-auto rounded-lg" />
                ))}
            </div>
        </div>
    );
}
