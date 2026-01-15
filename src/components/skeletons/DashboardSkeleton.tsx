"use client";

import {
    Skeleton,
    SkeletonStatCard,
    SkeletonListItem,
    SkeletonCard,
    SkeletonUser,
    SkeletonText
} from "@/components/ui/Skeleton";

export function DashboardSkeleton() {
    return (
        <div className="page-container">
            <div className="page-content space-y-8">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton variant="button" className="w-32" />
                        <Skeleton variant="avatar" size="md" />
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main Content Skeleton */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Stats Grid Skeleton */}
                        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                            {[...Array(4)].map((_, i) => (
                                <SkeletonStatCard key={i} />
                            ))}
                        </div>

                        {/* Assignments List Skeleton */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <Skeleton className="h-6 w-40" />
                            </div>
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <SkeletonListItem key={i} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Skeleton */}
                    <div className="space-y-6">
                        {/* Profile Card Skeleton */}
                        <div className="rounded-2xl p-6 border border-border bg-white dark:bg-card">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <Skeleton variant="avatar" className="w-20 h-20" />
                                <div className="space-y-2 w-full">
                                    <Skeleton className="h-5 w-32 mx-auto" />
                                    <Skeleton className="h-4 w-24 mx-auto" />
                                </div>
                                <div className="grid grid-cols-3 gap-4 w-full pt-4">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="text-center space-y-1">
                                            <Skeleton className="h-6 w-8 mx-auto" />
                                            <Skeleton className="h-3 w-12 mx-auto" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Notification Skeleton */}
                        <div className="rounded-2xl p-6 border border-border bg-white dark:bg-card">
                            <Skeleton className="h-5 w-40 mb-4" />
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <Skeleton variant="circle" size="sm" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Teacher Dashboard variant
export function TeacherDashboardSkeleton() {
    return (
        <div className="page-container">
            <div className="page-content space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-72" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton variant="button" className="w-36" />
                        <Skeleton variant="button" className="w-28" />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <SkeletonStatCard key={i} />
                    ))}
                </div>

                {/* Main Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Left: Classes */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-8 w-24 rounded-lg" />
                        </div>
                        <div className="grid gap-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-white dark:bg-card rounded-2xl p-5 border border-border">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="w-14 h-14 rounded-xl" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-5 w-40" />
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                        <Skeleton className="h-8 w-16 rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Tasks */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-6 w-40" />
                        </div>
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <SkeletonListItem key={i} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
