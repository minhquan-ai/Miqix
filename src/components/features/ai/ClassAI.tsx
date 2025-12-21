"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Bot, ArrowRight, Loader2 } from "lucide-react";
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

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Cuộn xuống đáy TRONG container AI, không cuộn window
    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

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

    return (
        <AIPanelShell onClose={onClose} title="Trợ lý Lớp học" loading={loading}>
            {/* Container: flex flex-col h-full để empty state có thể căn giữa */}
            <div
                ref={messagesContainerRef}
                className={`flex-1 flex flex-col p-4 space-y-6 bg-white scrollbar-thin scrollbar-thumb-gray-100 ${messages.length > 0 ? 'overflow-y-auto' : 'overflow-hidden'}`}
            >
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-90">
                        {/* Spacer reduced to better center content */}
                        <div className="h-4 shrink-0" />

                        <div className="relative">
                            <motion.div
                                animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="w-24 h-24 bg-gradient-to-tr from-teal-50 to-white rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-teal-100/50 border border-white relative z-10"
                            >
                                <Bot className="w-10 h-10 text-teal-500" />
                            </motion.div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-50">
                                <Sparkles className="w-5 h-5 text-emerald-400" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="font-extrabold text-gray-900 text-xl tracking-tight">Chào bạn, mình là Ergonix AI!</h2>
                            <p className="text-gray-400 text-sm font-medium">
                                {user?.role === 'student'
                                    ? "Bạn cần hỗ trợ gì cho bài tập và lớp học hôm nay?"
                                    : "Quản lý lớp học và theo dõi học sinh hiệu quả hơn"}
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-2 max-w-[280px]">
                            {user?.role === 'student' ? (
                                <>
                                    <QuickPromptBtn text="Bài tập sắp tới" onClick={() => setInput("Tôi có bài tập nào sắp đến hạn không?")} />
                                    <QuickPromptBtn text="Điểm số gần đây" onClick={() => setInput("Tổng hợp kết quả học tập gần đây của tôi?")} />
                                </>
                            ) : (
                                <>
                                    <QuickPromptBtn text="Điểm danh hôm nay" onClick={() => setInput("Hôm nay lớp 10A1 vắng ai không?")} />
                                    <QuickPromptBtn text="Học sinh cần chú ý" onClick={() => setInput("Có học sinh nào điểm kém liên tục không?")} />
                                </>
                            )}
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center mr-3 mt-0.5 shrink-0 border border-teal-100">
                                <Sparkles className="w-4 h-4 text-teal-500" />
                            </div>
                        )}
                        <div
                            className={`max-w-[85%] px-4 py-3 rounded-[1.3rem] text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-teal-600 text-white font-semibold' : 'bg-white border border-gray-100 text-gray-700'}`}
                            style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' } : {}}
                        >
                            <MarkdownText content={msg.content} />
                        </div>
                    </motion.div>
                ))}

                {loading && (
                    <div className="flex justify-start items-start">
                        <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center mr-3 mt-0.5 shrink-0 border border-teal-100">
                            <Sparkles className="w-4 h-4 text-teal-500" />
                        </div>
                        <div className="bg-white border border-gray-100 px-5 py-3 rounded-[1.3rem] flex items-center gap-1.5 min-w-[60px] justify-center">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-1.5 h-1.5 bg-teal-400 rounded-full"
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{
                                        duration: 0.8,
                                        repeat: Infinity,
                                        delay: i * 0.15,
                                        ease: "easeInOut"
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Specialized Capsule Input Area - Styled matched with ScheduleAI */}
            <div className="pt-3 px-4 bg-white/50 backdrop-blur-sm pb-8">
                <div className="bg-white rounded-[2rem] border border-gray-200 shadow-xl px-2 py-2 transition-all focus-within:ring-2 focus-within:ring-teal-100 focus-within:border-teal-200 relative">

                    {/* Main Input Part */}
                    <div className="px-3 pt-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            disabled={loading}
                            placeholder="Hỏi về lớp học..."
                            className="w-full bg-transparent border-none text-[16px] py-1 focus:ring-0 focus:outline-none text-gray-800 placeholder:text-gray-400 font-medium resize-none overflow-y-auto scrollbar-none leading-relaxed"
                            rows={2}
                            style={{ height: 'auto', minHeight: '40px', maxHeight: '150px' }}
                        />
                    </div>

                    {/* Bottom Toolbar Area - Matched with ScheduleAI */}
                    <div className="flex items-center justify-between px-1 pb-1">
                        <div className="flex items-center gap-2 pl-1">
                            {/* Mode Button Placeholder for design symmetry */}
                            <button
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-100 bg-gray-50/50 text-gray-400 cursor-default"
                            >
                                <Bot className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-bold text-gray-600">Bình thường</span>
                            </button>
                        </div>

                        {/* Black Circular Send Button */}
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 transform ${!input.trim() || loading ? 'bg-gray-100 text-gray-300' : 'bg-black text-white hover:scale-105 active:scale-95 shadow-lg'}`}
                        >
                            <ArrowRight className="w-5 h-5" strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>
        </AIPanelShell>
    );
}

function QuickPromptBtn({ text, onClick }: { text: string, onClick: () => void }) {
    return (
        <button onClick={onClick} className="text-xs font-bold bg-white border border-gray-200 px-4 py-2 rounded-full text-gray-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-100 transition-all shadow-sm active:scale-95">{text}</button>
    );
}
