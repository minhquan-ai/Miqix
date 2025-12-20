"use client";

import { useState } from "react";
import { Sparkles, Bot, Send, Loader2 } from "lucide-react";
import { AIPanelShell } from "./AIPanelShell";
import { motion } from "framer-motion";
import { MarkdownText } from "@/components/ui/MarkdownText";

interface ClassAIProps {
    onClose: () => void;
    user?: any;
    classes?: any[];
}

export function ClassAI({ onClose, user, classes }: ClassAIProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        const context = `
            [NGỮ CẢNH HỆ THỐNG: LỚP HỌC]
            - Người dùng: ${user?.name} (${user?.role})
            - Danh sách lớp hiện tại: ${classes?.map(c => `${c.name} (Môn: ${c.subject}, Mã: ${c.code})`).join(', ')}
        `;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `${context}\n\nCâu hỏi: ${userMsg}` }),
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <AIPanelShell onClose={onClose} title="Trợ lý Lớp học" loading={loading}>
            <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-white scrollbar-thin scrollbar-thumb-gray-100">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 opacity-90 pb-10">
                        <div className="w-20 h-20 bg-gradient-to-tr from-teal-50 to-white rounded-[2rem] flex items-center justify-center shadow-sm border border-teal-50/50">
                            <Bot className="w-8 h-8 text-teal-400" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold text-gray-800 text-base">Quản lý lớp học thông minh</p>
                            <p className="text-xs text-gray-500 max-w-[200px] mx-auto">Mình có thể giúp bạn điểm danh, tổng hợp điểm số.</p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-2 max-w-[280px]">
                            <QuickPromptBtn text="Điểm danh hôm nay" onClick={() => { setInput("Hôm nay lớp 10A1 vắng ai không?"); handleSend(); }} />
                            <QuickPromptBtn text="Học sinh cần chú ý" onClick={() => { setInput("Có học sinh nào điểm kém liên tục không?"); handleSend(); }} />
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center mr-3 mt-1 shrink-0 border border-teal-100">
                                <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                            </div>
                        )}
                        <div className={`max-w-[85%] px-4 py-3 rounded-[1.2rem] text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                            ? 'bg-gray-900 text-white rounded-tr-sm'
                            : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'
                            }`}>
                            <MarkdownText content={msg.content} />
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center mr-3 mt-1 shrink-0 border border-teal-100">
                            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                        </div>
                        <div className="bg-white border border-gray-100 px-4 py-3 rounded-[1.2rem] rounded-tl-sm shadow-sm flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                            <span className="text-xs text-gray-400 font-medium tracking-wide">Đang phân tích...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white">
                <div className="relative flex items-center gap-2 bg-gray-50 p-1.5 rounded-[1.5rem] border border-transparent focus-within:bg-white focus-within:border-gray-200 focus-within:shadow-sm transition-all duration-300">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        type="text"
                        placeholder="Hỏi về lớp học..."
                        className="flex-1 bg-transparent border-none text-sm px-4 py-2 focus:ring-0 text-gray-800 placeholder:text-gray-400 font-medium"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="p-2.5 bg-gray-900 text-white rounded-full shadow-md disabled:opacity-20 disabled:shadow-none hover:bg-black transition-all transform hover:scale-105 active:scale-95"
                    >
                        <Send className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </AIPanelShell>
    );
}

function QuickPromptBtn({ text, onClick }: { text: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="text-xs font-medium bg-white border border-gray-200 px-4 py-2 rounded-full text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
        >
            {text}
        </button>
    )
}
