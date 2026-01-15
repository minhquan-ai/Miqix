"use client";

import {
    Skeleton,
    SkeletonStatCard,
    SkeletonListItem,
    SkeletonText
} from "@/components/ui/Skeleton";

// ============================================
// ASSIGNMENTS LIST PAGE SKELETON
// ============================================
export function AssignmentsPageSkeleton() {
    return (
        <div className="page-container">
            <div className="page-content space-y-6">
                {/* Hero Banner */}
                <Skeleton className="h-40 w-full rounded-3xl" />

                {/* Filter Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-10 w-24 rounded-full" />
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-40 rounded-xl" />
                        <Skeleton variant="circle" size="md" />
                    </div>
                </div>

                {/* Section Header */}
                <div className="flex items-center justify-between">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-8 w-28 rounded-lg" />
                </div>

                {/* Assignment Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-card rounded-2xl p-5 border border-border space-y-4">
                            <div className="flex items-start justify-between">
                                <Skeleton className="w-12 h-12 rounded-xl" />
                                <Skeleton className="h-6 w-16 rounded-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                            <Skeleton variant="button" className="w-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================
// ASSIGNMENT DETAIL PAGE SKELETON
// ============================================
export function AssignmentDetailSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-background/50">
            {/* Header */}
            <div className="bg-white dark:bg-card border-b border-border sticky top-0 z-30">
                <div className="page-content px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Skeleton variant="circle" size="md" />
                            <div className="space-y-2">
                                <Skeleton className="h-7 w-64" />
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton variant="button" className="w-28" />
                            <Skeleton variant="button" className="w-24" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="page-content p-6">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column - Assignment Content */}
                    <div className="lg:w-[60%] space-y-6">
                        {/* Description Card */}
                        <div className="bg-white dark:bg-card rounded-2xl p-6 border border-border">
                            <Skeleton className="h-6 w-32 mb-4" />
                            <SkeletonText lines={5} />
                        </div>

                        {/* Attachments */}
                        <div className="bg-white dark:bg-card rounded-2xl p-6 border border-border">
                            <Skeleton className="h-6 w-28 mb-4" />
                            <div className="grid grid-cols-2 gap-3">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                                        <Skeleton className="w-10 h-10 rounded-lg" />
                                        <div className="flex-1 space-y-1">
                                            <Skeleton className="h-4 w-28" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Submission Panel */}
                    <div className="lg:flex-1 space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <SkeletonStatCard />
                            <SkeletonStatCard />
                        </div>

                        {/* Submission Area */}
                        <div className="bg-white dark:bg-card rounded-2xl p-6 border border-border">
                            <Skeleton className="h-6 w-36 mb-4" />
                            <Skeleton className="h-40 w-full rounded-xl mb-4" />
                            <Skeleton variant="button" className="w-full h-12" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// SUBMISSIONS PAGE SKELETON (Teacher view)
// ============================================
export function SubmissionsPageSkeleton() {
    return (
        <div className="page-container flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0 mb-6">
                <div className="flex items-center gap-4">
                    <Skeleton variant="circle" size="md" />
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-56" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton variant="button" className="w-32" />
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                {/* Left: Student List */}
                <div className="bg-white dark:bg-card rounded-2xl border border-border flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-border shrink-0">
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                    <div className="flex-1 overflow-auto p-2 space-y-2">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                                <Skeleton variant="avatar" size="md" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-6 w-12 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Submission Detail */}
                <div className="bg-white dark:bg-card rounded-2xl border border-border flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-border shrink-0">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-8 w-24 rounded-lg" />
                        </div>
                    </div>
                    <div className="flex-1 p-6 space-y-4">
                        <Skeleton className="h-48 w-full rounded-xl" />
                        <div className="space-y-3">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-20 w-full rounded-lg" />
                        </div>
                        <div className="flex items-center gap-3 pt-4">
                            <Skeleton variant="button" className="flex-1" />
                            <Skeleton variant="button" className="w-28" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
