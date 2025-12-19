"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, getHours, getMinutes, differenceInMinutes, setHours, startOfDay, endOfWeek } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Loader2, Sparkles, Filter, CalendarDays, List, Grid3X3, ArrowRight, LayoutGrid } from "lucide-react";
import { getAggregatedScheduleAction, ScheduleEvent } from "@/lib/schedule-actions";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function ScheduleContent() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(new Date());

    // Update "now" every minute
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    // Calculate week range
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Pass ISO string of the week start to server action
                const result = await getAggregatedScheduleAction(weekStart.toISOString());
                setEvents(result.events);
            } catch (error) {
                console.error("Failed to load schedule:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentDate]);

    // Navigation handlers
    const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
    const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    // Time Grid Settings
    const START_HOUR = 6; // 6:00 AM
    const END_HOUR = 22;  // 10:00 PM
    const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => START_HOUR + i);

    // Helper to position events
    const getEventStyle = (event: ScheduleEvent) => {
        const start = new Date(event.start);
        const end = new Date(event.end);

        const startMinutes = (getHours(start) * 60 + getMinutes(start)) - (START_HOUR * 60);
        const durationMinutes = differenceInMinutes(end, start);

        return {
            top: `${(startMinutes / 60) * 80}px`, // 80px per hour height (taller rows)
            height: `${Math.max((durationMinutes / 60) * 80, 40)}px`,
            position: 'absolute' as const,
            width: '92%',
            left: '4%',
            right: '4%',
            zIndex: 10
        };
    };

    const getEventColors = (color?: string, type?: string) => {
        if (type === 'assignment') return "bg-orange-50/90 border-orange-200 text-orange-900 shadow-orange-100 hover:ring-orange-200";
        if (color === 'purple') return "bg-purple-50/90 border-purple-200 text-purple-900 shadow-purple-100 hover:ring-purple-200";
        if (color === 'emerald') return "bg-emerald-50/90 border-emerald-200 text-emerald-900 shadow-emerald-100 hover:ring-emerald-200";
        if (color === 'pink') return "bg-pink-50/90 border-pink-200 text-pink-900 shadow-pink-100 hover:ring-pink-200";
        return "bg-indigo-50/90 border-indigo-200 text-indigo-900 shadow-indigo-100 hover:ring-indigo-200";
    };

    // Calculate position for the current time indicator
    const getCurrentTimePosition = () => {
        const currentHour = getHours(now);
        const currentMinute = getMinutes(now);

        if (currentHour < START_HOUR || currentHour > END_HOUR) return null;

        const minutesFromStart = (currentHour * 60 + currentMinute) - (START_HOUR * 60);
        return `${(minutesFromStart / 60) * 80}px`;
    };

    const timeIndicatorTop = getCurrentTimePosition();

    return (
        <div className="min-h-screen bg-gray-50/50 -m-8 p-6 flex flex-col gap-6">

            {/* HER HERO SECTION - Compact Mode */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-2xl p-4 text-white shadow-lg shadow-purple-500/10 shrink-0 flex items-center justify-between"
            >
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <CalendarDays className="w-5 h-5" />
                    </div>
                    <h1 className="text-xl font-bold">Thời khóa biểu</h1>
                </div>
            </motion.div>

            {/* CONTROL BAR */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 shrink-0"
            >
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={goToToday}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all"
                    >
                        Hôm nay
                    </button>
                    <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 p-1">
                        <button onClick={prevWeek} className="p-2 hover:bg-white rounded-lg transition-all text-gray-600 hover:text-indigo-600 shadow-sm hover:shadow">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
                        <button onClick={nextWeek} className="p-2 hover:bg-white rounded-lg transition-all text-gray-600 hover:text-indigo-600 shadow-sm hover:shadow">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                    <span className="ml-2 font-bold text-gray-700 text-lg hidden md:block">
                        Tháng {format(currentDate, "MM, yyyy", { locale: vi })}
                    </span>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50/50 rounded-lg border border-indigo-100">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm"></div>
                        <span className="text-xs font-semibold text-indigo-700">Lớp học</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50/50 rounded-lg border border-orange-100">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm"></div>
                        <span className="text-xs font-semibold text-orange-700">Bài tập</span>
                    </div>
                </div>
            </motion.div>

            {/* SCHEDULE GRID CARD */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex-1 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]"
            >
                {/* Scrollable Container */}
                <div className="flex-1 overflow-y-auto overflow-x-auto relative scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    <div className="min-w-[900px] h-full relative">

                        {/* Sticky Header Row (Days) */}
                        <div className="grid grid-cols-[70px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] sticky top-0 bg-white/95 backdrop-blur-md z-30 border-b border-gray-200 shadow-sm">
                            <div className="p-4 border-r border-gray-100 flex items-center justify-center bg-gray-50/30">
                                <Clock className="w-5 h-5 text-gray-400" />
                            </div>
                            {weekDays.map(day => {
                                const isToday = isSameDay(day, now);
                                return (
                                    <div key={day.toString()} className={cn(
                                        "py-4 px-2 text-center border-r border-gray-100 min-w-[120px] transition-colors",
                                        isToday ? "bg-purple-50/40" : ""
                                    )}>
                                        <p className={cn(
                                            "text-xs font-bold uppercase mb-1.5 tracking-wider",
                                            isToday ? "text-purple-600" : "text-gray-400"
                                        )}>
                                            {format(day, "EEE", { locale: vi })}
                                        </p>
                                        <div className={cn(
                                            "w-10 h-10 rounded-2xl flex items-center justify-center mx-auto text-sm font-bold shadow-sm transition-all",
                                            isToday ? "bg-purple-600 text-white shadow-purple-200 scale-105 ring-2 ring-purple-100" : "bg-gray-50 text-gray-700 border border-gray-100"
                                        )}>
                                            {format(day, "d")}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Body Rows (Time Slots) */}
                        <div className="relative grid grid-cols-[70px_1fr_1fr_1fr_1fr_1fr_1fr_1fr]">
                            {/* Time Column */}
                            <div className="border-r border-gray-100 bg-gray-50/30">
                                {hours.map(hour => (
                                    <div key={hour} className="h-20 border-b border-gray-100/60 text-xs font-semibold text-gray-400 text-right pr-3 pt-2 relative">
                                        <span className="-top-3 relative">{hour}:00</span>
                                    </div>
                                ))}
                            </div>

                            {/* Days Columns */}
                            {weekDays.map((day, dayIndex) => {
                                const isToday = isSameDay(day, now);

                                return (
                                    <div key={day.toString()} className={cn(
                                        "relative border-r border-gray-100 min-w-[120px]",
                                        isToday ? "bg-purple-50/10" : ""
                                    )}>
                                        {/* Horizontal Grid Lines */}
                                        {hours.map(hour => (
                                            <div key={hour} className="h-20 border-b border-gray-100/60 relative">
                                                {/* Optional: Half-hour dashed line */}
                                                <div className="absolute w-full border-b border-gray-50 top-1/2 border-dashed"></div>
                                            </div>
                                        ))}

                                        {/* Current Time Indicator Line for Today */}
                                        {isToday && timeIndicatorTop && (
                                            <div
                                                className="absolute w-full z-20 pointer-events-none flex items-center"
                                                style={{ top: timeIndicatorTop }}
                                            >
                                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5 ring-4 ring-white shadow-sm"></div>
                                                <div className="flex-1 h-[2px] bg-rose-500 shadow-sm"></div>
                                            </div>
                                        )}

                                        {/* Events */}
                                        <AnimatePresence>
                                            {events
                                                .filter(e => isSameDay(new Date(e.start), day))
                                                .map(event => (
                                                    <motion.div
                                                        key={event.id}
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        whileHover={{ scale: 1.02, zIndex: 50 }}
                                                        style={getEventStyle(event)}
                                                        className={cn(
                                                            "rounded-xl border p-2 shadow-sm hover:shadow-lg cursor-pointer flex flex-col gap-1 overflow-hidden backdrop-blur-md group transition-all duration-200",
                                                            getEventColors(event.color, event.type)
                                                        )}
                                                    >
                                                        <div className="flex items-start justify-between gap-1">
                                                            <div className="font-bold text-xs line-clamp-2 leading-tight">
                                                                {event.title}
                                                            </div>
                                                        </div>

                                                        <div className="mt-auto flex flex-col gap-0.5 opacity-90 group-hover:opacity-100 transition-opacity">
                                                            <div className="flex items-center gap-1 text-[10px] font-medium bg-white/40 w-fit px-1.5 py-0.5 rounded-md">
                                                                <Clock className="w-3 h-3" />
                                                                <span>{format(new Date(event.start), "HH:mm")} - {format(new Date(event.end), "HH:mm")}</span>
                                                            </div>
                                                            {event.location && (
                                                                <div className="flex items-center gap-1 text-[10px] font-medium opacity-80 pl-0.5">
                                                                    <MapPin className="w-3 h-3" />
                                                                    <span className="truncate">{event.location}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Modern Accent Bar */}
                                                        <div className={cn(
                                                            "absolute left-0 top-0 bottom-0 w-1",
                                                            event.type === 'assignment' ? "bg-orange-400" : "bg-purple-500"
                                                        )}></div>
                                                    </motion.div>
                                                ))
                                            }
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {loading && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-3xl shadow-2xl border border-gray-100">
                                <div className="relative">
                                    <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-purple-600" />
                                    </div>
                                </div>
                                <p className="text-sm font-semibold text-gray-600">Đang cập nhật lịch...</p>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
