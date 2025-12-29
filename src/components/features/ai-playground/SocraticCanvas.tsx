"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, AlertCircle, CheckCircle2, Bot, User, ArrowRight, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";

export interface SocraticStep {
    type: "socratic_step";
    status: "question" | "correct_and_next" | "incorrect_hint" | "completion";
    question: string;
    context?: string;
    step_number: number;
    is_final?: boolean;
}

export interface SocraticHistoryItem {
    step: SocraticStep;
    userAnswer?: string;
}

interface SocraticCanvasProps {
    currentStep: SocraticStep | null;
    history: SocraticHistoryItem[];
    onSendAnswer: (answer: string) => void;
    isLoading: boolean;
}

export function SocraticCanvas({ currentStep, history, onSendAnswer, isLoading }: SocraticCanvasProps) {
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, currentStep]);

    // Focus input on new step
    useEffect(() => {
        if (!isLoading && currentStep?.status === "question") {
            inputRef.current?.focus();
        }
    }, [isLoading, currentStep]);

    const handleSubmit = () => {
        if (!input.trim() || isLoading) return;
        onSendAnswer(input);
        setInput("");
    };

    const isSuccess = currentStep?.status === "correct_and_next" || currentStep?.status === "completion";
    const isError = currentStep?.status === "incorrect_hint";

    return (
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden font-sans">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            />

            {/* Header */}
            <div className="shrink-0 px-8 py-5 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-lg shadow-indigo-100/50 flex items-center justify-center border border-indigo-50">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-800 text-lg">Gia sư Socratic</h2>
                        <p className="text-xs text-gray-500 font-medium">Học tập tương tác từng bước</p>
                    </div>
                </div>

                {currentStep && (
                    <div className="px-3 py-1 bg-white border border-indigo-100 rounded-full shadow-sm text-xs font-bold text-indigo-600">
                        Bước {currentStep.step_number}
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pb-32"
            >
                <div className="max-w-3xl mx-auto space-y-8">
                    {/* Welcome State if empty */}
                    {!currentStep && history.length === 0 && (
                        <div className="text-center py-20 opacity-60">
                            <Bot className="w-16 h-16 mx-auto mb-4 text-indigo-300" />
                            <p className="text-gray-500 font-medium">Đặt câu hỏi để bắt đầu phiên hướng dẫn...</p>
                        </div>
                    )}

                    {/* History Items */}
                    {history.map((item, idx) => (
                        <div key={idx} className="space-y-4 opacity-70 hover:opacity-100 transition-opacity duration-300">
                            {/* AI Question History */}
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-white border border-indigo-100 flex items-center justify-center shadow-sm shrink-0 mt-1">
                                    <Bot className="w-4 h-4 text-indigo-500" />
                                </div>
                                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm text-gray-700 prose prose-sm max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {item.step.question}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            {/* User Answer History */}
                            {item.userAnswer && (
                                <div className="flex gap-4 flex-row-reverse">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shadow-sm shrink-0 mt-1">
                                        <User className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div className="bg-indigo-50 p-3 px-5 rounded-2xl rounded-tr-none text-indigo-900 border border-indigo-100 font-medium">
                                        {item.userAnswer}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Current Step (Active) */}
                    {currentStep && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="space-y-6 relative"
                        >
                            {/* The Question Card */}
                            <div className={cn(
                                "flex flex-col gap-4 p-6 md:p-8 rounded-[2rem] shadow-xl border-2 transition-all duration-500 bg-white relative overflow-hidden",
                                isSuccess ? "border-emerald-100 shadow-emerald-100/50" :
                                    isError ? "border-amber-100 shadow-amber-100/50" :
                                        "border-indigo-100 shadow-indigo-100/50"
                            )}>
                                {/* Status Indicator */}
                                <div className="flex items-center gap-2 mb-2">
                                    {isSuccess ? (
                                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                            <CheckCircle2 className="w-4 h-4" /> Chính xác
                                        </div>
                                    ) : isError ? (
                                        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                            <AlertCircle className="w-4 h-4" /> Cần xem lại
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                            <Bot className="w-4 h-4" /> Câu hỏi
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="prose prose-lg max-w-none text-gray-800 font-medium leading-relaxed
                                    prose-headings:font-bold prose-headings:text-indigo-900
                                    prose-p:text-gray-800
                                    prose-strong:text-indigo-700
                                    [&_.katex]:text-xl"
                                >
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {currentStep.question}
                                    </ReactMarkdown>
                                </div>

                                {/* Confetti Effect for Success (Simple CSS) */}
                                {isSuccess && (
                                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-white border border-indigo-100 flex items-center justify-center shadow-sm shrink-0">
                                <RefreshCcw className="w-4 h-4 text-indigo-500 animate-spin" />
                            </div>
                            <div className="bg-white/50 p-4 rounded-2xl border border-white shadow-sm w-fit">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Input Area (Only if not complete) */}
            {currentStep?.status !== 'completion' && (
                <div className="shrink-0 p-4 md:p-8 pt-0 bg-transparent relative z-20 pointer-events-none">
                    <div className="max-w-3xl mx-auto pointer-events-auto">
                        <div className="bg-white rounded-[1.5rem] shadow-2xl shadow-indigo-200/40 p-2 pl-6 flex items-center gap-4 border border-indigo-50 transition-all focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                placeholder="Nhập câu trả lời của bạn..."
                                disabled={isLoading}
                                className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder:text-gray-400 font-medium py-3"
                            />
                            <button
                                onClick={handleSubmit}
                                disabled={!input.trim() || isLoading}
                                className={cn(
                                    "px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-300",
                                    input.trim() && !isLoading
                                        ? "bg-black text-white hover:scale-105 active:scale-95 shadow-lg"
                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                )}
                            >
                                {isLoading ? "Đang kiểm tra..." : "Trả lời"}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-center mt-3 text-xs text-slate-400 font-medium tracking-wide">
                            Gõ "Gợi ý" nếu bạn cần thêm trợ giúp
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
