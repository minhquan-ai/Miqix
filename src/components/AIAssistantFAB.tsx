"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, X, Send, Mic, FileText, BarChart2,
    Bell, BookOpen, Users, ChevronRight, Bot, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const quickActions = [
    { id: 'draft-announcement', icon: Bell, label: 'Soạn thông báo', color: 'text-amber-500 bg-amber-50' },
    { id: 'analyze-grades', icon: BarChart2, label: 'Phân tích điểm số', color: 'text-blue-500 bg-blue-50' },
    { id: 'create-quiz', icon: BookOpen, label: 'Tạo quiz ôn tập', color: 'text-emerald-500 bg-emerald-50' },
    { id: 'student-report', icon: Users, label: 'Báo cáo học sinh', color: 'text-violet-500 bg-violet-50' },
];

const mockResponses: Record<string, string> = {
    'draft-announcement': 'Dạ, em sẽ giúp thầy/cô soạn thông báo. Thầy/cô muốn thông báo về nội dung gì ạ?\n\nVí dụ:\n• Nhắc nhở nộp bài\n• Thay đổi lịch học\n• Thông báo kiểm tra',
    'analyze-grades': '📊 **Phân tích điểm số lớp 10A1:**\n\n• Điểm trung bình: **7.5/10**\n• Cao nhất: Nguyễn Văn A (9.5)\n• Thấp nhất: Trần Thị B (4.0)\n• 3 học sinh cần hỗ trợ thêm\n\nThầy/cô có muốn xem chi tiết từng học sinh không ạ?',
    'create-quiz': '✍️ Em có thể giúp tạo quiz cho các chủ đề sau:\n\n1. Định luật Newton (Vật lý)\n2. Phương trình bậc 2 (Toán)\n3. Từ vựng Unit 5 (Tiếng Anh)\n\nThầy/cô chọn chủ đề hoặc nhập chủ đề mới ạ!',
    'student-report': '📋 **Tổng quan học sinh:**\n\n• Sĩ số: 35 học sinh\n• Chuyên cần: 92%\n• Tỉ lệ nộp bài: 88%\n\n⚠️ **Cần chú ý:**\n• Nguyễn Văn B - Vắng 3 buổi liên tiếp\n• Lê Thị C - Điểm giảm đáng kể',
    'default': 'Dạ, em hiểu rồi ạ! Em sẽ hỗ trợ thầy/cô ngay. Thầy/cô có thể mô tả thêm chi tiết được không ạ?'
};

export default function AIAssistantFAB() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>(() => [
        {
            id: '1',
            role: 'assistant',
            content: 'Xin chào! 👋 Em là trợ lý AI của Ergonix. Em có thể giúp gì cho thầy/cô hôm nay?',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleQuickAction = (actionId: string) => {
        const action = quickActions.find(a => a.id === actionId);
        if (!action) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(), // eslint-disable-line
            role: 'user',
            content: action.label,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        // Simulate AI thinking
        setIsTyping(true);
        setTimeout(() => {
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: mockResponses[actionId] || mockResponses.default,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsTyping(false);
        }, 1000);
    };

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');

        // Simulate AI response
        setIsTyping(true);
        setTimeout(() => {
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: mockResponses.default,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsTyping(false);
        }, 1200);
    };

    return (
        <>
            {/* FAB Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg shadow-purple-500/30",
                    "bg-gradient-to-r from-violet-600 to-purple-600 text-white",
                    "flex items-center justify-center",
                    "hover:scale-110 active:scale-95 transition-transform",
                    isOpen && "scale-0 opacity-0"
                )}
                whileHover={{ boxShadow: "0 0 30px rgba(139, 92, 246, 0.5)" }}
            >
                <Sparkles className="w-6 h-6" />
            </motion.button>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-6 right-6 z-50 w-[380px] h-[560px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Trợ lý AI Ergonix</h3>
                                    <p className="text-[10px] text-purple-200 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                        Đang hoạt động
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex",
                                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                                    )}
                                >
                                    <div className={cn(
                                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                                        msg.role === 'user'
                                            ? 'bg-violet-600 text-white rounded-br-sm'
                                            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                                    )}>
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing Indicator */}
                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions */}
                        {messages.length <= 2 && (
                            <div className="px-4 py-3 border-t border-gray-100 bg-white">
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-2">Hành động nhanh</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {quickActions.map((action) => (
                                        <button
                                            key={action.id}
                                            onClick={() => handleQuickAction(action.id)}
                                            className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50/50 transition-all text-left group"
                                        >
                                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", action.color)}>
                                                <action.icon className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-medium text-gray-700 group-hover:text-violet-700">{action.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-4 border-t border-gray-100 bg-white">
                            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2">
                                <input
                                    type="text"
                                    placeholder="Nhập tin nhắn..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="flex-1 bg-transparent text-sm outline-none"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputValue.trim()}
                                    className="p-2 rounded-full bg-violet-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-700 transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
