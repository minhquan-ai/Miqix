"use client";

import { Search, LayoutGrid, List, BookOpen } from "lucide-react";
import { useState } from "react";

interface ClassesFilterBarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    selectedSubject: string;
    onSubjectChange: (value: string) => void;
    selectedType: string;
    onTypeChange: (value: string) => void;
    viewMode: "grid" | "list";
    onViewModeChange: (mode: "grid" | "list") => void;
}

export function ClassesFilterBar({
    searchQuery,
    onSearchChange,
    selectedSubject,
    onSubjectChange,
    selectedType,
    onTypeChange,
    viewMode,
    onViewModeChange,
}: ClassesFilterBarProps) {
    const subjects = ["Toán học", "Vật lý", "Hóa học", "Sinh học", "Tin học", "Ngữ văn", "Tiếng Anh"];

    return (
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Tìm kiếm lớp học..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-400"
                />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                <select
                    value={selectedSubject}
                    onChange={(e) => onSubjectChange(e.target.value)}
                    className="px-3 py-2 bg-gray-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-blue-500/20 text-gray-600 min-w-[120px]"
                >
                    <option value="">Tất cả môn</option>
                    {subjects.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>

                <select
                    value={selectedType}
                    onChange={(e) => onTypeChange(e.target.value)}
                    className="px-3 py-2 bg-gray-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-blue-500/20 text-gray-600 min-w-[120px]"
                >
                    <option value="">Tất cả loại</option>
                    <option value="main">Lớp Chính</option>
                    <option value="extra">Lớp Phụ</option>
                </select>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => onViewModeChange("grid")}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow text-blue-600" : "text-gray-400 hover:text-gray-600"
                            }`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onViewModeChange("list")}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow text-blue-600" : "text-gray-400 hover:text-gray-600"
                            }`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
