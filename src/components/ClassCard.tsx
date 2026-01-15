"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreVertical, Users, ArrowRight, Pin, Trash2, Settings } from "lucide-react";
import { Class } from "@/types";
import { getCurrentUserAction, deleteClassAction, togglePinClassAction } from "@/lib/actions";
import { useRouter } from "next/navigation";

interface ClassCardProps {
    classData: Class;
    role: 'teacher' | 'student';
    onRefresh?: () => void; // Callback to refresh parent after pin/unpin
}

export default function ClassCard({ classData, role, onRefresh }: ClassCardProps) {
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);
    const [isPinned, setIsPinned] = useState((classData as any).isPinned || false);

    // Color Palette Mapping
    const COLORS: Record<string, { bg: string, text: string, border: string, bar: string, ring: string }> = {
        blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", bar: "bg-blue-600", ring: "ring-blue-500" },
        indigo: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", bar: "bg-indigo-600", ring: "ring-indigo-500" },
        emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", bar: "bg-emerald-600", ring: "ring-emerald-500" },
        rose: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", bar: "bg-rose-600", ring: "ring-rose-500" },
        amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", bar: "bg-amber-600", ring: "ring-amber-500" },
        cyan: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", bar: "bg-cyan-600", ring: "ring-cyan-500" },
        violet: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", bar: "bg-violet-600", ring: "ring-violet-500" },
        teal: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", bar: "bg-teal-600", ring: "ring-teal-500" },
    };

    // Fallback to blue if color is invalid or missing
    const theme = COLORS[(classData as any).color] || COLORS.blue;

    const handlePin = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const user = await getCurrentUserAction();
            if (user) {
                await togglePinClassAction(classData.id);
                setIsPinned(!isPinned);
                setShowMenu(false);
                // Refresh parent to move card between sections
                if (onRefresh) onRefresh();
            }
        } catch (error) {
            console.error("Failed to pin class", error);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("Bạn có chắc chắn muốn xóa lớp học này? Hành động này không thể hoàn tác.")) return;

        try {
            const user = await getCurrentUserAction();
            if (user) {
                await deleteClassAction(classData.id);
                // Router refresh handled by action revalidate
            }
        } catch (error) {
            console.error("Failed to delete class", error);
        }
    };

    return (
        <div className={`group relative bg-card rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden flex flex-col h-full
            ${theme.border}
        `}>
            {/* Top Bar */}
            <div className={`h-2 w-full ${theme.bar}`} />

            <div className="p-5 flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-start mb-4 relative">
                    <div className="space-y-1">
                        {/* Badges */}
                        <div className="flex gap-2 mb-2">
                            {(classData as any).classType === 'HOMEROOM' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-600">
                                    Chủ nhiệm
                                </span>
                            )}
                            {(classData as any).classType === 'EXTRA' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-600">
                                    Học thêm
                                </span>
                            )}
                            {isPinned && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-700 flex items-center gap-1">
                                    <Pin className="w-3 h-3" /> Ghim
                                </span>
                            )}
                        </div>

                        <h3 className={`font-bold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors ${theme.text}`}>
                            {classData.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                            {classData.role === 'main' && classData.stream ? (
                                <span className="mr-1 font-medium text-foreground/80">{classData.stream} •</span>
                            ) : null}
                            {classData.subject}
                        </p>
                    </div>

                    {/* Menu Button */}
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                setShowMenu(!showMenu);
                            }}
                            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>

                        {/* Dropdown Menu */}
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={(e) => { e.preventDefault(); setShowMenu(false); }} />
                                <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-1 space-y-0.5">
                                        <button
                                            onClick={handlePin}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors text-left"
                                        >
                                            <Pin className="w-4 h-4 text-muted-foreground" />
                                            <span>{isPinned ? 'Bỏ ghim' : 'Ghim lớp học'}</span>
                                        </button>
                                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors text-left">
                                            <Settings className="w-4 h-4 text-muted-foreground" />
                                            <span>Cài đặt lớp</span>
                                        </button>
                                        {role === 'teacher' && (
                                            <>
                                                <div className="h-px bg-border my-1" />
                                                <button
                                                    onClick={handleDelete}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span>Xóa lớp học</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-1">
                    {classData.description || "Chưa có mô tả cho lớp học này."}
                </p>

                {/* Footer Info */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{(classData as any).maxStudents || 45} học sinh</span>
                    </div>

                    {classData.id !== 'preview' && (
                        <Link href={`/dashboard/classes/${classData.id}`}>
                            <button className={`p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-sm ${theme.bg} ${theme.text}`}>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
