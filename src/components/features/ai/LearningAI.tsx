"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Bot, ArrowRight, BookOpen, GraduationCap, ChevronDown } from "lucide-react";
import { AIPanelShell, saveToAIHistory } from "./AIPanelShell";
import { motion } from "framer-motion";
import { MarkdownText } from "@/components/ui/MarkdownText";
import { LearningToolsMenu } from "./LearningToolsMenu";

interface LearningAIProps {
    onClose: () => void;
    user?: any;
    assignmentTitle?: string;
    assignmentContext?: string; // Description Content
    submissionContext?: string; // Current student draft
}

export function LearningAI({ onClose, user, assignmentTitle, assignmentContext, submissionContext }: LearningAIProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'solver' | 'standard' | 'summary' | 'exam' | 'writing'>('solver');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSend = async (overrideInput?: string, overrideMode?: string) => {
        const textToSend = overrideInput || input;
        const modeToUse = overrideMode || mode;

        if (!textToSend.trim()) return;

        setInput("");
        setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
        setLoading(true);

        const systemContext = `
            [VAI TRÒ: TRỢ LÝ HỌC TẬP (MIQIX LEARNING ASSISTANT)]
            - Bạn KHÔNG PHẢI là máy giải bài tập. KHÔNG bao giờ đưa ra đáp án trực tiếp cho bài tập về nhà.
            - Chế độ hiện tại: ${modeToUse.toUpperCase()}
            - Tên bài tập: ${assignmentTitle}
            - Nội dung đề bài: ${assignmentContext}
            - Bài làm hiện tại của học sinh: ${submissionContext}
            
            [QUY TẮC CỐT LÕI - SOLVER MODE]
            1. Nếu học sinh hỏi đáp án -> Hãy hỏi ngược lại 1 câu hỏi gợi mở để họ tự tìm ra (Socratic).
            2. Chia nhỏ vấn đề thành các bước.
            3. Chỉ cung cấp công thức hoặc lý thuyết liên quan, không tính toán hộ.
            
            [QUY TẮC - SUMMARY MODE]
            1. Tóm tắt ngắn gọn đề bài hoặc bản nháp của học sinh.
            2. Lọc ra các ý chính cần nắm vững.
            
            [QUY TẮC - EXAM MODE]
            1. Tạo câu hỏi luyện tập dựa trên đề bài.
            2. Giúp học sinh kiểm tra mức độ hiểu bài.

            [QUY TẮC - WRITING MODE]
            1. Hỗ trợ trau chuốt câu từ trong bài làm.
            2. Gợi ý các cách diễn đạt sáng tạo và chuyên nghiệp hơn.
        `;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `${systemContext}\n\nCâu hỏi học sinh: ${textToSend}`,
                    previousMessages: messages.slice(-10) // Gửi 10 tin nhắn gần nhất để giữ context
                }),
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.reply
            }]);
        } catch (error) {
            console.error("AI Chat Error:", error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Xin lỗi, mình đang gặp chút sự cố kết nối. Bạn thử lại nhé!"
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleToolSelect = (toolId: string) => {
        let prompt = "";
        let newMode = "general";

        switch (toolId) {
            case "solver":
                prompt = "Tôi đang gặp khó khăn ở bài này, bạn có thể gợi ý cho tôi hướng giải quyết không?";
                newMode = "solver";
                setMode("solver");
                break;
            case "summary":
                prompt = "Hãy tóm tắt lại các yêu cầu chính của đề bài và những gì tôi đã làm được.";
                newMode = "summary";
                setMode("summary");
                break;
            case "exam":
                prompt = "Hãy tạo cho tôi một vài câu hỏi luyện tập để kiểm tra xem tôi có hiểu bài này không.";
                newMode = "exam";
                setMode("exam");
                break;
            case "writing":
                prompt = "Hãy giúp tôi trau chuốt lại cách diễn đạt trong bài làm của mình.";
                newMode = "writing";
                setMode("writing");
                break;
        }

        handleSend(prompt, newMode);
    };

    const handleClose = () => {
        // Save conversation to shared AI history before closing
        if (messages.length > 0) {
            saveToAIHistory("Học tập", messages);
        }
        onClose();
    };

    return (
        <AIPanelShell onClose={handleClose} title="Trợ lý Học tập" loading={loading} sourceContext="learning">
            <div
                ref={messagesContainerRef}
                className={`flex-1 flex flex-col px-4 py-4 space-y-6 bg-slate-50/50 scrollbar-thin scrollbar-thumb-gray-200 ${messages.length > 0 ? 'overflow-y-auto' : 'overflow-hidden'}`}
            >
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 pb-20">
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-lg border border-indigo-50"
                            >
                                <GraduationCap className="w-10 h-10 text-indigo-600" />
                            </motion.div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-50">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h2 className="font-bold text-gray-900 text-lg">Học chủ động cùng AI</h2>
                            <p className="text-gray-500 text-sm max-w-[250px] mx-auto">
                                Mình sẽ không giải bài tập đâu, nhưng mình sẽ giúp bạn tự tìm ra lời giải! 🚀
                            </p>
                        </div>

                        <div className="w-full max-w-sm">
                            <LearningToolsMenu onSelectTool={handleToolSelect} />
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-3 mt-0.5 shrink-0 border border-gray-100 shadow-sm">
                                <Bot className="w-4 h-4 text-indigo-600" />
                            </div>
                        )}
                        <div
                            className={`max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white font-medium' : 'bg-white border border-gray-100 text-gray-700'}`}
                        >
                            <MarkdownText content={msg.content} />
                        </div>
                    </motion.div>
                ))}

                {loading && (
                    <div className="flex justify-start items-start">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-3 mt-0.5 shrink-0 border border-gray-100 shadow-sm">
                            <Bot className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl flex items-center gap-1.5 shadow-sm">
                            <span className="text-xs text-gray-400 font-medium">Đang suy nghĩ...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-4 pt-3 pb-8 bg-white border-t border-gray-100">
                <div className="bg-gray-50 rounded-[1.5rem] border border-gray-200 px-1 py-1 transition-all focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-200 focus-within:bg-white relative flex gap-2 items-end">

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        disabled={loading}
                        placeholder={mode === 'solver' ? "Hỏi để được gợi ý..." : "Nhập câu hỏi..."}
                        className="flex-1 bg-transparent border-none text-[15px] py-3 pl-4 focus:ring-0 focus:outline-none text-gray-800 placeholder:text-gray-400 font-medium resize-none overflow-y-auto scrollbar-none leading-relaxed max-h-[120px]"
                        rows={1}
                        style={{ minHeight: '44px' }}
                    />

                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || loading}
                        className={`w-10 h-10 mb-0.5 mr-0.5 flex items-center justify-center rounded-full transition-all duration-300 shrink-0 ${!input.trim() || loading ? 'bg-gray-200 text-gray-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'}`}
                    >
                        <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                </div>

                <div className="flex justify-between items-center px-2 mt-2">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${mode === 'solver' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                            {mode === 'solver' ? 'Solver Mode' : mode.toUpperCase() + ' Mode'}
                        </span>
                    </div>
                    <button
                        onClick={() => setMessages([])}
                        className="text-[11px] font-semibold text-gray-400 hover:text-red-500 transition-colors"
                    >
                        Xóa lịch sử
                    </button>
                </div>
            </div>
        </AIPanelShell>
    );
}
