"use client";

import { RubricItem } from "@/types";
import { Plus, Trash2, Sparkles } from "lucide-react";

interface RubricBuilderProps {
    value: RubricItem[];
    onChange: (rubric: RubricItem[]) => void;
}

export function RubricBuilder({ value, onChange }: RubricBuilderProps) {
    const handleAdd = () => {
        const newItem: RubricItem = {
            id: Math.random().toString(36).substr(2, 9),
            criteria: "",
            description: "",
            maxPoints: 1,
        };
        onChange([...value, newItem]);
    };

    const handleRemove = (id: string) => {
        onChange(value.filter((item) => item.id !== id));
    };

    const handleChange = (id: string, field: keyof RubricItem, val: string | number) => {
        onChange(
            value.map((item) =>
                item.id === id ? { ...item, [field]: val } : item
            )
        );
    };

    const handleAIGenerate = () => {
        // Use predefined template rubric
        // TODO: Connect to AI service when generateRubric is implemented
        const templateRubric: RubricItem[] = [
            {
                id: "r1",
                criteria: "Nội dung & Ý tưởng",
                description: "Bài làm thể hiện sự hiểu biết sâu sắc, ý tưởng sáng tạo và phong phú.",
                maxPoints: 4,
            },
            {
                id: "r2",
                criteria: "Cấu trúc & Lập luận",
                description: "Bố cục rõ ràng, lập luận chặt chẽ, logic và có sức thuyết phục.",
                maxPoints: 3,
            },
            {
                id: "r3",
                criteria: "Ngôn ngữ & Trình bày",
                description: "Văn phong mạch lạc, không sai chính tả, trình bày đẹp mắt.",
                maxPoints: 3,
            },
        ];
        onChange(templateRubric);
    };

    const totalPoints = value.reduce((sum, item) => sum + item.maxPoints, 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tiêu chí chấm điểm (Rubric)
                </h3>
                <button
                    type="button"
                    onClick={handleAIGenerate}
                    className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium bg-purple-50 px-2 py-1 rounded-md border border-purple-100"
                >
                    <Sparkles className="w-3 h-3" />
                    AI Gợi ý
                </button>
            </div>

            <div className="space-y-3">
                {value.map((item, index) => (
                    <div
                        key={item.id}
                        className="flex gap-3 items-start p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 group"
                    >
                        <div className="flex-1 space-y-2">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Tiêu chí (VD: Sáng tạo)"
                                    value={item.criteria}
                                    onChange={(e) => handleChange(item.id, "criteria", e.target.value)}
                                    className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.5"
                                        value={item.maxPoints}
                                        onChange={(e) => handleChange(item.id, "maxPoints", parseFloat(e.target.value) || 0)}
                                        className="w-16 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-right focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                    <span className="text-xs text-gray-500">điểm</span>
                                </div>
                            </div>
                            <textarea
                                placeholder="Mô tả chi tiết tiêu chí..."
                                value={item.description}
                                onChange={(e) => handleChange(item.id, "description", e.target.value)}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-16"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => handleRemove(item.id)}
                            className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                    type="button"
                    onClick={handleAdd}
                    className="text-sm flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Thêm tiêu chí
                </button>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tổng điểm: <span className={totalPoints !== 10 ? "text-orange-500" : "text-green-600"}>{totalPoints}</span>
                </div>
            </div>
        </div>
    );
}
