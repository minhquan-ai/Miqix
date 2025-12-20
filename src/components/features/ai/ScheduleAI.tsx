"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, MessageSquare, ArrowRight, Loader2, Bot, Send } from "lucide-react";
import { analyzeScheduleAIAction, createPersonalEventAction, deletePersonalEventAction } from "@/lib/schedule-actions";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { AIPanelShell } from "./AIPanelShell";
import { MarkdownText } from "@/components/ui/MarkdownText";

interface ScheduleAIProps {
    onClose: () => void;
    weekStartStr: string;
    onEventAdded: () => void;
}

interface AIAction {
    type: 'delete_personal';
    eventId: string;
    title: string;
}

interface AIResponseOption {
    label: string;
    description: string;
    events: Array<{
        title: string;
        start: string;
        end: string;
    }>;
}

export function ScheduleAI({ onClose, weekStartStr, onEventAdded }: ScheduleAIProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    // UI state for the latest AI options/actions to display
    const [currentOptions, setCurrentOptions] = useState<AIResponseOption[] | null>(null);
    const [currentActions, setCurrentActions] = useState<AIAction[] | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        setCurrentOptions(null); // Clear previous options
        setCurrentActions(null); // Clear previous actions

        try {
            const result = await analyzeScheduleAIAction(weekStartStr, userMsg, messages);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: result.message || "Mình đã tìm thấy một vài lựa chọn cho bạn:"
            }]);

            if (result.options && result.options.length > 0) {
                setCurrentOptions(result.options);
            }

            if (result.actions && result.actions.length > 0) {
                setCurrentActions(result.actions);
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Xin lỗi, mình gặp chút sự cố khi phân tích lịch. Bạn thử lại nhé!' }]);
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

    const handleAcceptOption = async (option: AIResponseOption) => {
        try {
            // Add all events in this option
            for (const evt of option.events) {
                await createPersonalEventAction({
                    title: evt.title,
                    description: `Được AI thêm từ lựa chọn: ${option.label}`,
                    start: evt.start,
                    end: evt.end,
                    color: 'emerald'
                });
            }

            // Delay to ensure DB propagation and UI refresh
            setTimeout(() => {
                onEventAdded();
            }, 800);

            // Remove only this option from the list, allow others to remain (User Request: Multi-select support)
            setCurrentOptions(prev => prev ? prev.filter(o => o !== option) : null);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Đã thêm thành công: **${option.label}**. Bạn có muốn thêm khung giờ nào khác không?`
            }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Có lỗi xảy ra khi thêm lịch. Bạn thử lại xem sao." }]);
        }
    };

    const handleExecuteAction = async (action: AIAction) => {
        try {
            if (action.type === 'delete_personal') {
                const result = await deletePersonalEventAction(action.eventId);

                if (result.count > 0) {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: `Đã xóa sự kiện "${action.title}" khỏi lịch của bạn.`
                    }]);
                } else {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: `Mình không tìm thấy sự kiện "${action.title}" để xóa. Có thể nó đã được xóa trước đó rồi.`
                    }]);
                }
            }

            // Delay to ensure DB propagation and UI refresh
            setTimeout(() => {
                onEventAdded();
            }, 800);

            // Remove only this action from the list
            setCurrentActions(prev => prev ? prev.filter(a => a !== action) : null);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Không thể thực hiện hành động này. Thử lại sau nhé." }]);
        }
    };

    return (
        <AIPanelShell onClose={onClose} title="Trợ lý Lịch biểu" loading={loading}>
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-white scrollbar-thin scrollbar-thumb-gray-100">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 opacity-90 pb-10">
                        <div className="w-20 h-20 bg-gradient-to-tr from-indigo-50 to-white rounded-[2rem] flex items-center justify-center shadow-sm border border-indigo-50/50">
                            <Bot className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold text-gray-800 text-base">Hôm nay bạn cần gì?</p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-2 max-w-[280px]">
                            <QuickPromptBtn text="Sắp xếp 3 tiết Toán" onClick={() => { setInput("Tìm giúp mình 3 tiếng ôn Toán"); handleSend(); }} />
                            <QuickPromptBtn text="Lên lịch nghỉ ngơi" onClick={() => { setInput("Tuần này bận quá, xếp lịch nghỉ ngơi"); handleSend(); }} />
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center mr-3 mt-1 shrink-0 border border-indigo-100">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
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
                        <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center mr-3 mt-1 shrink-0 border border-indigo-100">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        </div>
                        <div className="bg-white border border-gray-100 px-4 py-3 rounded-[1.2rem] rounded-tl-sm shadow-sm flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                            <span className="text-xs text-gray-400 font-medium tracking-wide">Đang suy nghĩ...</span>
                        </div>
                    </div>
                )}

                {/* Options Display */}
                {currentOptions && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="pl-10 space-y-3"
                    >
                        <div className="grid grid-cols-1 gap-2">
                            {currentOptions
                                .filter(opt => opt.label && opt.events && opt.events.length > 0)
                                .map((option, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group relative overflow-hidden"
                                        onClick={() => handleAcceptOption(option)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-sm">{option.label}</h4>
                                                <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                                            </div>
                                            <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </div>
                                        </div>

                                        {option.events && option.events.length > 0 && (
                                            <div className="space-y-1 mt-3 pt-3 border-t border-dashed border-gray-100">
                                                {option.events.map((evt, eIdx) => (
                                                    <div key={eIdx} className="flex items-center gap-2 text-xs text-gray-600">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                                        <span className="font-medium">{evt.title}</span>
                                                        <span className="text-gray-400 ml-auto font-mono text-[10px]">
                                                            {format(parseISO(evt.start), "HH:mm")}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </motion.div>
                )}

                {/* Actions Display */}
                {currentActions && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="pl-10 space-y-2"
                    >
                        {currentActions.map((action, idx) => (
                            <div key={idx} className="bg-rose-50 border border-rose-100 p-4 rounded-[1.5rem] flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">Yêu cầu xóa lịch</p>
                                    <p className="text-sm font-semibold text-gray-800">{action.title}</p>
                                </div>
                                <button
                                    onClick={() => handleExecuteAction(action)}
                                    className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-sm"
                                >
                                    Xác nhận xóa
                                </button>
                            </div>
                        ))}
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
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
                        placeholder="Nhập yêu cầu..."
                        className="flex-1 bg-transparent border-none text-sm px-4 py-2 focus:ring-0 focus:outline-none text-gray-800 placeholder:text-gray-400 font-medium"
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
