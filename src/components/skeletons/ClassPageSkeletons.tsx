"use client";

import {
    Skeleton,
    SkeletonStatCard,
    SkeletonCard,
    SkeletonUser,
    SkeletonText,
    SkeletonListItem
} from "@/components/ui/Skeleton";

// ============================================
// CLASS DASHBOARD SKELETON (Tổng quan)
// ============================================
export function ClassDashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <SkeletonStatCard key={i} />
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-card rounded-2xl p-6 border border-border">
                        <Skeleton className="h-6 w-32 mb-4" />
                        <div className="grid grid-cols-2 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-20 rounded-xl" />
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white dark:bg-card rounded-2xl p-6 border border-border">
                        <Skeleton className="h-6 w-40 mb-4" />
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <Skeleton variant="avatar" size="md" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Upcoming */}
                    <div className="bg-white dark:bg-card rounded-2xl p-6 border border-border">
                        <Skeleton className="h-6 w-32 mb-4" />
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="p-3 rounded-xl bg-muted/30 space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-3 w-2/3" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// STREAM SKELETON (Bảng tin)
// ============================================
export function StreamSkeleton() {
    return (
        <div className="space-y-4">
            {/* Announcement Composer */}
            <div className="bg-white dark:bg-card rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-3">
                    <Skeleton variant="avatar" size="md" />
                    <Skeleton className="h-12 flex-1 rounded-xl" />
                </div>
            </div>

            {/* Announcements */}
            {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-card rounded-2xl p-6 border border-border">
                    <div className="flex items-start gap-3 mb-4">
                        <Skeleton variant="avatar" size="md" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton variant="circle" size="sm" />
                    </div>
                    <SkeletonText lines={3} />
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                        <Skeleton className="h-8 w-20 rounded-lg" />
                        <Skeleton className="h-8 w-24 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================
// CLASSWORK SKELETON (Bài tập)
// ============================================
export function ClassworkSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton variant="button" className="w-32" />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-9 w-24 rounded-full" />
                ))}
            </div>

            {/* Assignments */}
            <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-card rounded-2xl p-5 border border-border">
                        <div className="flex items-start gap-4">
                            <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <div className="flex items-center gap-3 mt-2">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                            <Skeleton className="h-8 w-16 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================
// PEOPLE SKELETON (Mọi người)
// ============================================
export function PeopleSkeleton() {
    return (
        <div className="space-y-6">
            {/* Teacher Section */}
            <div className="bg-white dark:bg-card rounded-2xl p-6 border border-border">
                <Skeleton className="h-5 w-24 mb-4" />
                <SkeletonUser size="lg" />
            </div>

            {/* Students Section */}
            <div className="bg-white dark:bg-card rounded-2xl p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-8 w-28 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/20">
                            <Skeleton variant="avatar" size="md" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================
// RESOURCES SKELETON (Tài liệu)
// ============================================
export function ResourcesSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-36" />
                <div className="flex items-center gap-2">
                    <Skeleton variant="button" className="w-28" />
                    <Skeleton variant="circle" size="md" />
                </div>
            </div>

            {/* Folders */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-card rounded-2xl p-4 border border-border">
                        <Skeleton className="w-12 h-12 rounded-xl mb-3" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-16 mt-1" />
                    </div>
                ))}
            </div>

            {/* Files List */}
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-white dark:bg-card">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================
// GRADES SKELETON (Điểm số)
// ============================================
export function GradesSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <SkeletonStatCard key={i} />
                ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-card rounded-2xl border border-border overflow-hidden">
                {/* Table Header */}
                <div className="flex items-center gap-4 p-4 border-b border-border bg-muted/30">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20 ml-auto" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                </div>
                {/* Table Rows */}
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-b-0">
                        <Skeleton variant="avatar" size="sm" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-6 w-12 ml-auto rounded-lg" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                ))}
            </div>
        </div>
    );
}
