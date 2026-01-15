"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Bot, GraduationCap, Calendar, Settings, MessageSquare, ChevronRight, Zap } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ClassAI } from "./ClassAI";
import { LearningAI } from "./LearningAI";
import { ScheduleAI } from "./ScheduleAI";
import { startOfWeek, format as formatDate } from "date-fns";
import { getCurrentUserAction, getUserEnrollmentsAction } from "@/lib/actions";
import { useAIContext } from "@/contexts/AIContext";

export function AIButler() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<"general" | "learning" | "schedule" | "class">("general");
    const [user, setUser] = useState<any>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const { toggleCanvas, isCanvasOpen, setAIPanelOpen } = useAIContext();

    // Determined if we are on the main AI Dashboard
    const isDashboard = pathname === "/dashboard" || pathname === "/dashboard/";

    // Hide AI Butler on public pages (landing, login, register, join, onboarding)
    const isPublicPage = pathname === "/" ||
        pathname === "/login" ||
        pathname === "/register" ||
        pathname.startsWith("/join") ||
        pathname === "/onboarding";

    // Auto-close local panel when entering dashboard to prevent overlap
    useEffect(() => {
        if (isDashboard && isOpen) {
            setIsOpen(false);
        }
    }, [isDashboard, isOpen]);

    // Auto-detect mode based on path
    useEffect(() => {
        if (pathname.includes("/assignments/")) {
            setMode("learning");
        } else if (pathname.includes("/schedule")) {
            setMode("schedule");
        } else if (pathname.includes("/classes/")) {
            setMode("class");
        } else {
            setMode("general");
        }
    }, [pathname]);

    // Load User & Classes for AI Context
    useEffect(() => {
        async function loadContext() {
            try {
                const currentUser = await getCurrentUserAction();
                setUser(currentUser);
                if (currentUser) {
                    const userClasses = await getUserEnrollmentsAction();
                    setClasses(userClasses);
                }
            } catch (err) {
                console.error("AI Butler Context Error:", err);
            }
        }
        loadContext();
    }, []);

    // Don't render AI Butler on public pages (landing, login, register, etc.)
    // This must be AFTER all hooks to comply with Rules of Hooks
    if (isPublicPage) {
        return null;
    }

    const toggleOpen = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        setAIPanelOpen(newState);
    };

    const weekStartStr = formatDate(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

    const renderAIContent = () => {
        const handleClose = () => { setIsOpen(false); setAIPanelOpen(false); };
        switch (mode) {
            case "learning":
                return <LearningAI onClose={handleClose} user={user} />;
            case "schedule":
                return <ScheduleAI
                    onClose={handleClose}
                    weekStartStr={weekStartStr}
                    onEventAdded={() => window.location.reload()}
                />;
            case "class":
                return <ClassAI onClose={handleClose} user={user} classes={classes} />;
            default:
                return <ClassAI onClose={handleClose} user={user} classes={classes} />;
        }
    };

    return (
        <>
            {/* Floating Toggle Button - Only show when panel is closed AND canvas is closed */}
            <AnimatePresence>
                {!isOpen && !isCanvasOpen && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0, y: 20 }}
                        className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-3"
                    >
                        {/* Intelligent Label on Hover */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileHover={{ opacity: 1, x: 0 }}
                            className="bg-gray-900/80 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-medium shadow-xl border border-white/10 pointer-events-none mb-1 mr-2"
                        >
                            Hỏi Miqix AI
                        </motion.div>

                        <motion.button
                            whileHover={{ scale: 1.1, y: -5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                if (isDashboard) {
                                    toggleCanvas();
                                } else {
                                    toggleOpen();
                                }
                            }}
                            className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all border-4 border-white group relative",
                                mode === "learning" ? "bg-indigo-600" :
                                    mode === "schedule" ? "bg-violet-600" :
                                        mode === "class" ? "bg-teal-600" :
                                            "bg-gray-900"
                            )}
                        >
                            {/* Inner Overflow Wrapper for Glow Effect */}
                            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-white/20 animate-spin-slow opacity-30" />
                            </div>

                            <Sparkles className="w-8 h-8 text-white relative z-10 group-hover:rotate-12 transition-transform duration-300" />

                            {/* Mode Indicator Pulse - Properly positioned outside overflow */}
                            <div className="absolute top-0 right-0 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md z-20 translate-x-1 -translate-y-1">
                                <div className={cn(
                                    "w-3 h-3 rounded-full animate-pulse",
                                    mode === "learning" ? "bg-indigo-500" :
                                        mode === "schedule" ? "bg-violet-500" :
                                            mode === "class" ? "bg-teal-500" :
                                                "bg-emerald-500"
                                )} />
                            </div>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Side Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setIsOpen(false); setAIPanelOpen(false); }}
                            className="fixed inset-0 bg-black/5 bg-blur-sm z-[90]"
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ x: "100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-[95] border-l border-gray-100 flex flex-col"
                        >
                            {/* Adaptive Header within content or here */}
                            {renderAIContent()}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
