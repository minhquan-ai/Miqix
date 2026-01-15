"use client";

import { useState } from "react";
import { Search, Filter, Calendar, ArrowUpDown, Pin, Clock, MessageSquare, Heart, X } from "lucide-react";

export type FilterType = "ALL" | "NORMAL" | "IMPORTANT" | "URGENT" | "EVENT";
export type TimeRange = "TODAY" | "WEEK" | "MONTH" | "ALL";
export type SortOption = "newest" | "reactions" | "comments";

export interface FilterState {
    type: FilterType;
    showPinnedOnly: boolean;
    showUnreadOnly: boolean;
    timeRange: TimeRange;
}

interface StreamFilterSidebarProps {
    onSearchChange: (query: string) => void;
    onFilterChange: (filters: FilterState) => void;
    onSortChange: (sort: SortOption) => void;
    currentFilters?: FilterState;
    currentSortBy?: SortOption;
}

export default function StreamFilterSidebar({
    onSearchChange,
    onFilterChange,
    onSortChange,
    currentFilters,
    currentSortBy
}: StreamFilterSidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // Use props if provided, fallback to hardcoded defaults
    const filterType = currentFilters?.type || "ALL";
    const showPinnedOnly = currentFilters?.showPinnedOnly || false;
    const showUnreadOnly = currentFilters?.showUnreadOnly || false;
    const timeRange = currentFilters?.timeRange || "ALL";
    const sortBy = currentSortBy || "newest";

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        onSearchChange(value);
    };

    const handleFilterChange = (key: keyof FilterState, value: any) => {
        // Build newFilters from CURRENT props (not stale state)
        const newFilters: FilterState = {
            type: key === "type" ? value : filterType,
            showPinnedOnly: key === "showPinnedOnly" ? value : showPinnedOnly,
            showUnreadOnly: key === "showUnreadOnly" ? value : showUnreadOnly,
            timeRange: key === "timeRange" ? value : timeRange
        };

        // Notify parent with correct filter state
        onFilterChange(newFilters);
    };

    const handleSortChange = (value: SortOption) => {
        onSortChange(value);
    };

    const typeFilters = [
        { value: "ALL" as const, label: "Tất cả", icon: "📁", color: "text-gray-600" },
        { value: "NORMAL" as const, label: "Thông thường", icon: "✨", color: "text-blue-600" },
        { value: "IMPORTANT" as const, label: "Quan trọng", icon: "🔔", color: "text-orange-600" },
        { value: "URGENT" as const, label: "Khẩn cấp", icon: "⚠️", color: "text-red-600" },
        { value: "EVENT" as const, label: "Sự kiện", icon: "📅", color: "text-purple-600" }
    ];

    const sortOptions = [
        { value: "newest" as const, label: "Mới nhất", icon: Clock },
        { value: "reactions" as const, label: "Nhiều cảm xúc", icon: Heart },
        { value: "comments" as const, label: "Sôi nổi nhất", icon: MessageSquare }
    ];

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="w-full pl-9 pr-8 py-2 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                />
                {searchQuery && (
                    <button
                        onClick={() => handleSearchChange("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Main Filters Card */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-3 border-b border-border bg-muted/30">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Filter className="w-3 h-3" /> Bộ lọc
                    </h3>
                </div>

                <div className="p-2 space-y-1">
                    {typeFilters.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => handleFilterChange("type", filter.value)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${filterType === filter.value
                                ? "bg-primary/10 text-primary font-medium"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <span className="text-base">{filter.icon}</span>
                            <span className={filterType === filter.value ? "" : ""}>{filter.label}</span>
                            {filterType === filter.value && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="border-t border-border my-1 mx-3" />

                <div className="p-3 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                checked={showPinnedOnly}
                                onChange={(e) => handleFilterChange("showPinnedOnly", e.target.checked)}
                                className="peer h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                            />
                        </div>
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-2">
                            <Pin className="w-3.5 h-3.5" /> Chỉ bài ghim
                        </span>
                    </label>
                </div>
            </div>

            {/* Sort Options */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-3 border-b border-border bg-muted/30">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <ArrowUpDown className="w-3 h-3" /> Sắp xếp
                    </h3>
                </div>
                <div className="p-2 space-y-1">
                    {sortOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleSortChange(option.value)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${sortBy === option.value
                                ? "bg-primary/10 text-primary font-medium"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <option.icon className="w-4 h-4" />
                            <span>{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
