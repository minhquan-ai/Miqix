"use client";

import { Search, LayoutGrid, List } from "lucide-react";
import { ElegantSelect } from "@/components/ui/ElegantSelect";

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
        <div className="bg-white px-2 py-1.5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row items-center gap-2">
            {/* Search Part */}
            <div className="relative flex-1 group w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Tìm kiếm lớp học..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 bg-transparent border-none rounded-xl text-sm focus:ring-0 placeholder:text-gray-400 font-semibold"
                />
            </div>

            {/* Subtle Divider */}
            <div className="hidden md:block w-px h-6 bg-gray-100 mx-2" />

            {/* Filters Area */}
            <div className="flex items-center gap-1 shrink-0">
                <ElegantSelect
                    value={selectedSubject}
                    onChange={(val) => onSubjectChange(val)}
                    options={[
                        { value: "", label: "Tất Cả Môn" },
                        ...subjects.map(s => ({ value: s, label: s }))
                    ]}
                    className="w-[145px]"
                />

                <div className="hidden md:block w-px h-6 bg-gray-50 mx-1" />

                <ElegantSelect
                    value={selectedType}
                    onChange={(val) => onTypeChange(val)}
                    options={[
                        { value: "", label: "Lớp Học" },
                        { value: "main", label: "Chính Khoá" },
                        { value: "extra", label: "Lớp Học Thêm" }
                    ]}
                    className="w-[130px]"
                />

                <div className="hidden md:block w-px h-6 bg-gray-100 mx-2" />

                {/* View Mode Toggle */}
                <div className="flex bg-gray-50/80 rounded-xl p-0.5 border border-gray-100/50">
                    <button
                        onClick={() => onViewModeChange("grid")}
                        className={`p-2 rounded-lg transition-all duration-300 ${viewMode === "grid"
                            ? "bg-white shadow-sm text-blue-600"
                            : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
                            }`}
                        title="Dạng lưới"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onViewModeChange("list")}
                        className={`p-2 rounded-lg transition-all duration-300 ${viewMode === "list"
                            ? "bg-white shadow-sm text-blue-600"
                            : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
                            }`}
                        title="Dạng danh sách"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
