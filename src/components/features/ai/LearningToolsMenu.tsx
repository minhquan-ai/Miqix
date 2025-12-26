"use client";

import { BrainCircuit, FileText, Target, PenTool } from "lucide-react";
import { motion } from "framer-motion";

interface LearningToolsMenuProps {
    onSelectTool: (tool: string) => void;
}

export function LearningToolsMenu({ onSelectTool }: LearningToolsMenuProps) {
    const tools = [
        {
            id: "solver",
            label: "Giải bài tập",
            desc: "Hướng dẫn giải bài từng bước",
            icon: BrainCircuit,
            color: "text-blue-500",
            bg: "bg-blue-50",
            border: "border-blue-100"
        },
        {
            id: "summary",
            label: "Tóm tắt",
            desc: "Tóm tắt nội dung chính bài này",
            icon: FileText,
            color: "text-emerald-500",
            bg: "bg-emerald-50",
            border: "border-emerald-100"
        },
        {
            id: "exam",
            label: "Ôn thi",
            desc: "Luyện tập và kiểm tra kiến thức",
            icon: Target,
            color: "text-purple-500",
            bg: "bg-purple-50",
            border: "border-purple-100"
        },
        {
            id: "writing",
            label: "Sáng tạo",
            desc: "Hỗ trợ diễn đạt và trau chuốt",
            icon: PenTool,
            color: "text-orange-500",
            bg: "bg-orange-50",
            border: "border-orange-100"
        }
    ];

    return (
        <div className="grid grid-cols-2 gap-3 px-1 py-2">
            {tools.map((tool) => (
                <button
                    key={tool.id}
                    onClick={() => onSelectTool(tool.id)}
                    className={`flex flex-col items-start p-3 rounded-2xl border ${tool.border} ${tool.bg} hover:brightness-95 transition-all text-left group active:scale-95`}
                >
                    <div className={`p-2 rounded-xl bg-white mb-2 shadow-sm ${tool.color}`}>
                        <tool.icon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-gray-800 text-sm">{tool.label}</span>
                    <span className="text-[10px] text-gray-500 leading-tight mt-1 font-medium">{tool.desc}</span>
                </button>
            ))}
        </div>
    );
}
