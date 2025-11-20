"use client";

import { Search, Filter, ArrowUpDown } from "lucide-react";
import { useState } from "react";

interface SearchFilterProps {
    onSearch: (query: string) => void;
    onFilterChange: (filter: string) => void;
    onSortChange: (sort: string) => void;
    filterOptions?: { value: string; label: string }[];
    sortOptions?: { value: string; label: string }[];
    placeholder?: string;
}

export function SearchFilter({
    onSearch,
    onFilterChange,
    onSortChange,
    filterOptions = [
        { value: "all", label: "Tất cả" },
        { value: "open", label: "Đang mở" },
        { value: "submitted", label: "Đã nộp" },
        { value: "graded", label: "Đã chấm" }
    ],
    sortOptions = [
        { value: "dueDate", label: "Hạn nộp" },
        { value: "title", label: "Tên bài" },
        { value: "status", label: "Trạng thái" },
        { value: "score", label: "Điểm số" }
    ],
    placeholder = "Tìm kiếm bài tập..."
}: SearchFilterProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [selectedSort, setSelectedSort] = useState("dueDate");

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        onSearch(value);
    };

    const handleFilterChange = (value: string) => {
        setSelectedFilter(value);
        onFilterChange(value);
    };

    const handleSortChange = (value: string) => {
        setSelectedSort(value);
        onSortChange(value);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {/* Search Input */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <select
                    value={selectedFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer appearance-none min-w-[140px]"
                >
                    {filterOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <select
                    value={selectedSort}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer appearance-none min-w-[140px]"
                >
                    {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            Sắp xếp: {option.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
