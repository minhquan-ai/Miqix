"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, ArrowRight, Loader2, Bot, MessageCircle, PenLine, ChevronDown, Plus, Mic, Globe, History, Image as ImageIcon, MoreHorizontal, X } from "lucide-react";
import { analyzeScheduleAIAction, createPersonalEventAction, deletePersonalEventAction } from "@/lib/schedule-actions";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
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
    actions?: AIAction[];
}

export function ScheduleAI({ onClose, weekStartStr, onEventAdded }: ScheduleAIProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'chat' | 'edit'>('chat');
    const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);

    // AI suggestions state
    const [currentOptions, setCurrentOptions] = useState<AIResponseOption[] | null>(null);
    const [currentActions, setCurrentActions] = useState<AIAction[] | null>(null);
    const [pendingOption, setPendingOption] = useState<AIResponseOption | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null); // Ref cho container cuộn

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
        setCurrentOptions(null);
        setCurrentActions(null);
        setPendingOption(null);

        try {
            const result = await analyzeScheduleAIAction(weekStartStr, userMsg, messages, mode);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: result.message || "Mình đã tìm thấy một vài lựa chọn cho bạn:"
            }]);

            if (result.options && result.options.length > 0) setCurrentOptions(result.options);
            if (result.actions && result.actions.length > 0) setCurrentActions(result.actions);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Xin lỗi, mình gặp chút sự cố khi phân tích lịch. Bạn thử lại nhé!' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOption = (option: AIResponseOption) => {
        setPendingOption({ ...option });
        setTimeout(scrollToBottom, 100);
    };

    const handleConfirmOption = async () => {
        if (!pendingOption) return;
        const optionToRegister = pendingOption;
        setPendingOption(null);
        setLoading(true);

        try {
            if (optionToRegister.actions) {
                for (const action of optionToRegister.actions) {
                    if (action.type === 'delete_personal') await deletePersonalEventAction(action.eventId);
                }
            }
            for (const evt of optionToRegister.events) {
                await createPersonalEventAction({
                    title: evt.title,
                    description: `Được AI thêm từ lựa chọn: ${optionToRegister.label}`,
                    start: evt.start,
                    end: evt.end,
                    color: 'emerald'
                });
            }
            setTimeout(() => onEventAdded(), 800);
            setCurrentOptions(prev => prev ? prev.filter(o => o.label !== optionToRegister.label) : null);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `✅ Đã thực hiện thay đổi: **${optionToRegister.label}** thành công.`
            }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Có lỗi xảy ra khi thực hiện thay đổi." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AIPanelShell onClose={onClose} title="Trợ lý Lịch biểu" loading={loading}>
            {/* Container: flex flex-col h-full để empty state có thể căn giữa */}
            <div
                ref={messagesContainerRef}
                className={`flex-1 flex flex-col p-4 space-y-6 bg-white scrollbar-thin scrollbar-thumb-gray-100 ${messages.length > 0 ? 'overflow-y-auto' : 'overflow-hidden'}`}
            >
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 opacity-90">
                        <div className="relative">
                            <motion.div
                                animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="w-24 h-24 bg-gradient-to-tr from-indigo-50 to-white rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-indigo-100/50 border border-white relative z-10"
                            >
                                <Bot className="w-10 h-10 text-indigo-500" />
                            </motion.div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-50">
                                <Sparkles className="w-5 h-5 text-amber-400" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="font-extrabold text-gray-900 text-xl tracking-tight">Chào bạn, mình là Ergonix AI!</h2>
                            <p className="text-gray-400 text-sm font-medium">Bạn cần hỗ trợ gì cho lịch trình hôm nay?</p>
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mr-3 mt-0.5 shrink-0 border border-indigo-100">
                                <Sparkles className="w-4 h-4 text-indigo-500" />
                            </div>
                        )}
                        <div className={`max-w-[85%] px-4 py-3 rounded-[1.3rem] text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white font-semibold' : 'bg-white border border-gray-100 text-gray-700'}`} style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' } : {}}>
                            <MarkdownText content={msg.content} />
                        </div>
                    </motion.div>
                ))}

                {loading && (
                    <div className="flex justify-start items-start">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mr-3 mt-0.5 shrink-0 border border-indigo-100">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="bg-white border border-gray-100 px-5 py-3 rounded-[1.3rem] flex items-center gap-1.5 min-w-[60px] justify-center">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
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

                {/* AI Options / Pending Confirmation UI */}
                {(currentOptions && !pendingOption) && (
                    <div className="pl-10 space-y-3">
                        {currentOptions.map((option, idx) => (
                            <div key={idx} onClick={() => handleSelectOption(option)} className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group">
                                <div className="flex justify-between items-start mb-2">
                                    <div><h4 className="font-bold text-gray-800 text-sm">{option.label}</h4><p className="text-xs text-gray-500">{option.description}</p></div>
                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                </div>
                                {option.events.map((evt, eIdx) => (
                                    <div key={eIdx} className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div><span>{evt.title}</span><span className="text-gray-400 ml-auto">{format(parseISO(evt.start), "HH:mm")}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {pendingOption && (
                    <div className="pl-10 pb-4">
                        <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-[2rem] shadow-xl space-y-4">
                            <h4 className="font-bold text-indigo-900 text-sm">Xác nhận lịch: {pendingOption.label}</h4>
                            <div className="space-y-2">
                                {pendingOption.events.map((evt, eIdx) => (
                                    <div key={eIdx} className="bg-white p-3 rounded-[1.2rem] border border-white shadow-sm">
                                        <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
                                            <span>SỰ KIỆN {eIdx + 1}</span><span>{format(parseISO(evt.start), "HH:mm")} - {format(parseISO(evt.end), "HH:mm")}</span>
                                        </div>
                                        <div className="text-sm font-bold text-gray-800">{evt.title}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setPendingOption(null)} className="flex-1 py-3 bg-white border border-gray-100 text-gray-500 text-xs font-bold rounded-2xl hover:bg-gray-50">Hủy</button>
                                <button onClick={handleConfirmOption} className="flex-[2] py-3 bg-indigo-600 text-white text-xs font-bold rounded-2xl hover:bg-indigo-700 shadow-lg flex items-center justify-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Thêm vào lịch</button>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Specialized Capsule Input Area */}
            <div className="p-4 bg-white/50 backdrop-blur-sm pb-6">
                <div className="bg-white rounded-[2rem] border border-gray-200 shadow-xl px-2 py-2 transition-all focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-200 relative">

                    {/* Main Input Part */}
                    <div className="px-3 pt-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            disabled={loading}
                            placeholder="Nhập yêu cầu lịch trình..."
                            className="w-full bg-transparent border-none text-[16px] py-1 focus:ring-0 focus:outline-none text-gray-800 placeholder:text-gray-400 font-medium resize-none overflow-y-auto scrollbar-none leading-relaxed"
                            rows={2}
                            style={{ height: 'auto', minHeight: '40px', maxHeight: '150px' }}
                        />
                    </div>

                    {/* Bottom Toolbar Area */}
                    <div className="flex items-center justify-between px-1 pb-1">
                        <div className="flex items-center gap-2 pl-1">
                            {/* Mode Selector - Now the only toolbar item */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-100 bg-gray-50/50 hover:bg-gray-100 transition-all active:scale-95`}
                                >
                                    {mode === 'chat' ? <MessageCircle className="w-3.5 h-3.5 text-gray-400" /> : <PenLine className="w-3.5 h-3.5 text-indigo-500" />}
                                    <span className={`text-[11px] font-bold ${mode === 'edit' ? 'text-indigo-600' : 'text-gray-600'}`}>
                                        {mode === 'chat' ? "Bình thường" : "Chỉnh sửa"}
                                    </span>
                                    <ChevronDown className="w-3 h-3 text-gray-400" />
                                </button>

                                <AnimatePresence>
                                    {isModeMenuOpen && (
                                        <>
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-10" onClick={() => setIsModeMenuOpen(false)} />
                                            <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute bottom-full mb-3 left-0 bg-white border border-gray-100 shadow-2xl rounded-2xl py-2 z-20 min-w-[160px] overflow-hidden">
                                                <ModeMenuItem active={mode === 'chat'} icon={<MessageCircle className="w-4 h-4" />} label="Bình thường" onClick={() => { setMode('chat'); setIsModeMenuOpen(false); }} />
                                                <ModeMenuItem active={mode === 'edit'} icon={<PenLine className="w-4 h-4" />} label="Chỉnh sửa" onClick={() => { setMode('edit'); setIsModeMenuOpen(false); }} />
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
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

function ModeMenuItem({ icon, label, onClick, active }: { icon: React.ReactNode, label: string, onClick: () => void, active: boolean }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-all ${active ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <span className={active ? "text-indigo-500" : "text-gray-400"}>{icon}</span>
            {label}
            {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
        </button>
    );
}

function QuickPromptBtn({ text, onClick }: { text: string, onClick: () => void }) {
    return (
        <button onClick={onClick} className="text-xs font-bold bg-white border border-gray-200 px-4 py-2 rounded-full text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm active:scale-95">{text}</button>
    );
}
