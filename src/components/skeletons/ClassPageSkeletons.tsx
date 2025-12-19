import { BookOpen, Users, Calendar, Clock, TrendingUp } from "lucide-react";

export function ClassDashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                            <div className="w-12 h-6 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                        <div className="grid grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Upcoming */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                    <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function StreamSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            {/* Announcement Composer */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="h-32 bg-gray-100 rounded-lg"></div>
            </div>

            {/* Announcements */}
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                            <div className="h-3 bg-gray-100 rounded w-24"></div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ClassworkSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="h-8 bg-gray-200 rounded w-48"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>

            {/* Assignments */}
            <div className="grid gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 space-y-2">
                                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                            </div>
                            <div className="w-16 h-8 bg-gray-200 rounded"></div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-4 bg-gray-100 rounded w-24"></div>
                            <div className="h-4 bg-gray-100 rounded w-20"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function PeopleSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            {/* Teacher Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="h-5 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-100 rounded w-24"></div>
                    </div>
                </div>
            </div>

            {/* Students Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
