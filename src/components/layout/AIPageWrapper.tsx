"use client";

import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIPageWrapperProps {
    children: ReactNode;
    /**
     * Function to render the AI component.
     * It receives `isOpen` and `onClose` to manage its own state if needed,
     * though `AIPageWrapper` manages the layout visibility.
     */
    renderAI: (props: { isOpen: boolean; onClose: () => void }) => ReactNode;

    /**
     * Optional class name for the wrapper div
     */
    className?: string;
}

export function AIPageWrapper({ children, renderAI, className }: AIPageWrapperProps) {
    const [isAIOpen, setIsAIOpen] = useState(false);

    return (
        <div className={cn("h-[calc(100vh-64px)] bg-gray-50/50 -m-8 flex overflow-hidden p-6 pb-0 gap-6", className)}>
            {/* Main Content Area */}
            <motion.div
                layout
                className="flex-1 flex flex-col gap-6 overflow-hidden min-w-0" // min-w-0 is crucial for flex child text truncation
                transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
            >
                {children}
            </motion.div>

            {/* AI Panel Area */}
            <AnimatePresence>
                {isAIOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: "100%", width: 0 }}
                        animate={{ opacity: 1, x: 0, width: 450 }}
                        exit={{ opacity: 0, x: "100%", width: 0 }}
                        transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
                        className={cn(
                            "bg-white z-50 flex flex-col overflow-hidden",
                            "fixed top-0 right-0 bottom-0 w-[calc(100%-1rem)] shadow-2xl rounded-l-[2rem] border-l border-gray-100", // Mobile/Default
                            "md:relative md:shadow-xl md:shadow-indigo-500/5", // Desktop sidebar
                            "min-w-0"
                        )}
                    >
                        {renderAI({ isOpen: isAIOpen, onClose: () => setIsAIOpen(false) })}
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
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileHover={{ opacity: 1, x: -10 }}
                            className="absolute right-full mr-4 bg-gray-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-xl pointer-events-none"
                        >
                            Trợ lý AI
                        </motion.div>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
