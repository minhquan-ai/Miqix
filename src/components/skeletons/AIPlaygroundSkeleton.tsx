"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export function AIPlaygroundSkeleton() {
    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 overflow-hidden">
            {/* Sidebar Skeleton */}
            <div className="hidden lg:flex flex-col w-64 bg-white/80 backdrop-blur-sm border-r border-gray-100 p-4">
                <Skeleton className="h-10 w-full rounded-xl mb-6" />
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-xl" />
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative">
                {/* Header */}
                <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 bg-white/50 backdrop-blur-sm">
                    <Skeleton className="h-8 w-32 rounded-xl" />
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-48 rounded-full" />
                        <Skeleton className="h-8 w-28 rounded-full" />
                    </div>
                </div>

                {/* Center Content */}
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="w-full max-w-2xl space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-4 gap-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white/70 p-4 rounded-2xl border border-gray-100">
                                    <Skeleton className="h-3 w-12 mb-2 rounded" />
                                    <Skeleton className="h-6 w-16 rounded" />
                                </div>
                            ))}
                        </div>

                        {/* Priority Row */}
                        <div className="grid grid-cols-2 gap-4">
                            {[...Array(2)].map((_, i) => (
                                <div key={i}>
                                    <Skeleton className="h-4 w-24 mb-3 rounded" />
                                    <Skeleton className="h-20 w-full rounded-2xl" />
                                </div>
                            ))}
                        </div>

                        {/* AI Card */}
                        <Skeleton className="h-32 w-full rounded-3xl" />

                        {/* Quick Actions */}
                        <div className="grid grid-cols-4 gap-3">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-14 w-full rounded-2xl" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Input Bar */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                    <Skeleton className="h-16 w-full max-w-2xl mx-4 rounded-[2rem]" />
                </div>
            </div>

            {/* Canvas Panel */}
            <div className="hidden xl:flex flex-col w-[40%] bg-white/50 backdrop-blur-sm border-l border-gray-100">
                <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div>
                            <Skeleton className="h-4 w-32 mb-1 rounded" />
                            <Skeleton className="h-3 w-16 rounded" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <Skeleton className="h-16 w-16 rounded-2xl mx-auto" />
                        <Skeleton className="h-5 w-32 mx-auto rounded" />
                        <Skeleton className="h-4 w-48 mx-auto rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
}
