"use client";

import { useState, useEffect } from "react";
import { X, Clock, Target, BookOpen, Play, Sparkles, Timer, Brain, Coffee } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FocusTimer } from "./FocusTimer";
import { cn } from "@/lib/utils";

interface FocusSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSessionComplete?: (data: { duration: number; subject?: string; type: string }) => void;
    suggestedSubject?: string;
}

const DURATION_PRESETS = [
    { label: "15 phút", value: 15, icon: Coffee, description: "Làm nhanh" },
    { label: "25 phút", value: 25, icon: Timer, description: "Pomodoro chuẩn" },
    { label: "45 phút", value: 45, icon: Brain, description: "Sâu & tập trung" },
    { label: "60 phút", value: 60, icon: Target, description: "Marathon" },
];

const SESSION_TYPES = [
    { label: "Ôn bài", value: "review", color: "bg-blue-500" },
    { label: "Làm bài tập", value: "homework", color: "bg-orange-500" },
    { label: "Đọc sách", value: "reading", color: "bg-emerald-500" },
    { label: "Ghi chép", value: "notes", color: "bg-purple-500" },
];

export function FocusSessionModal({ isOpen, onClose, onSessionComplete, suggestedSubject }: FocusSessionModalProps) {
    const [step, setStep] = useState<"setup" | "focus">("setup");
    const [selectedDuration, setSelectedDuration] = useState(25);
    const [selectedType, setSelectedType] = useState("review");
    const [subject, setSubject] = useState(suggestedSubject || "");
    const [goal, setGoal] = useState("");

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep("setup");
            setSelectedDuration(25);
            setSelectedType("review");
            setSubject(suggestedSubject || "");
            setGoal("");
        }
    }, [isOpen, suggestedSubject]);

    const handleStartFocus = () => {
        setStep("focus");
    };

    const handleComplete = (timeSpent: number) => {
        onSessionComplete?.({
            duration: timeSpent,
            subject: subject || undefined,
            type: selectedType
        });
        // Show completion message before closing
        setTimeout(() => {
            onClose();
        }, 2000);
    };

    const handleStop = (timeSpent: number) => {
        if (timeSpent > 60) { // Only save if studied more than 1 minute
            onSessionComplete?.({
                duration: timeSpent,
                subject: subject || undefined,
                type: selectedType
            });
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden"
                >
                    {step === "setup" ? (
                        <>
                            {/* Header */}
                            <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 text-white">
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-2xl font-bold">Bắt đầu Tập trung</h2>
                                </div>
                                <p className="text-white/80 text-sm">
                                    Chọn thời gian và bắt đầu học tập hiệu quả
                                </p>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Duration Selection */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <Timer className="w-4 h-4 text-indigo-500" />
                                        Thời gian tập trung
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {DURATION_PRESETS.map((preset) => {
                                            const Icon = preset.icon;
                                            return (
                                                <button
                                                    key={preset.value}
                                                    onClick={() => setSelectedDuration(preset.value)}
                                                    className={cn(
                                                        "p-4 rounded-2xl border-2 transition-all text-left",
                                                        selectedDuration === preset.value
                                                            ? "border-indigo-500 bg-indigo-50"
                                                            : "border-gray-100 hover:border-gray-200 bg-gray-50/50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "p-2 rounded-xl",
                                                            selectedDuration === preset.value
                                                                ? "bg-indigo-500 text-white"
                                                                : "bg-gray-100 text-gray-500"
                                                        )}>
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800">{preset.label}</p>
                                                            <p className="text-xs text-gray-500">{preset.description}</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Session Type */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <Target className="w-4 h-4 text-indigo-500" />
                                        Loại hoạt động
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {SESSION_TYPES.map((type) => (
                                            <button
                                                key={type.value}
                                                onClick={() => setSelectedType(type.value)}
                                                className={cn(
                                                    "px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2",
                                                    selectedType === type.value
                                                        ? "bg-gray-900 text-white"
                                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                )}
                                            >
                                                <div className={cn("w-2 h-2 rounded-full", type.color)} />
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Subject Input */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-indigo-500" />
                                        Môn học (tùy chọn)
                                    </label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="VD: Toán, Văn, Anh..."
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all text-gray-800"
                                    />
                                </div>

                                {/* Goal Input */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-indigo-500" />
                                        Mục tiêu buổi học (tùy chọn)
                                    </label>
                                    <input
                                        type="text"
                                        value={goal}
                                        onChange={(e) => setGoal(e.target.value)}
                                        placeholder="VD: Hoàn thành 5 bài tập tích phân..."
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all text-gray-800"
                                    />
                                </div>

                                {/* Start Button */}
                                <button
                                    onClick={handleStartFocus}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3"
                                >
                                    <Play className="w-5 h-5" />
                                    Bắt đầu {selectedDuration} phút tập trung
                                </button>
                            </div>
                        </>
                    ) : (
                        /* Focus Mode Active */
                        <div className="p-6">
                            {/* Goal reminder */}
                            {(subject || goal) && (
                                <div className="mb-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    {subject && (
                                        <p className="text-sm font-bold text-indigo-700 mb-1">
                                            📚 {subject}
                                        </p>
                                    )}
                                    {goal && (
                                        <p className="text-xs text-indigo-600">
                                            🎯 {goal}
                                        </p>
                                    )}
                                </div>
                            )}

                            <FocusTimer
                                initialDuration={selectedDuration}
                                onComplete={handleComplete}
                                onStop={handleStop}
                            />
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
