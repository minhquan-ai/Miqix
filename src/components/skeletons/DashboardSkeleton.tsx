import { Skeleton } from "@/components/ui/Skeleton";

export function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Content Skeleton */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Stats Grid Skeleton */}
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="p-6 rounded-xl border border-border">
                                <div className="flex justify-between mb-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-4" />
                                </div>
                                <Skeleton className="h-8 w-12 mb-2" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        ))}
                    </div>

                    {/* Assignments List Skeleton */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <Skeleton className="h-6 w-40" />
                        </div>
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border">
                                    <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                                    <div className="flex-1">
                                        <Skeleton className="h-5 w-48 mb-2" />
                                        <div className="flex gap-3">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-4 w-16" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-8 w-20" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Skeleton */}
                <div className="space-y-6">
                    {/* Profile Card Skeleton */}
                    <div className="rounded-xl p-6 border border-border h-64 relative overflow-hidden">
                        <Skeleton className="absolute inset-0 w-full h-full" />
                    </div>

                    {/* Notification Skeleton */}
                    <div className="rounded-xl p-6 border border-border">
                        <Skeleton className="h-6 w-40 mb-4" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
}
