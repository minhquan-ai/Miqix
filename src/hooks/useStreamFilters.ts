import { useMemo, useState } from "react";
import type { FilterType, TimeRange, SortOption } from "@/components/StreamFilterSidebar";

interface Announcement {
    id: string;
    content: string;
    title?: string | null;
    type: string;
    isPinned: boolean;
    createdAt: Date | string;
    reactions?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    comments?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface FilterState {
    type: FilterType;
    showPinnedOnly: boolean;
    showUnreadOnly: boolean;
    timeRange: TimeRange;
}

export function useStreamFilters(announcements: Announcement[]) {
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState<FilterState>({
        type: "ALL",
        showPinnedOnly: false,
        showUnreadOnly: false,
        timeRange: "ALL"
    });
    const [sortBy, setSortBy] = useState<SortOption>("newest");

    const filtered = useMemo(() => {
        let result = [...announcements];

        // 1. Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(a => {
                const titleMatch = a.title?.toLowerCase().includes(query);
                const contentMatch = a.content.toLowerCase().includes(query);
                return titleMatch || contentMatch;
            });
        }

        // 2. Type filter
        if (filters.type !== "ALL") {
            result = result.filter(a => a.type.toUpperCase() === filters.type);
        }

        // 3. Pinned only filter
        if (filters.showPinnedOnly) {
            result = result.filter(a => a.isPinned);
        }

        // 4. Unread only filter (placeholder - would need read status tracking)
        // if (filters.showUnreadOnly) {
        //   result = result.filter(a => !a.isRead);
        // }\n\n        // 5. Time range filter
        if (filters.timeRange !== "ALL") {
            const now = new Date();
            result = result.filter(a => {
                const createdAt = new Date(a.createdAt);
                const diffMs = now.getTime() - createdAt.getTime();
                const diffDays = diffMs / (1000 * 60 * 60 * 24);

                switch (filters.timeRange) {
                    case "TODAY":
                        return diffDays < 1;
                    case "WEEK":
                        return diffDays < 7;
                    case "MONTH":
                        return diffDays < 30;
                    default:
                        return true;
                }
            });
        }

        // 6. Sort
        result.sort((a, b) => {
            // Pinned posts always first
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;

            switch (sortBy) {
                case "newest":
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

                case "reactions":
                    const aReactions = a.reactions?.length || 0;
                    const bReactions = b.reactions?.length || 0;
                    if (aReactions !== bReactions) return bReactions - aReactions;
                    // Fallback to newest
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

                case "comments":
                    const aComments = a.comments?.length || 0;
                    const bComments = b.comments?.length || 0;
                    if (aComments !== bComments) return bComments - aComments;
                    // Fallback to newest
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

                default:
                    return 0;
            }
        });

        return result;
    }, [announcements, searchQuery, filters, sortBy]);

    return {
        filteredAnnouncements: filtered,
        searchQuery,
        filters,
        sortBy,
        setSearchQuery,
        setFilters,
        setSortBy,
        totalCount: announcements.length,
        filteredCount: filtered.length
    };
}
