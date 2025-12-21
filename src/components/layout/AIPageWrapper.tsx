"use client";

import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIPageWrapperProps {
    children: ReactNode;
    renderAI: (props: { isOpen: boolean; onClose: () => void }) => ReactNode;
    className?: string;
    aiWrapperClassName?: string;
}

export function AIPageWrapper({ children, renderAI, className, aiWrapperClassName }: AIPageWrapperProps) {
    const [isAIOpen, setIsAIOpen] = useState(false);

    return (
        // Wrapper chính: Flex row, chiều cao tối thiểu fit màn hình
        // min-h-[calc(100vh-64px)]: đảm bảo ít nhất full màn hình, cho phép tràn
        // overflowAnchor: 'none' -> NGĂN CHẶN browser tự động cuộn lung tung khi resize layout
        <div
            className={cn("flex min-h-[calc(100vh-64px)] -m-8 relative", className)}
            style={{ overflowAnchor: "none" }}
        >

            {/* Main Content Area - Bên trái */}
            {/* flex-1: Chiếm hết không gian, tự giãn theo nội dung */}
            {/* Bỏ transition-all để content resize ngay lập tức theo sidebar, tránh xung đột animation */}
            <div className="flex-1 bg-gray-50/50 p-6">
                <div className="flex flex-col gap-6">
                    {children}
                </div>
            </div>

            {/* AI Panel Area - Bên phải */}
            {/* sticky top-0: Bám dính vào cạnh trên màn hình khi cuộn */}
            {/* AI Panel Area - Bên phải - Maximized & Centered */}
            <AnimatePresence mode="wait">
                {isAIOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 500, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                        // Wrapper sticky:
                        // top-1: Cách Header chỉ 4px - Gần như sát đỉnh
                        // h-[calc(100vh-4.5rem)]: Chiều cao tối đa, chừa ~4px ở đáy
                        // pl-1: Padding trái 4px (gần content)
                        // pr-6: Padding phải 24px -> Khoảng cách lớn với lề phải -> ĐẨY PANEL SANG TRÁI
                        className={cn(
                            "z-20 shrink-0 sticky top-1 h-[calc(100vh-4.5rem)] pl-1 pr-6 pointer-events-none",
                            aiWrapperClassName
                        )}
                    >
                        {/* Inner Container: Floating Card */}
                        <div className="w-full h-full flex flex-col bg-white border border-gray-100 shadow-2xl rounded-[1.5rem] overflow-hidden pointer-events-auto">
                            {renderAI({ isOpen: isAIOpen, onClose: () => setIsAIOpen(false) })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Button (FAB) */}
            <AnimatePresence>
                {!isAIOpen && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0, y: 20 }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsAIOpen(true)}
                        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white rounded-full shadow-2xl flex items-center justify-center z-[60] border-4 border-white group"
                        title="Trợ lý AI"
                    >
                        <Bot className="w-8 h-8 group-hover:rotate-[-10deg] transition-transform" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
