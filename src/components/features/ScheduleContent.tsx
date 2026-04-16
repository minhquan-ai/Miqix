"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, getHours, getMinutes, differenceInMinutes, setHours, startOfDay, endOfWeek } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Loader2, Sparkles, Filter, CalendarDays, List, Grid3X3, ArrowRight, LayoutGrid, Bot, Plus, Timer } from "lucide-react";
import { getAggregatedScheduleAction, ScheduleEvent } from "@/lib/actions/schedule-actions";
import { createFocusSessionAction } from "@/lib/actions/focus-actions";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ScheduleCreationWizard } from "@/components/features/ScheduleCreationWizard";
import { EventDetailModal } from "@/components/features/EventDetailModal";
import { FocusSessionModal } from "@/components/features/FocusSessionModal";
import { FocusAnalyticsWidget } from "@/components/features/FocusAnalyticsWidget";
import { useAIContext } from "@/contexts/AIContext";

export default function ScheduleContent() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(new Date());
    const [refreshKey, setRefreshKey] = useState(0);
    const [showFocusModal, setShowFocusModal] = useState(false);

    // Get AI panel state for responsive layout
    const { isAIPanelOpen } = useAIContext();

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
    }, [currentDate, refreshKey]);

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    // Navigation handlers
    const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
    const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    // Time Grid Settings
    const START_HOUR = 0; // 0:00 AM
    const END_HOUR = 24;  // 24:00 (end of day)
    // Tạo mảng 25 nhãn từ 0 đến 24 để hiển thị đủ chặn đầu và chặn đuôi
    const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => START_HOUR + i);

    // Helper to position events - handles multi-day events, overnight events, etc.
    const getEventStyle = (event: ScheduleEvent, currentDay: Date) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        // Xác định ngày hiện tại đang render (đầu ngày và cuối ngày)
        const dayStart = new Date(currentDay);
        dayStart.setHours(START_HOUR, 0, 0, 0);

        const dayEnd = new Date(currentDay);
        dayEnd.setHours(END_HOUR - 1, 59, 59, 999); // 23:59:59

        // Giới hạn start/end trong phạm vi ngày đang render
        // - Nếu sự kiện bắt đầu trước ngày hiện tại → bắt đầu từ đầu ngày
        // - Nếu sự kiện kết thúc sau ngày hiện tại → kết thúc cuối ngày
        const clampedStart = eventStart < dayStart ? dayStart : eventStart;
        const clampedEnd = eventEnd > dayEnd ? dayEnd : eventEnd;

        // Kiểm tra nếu sự kiện không thuộc ngày này (hoàn toàn ngoài phạm vi)
        if (clampedStart > dayEnd || clampedEnd < dayStart) {
            return { display: 'none' as const };
        }

        // Tính vị trí top và chiều cao dựa trên phần đã giới hạn
        const startMinutes = (getHours(clampedStart) * 60 + getMinutes(clampedStart)) - (START_HOUR * 60);
        const durationMinutes = differenceInMinutes(clampedEnd, clampedStart);

        // Đảm bảo chiều cao tối thiểu 40px và tối đa không vượt quá phạm vi ngày
        const maxDuration = (END_HOUR - START_HOUR) * 60; // 24 giờ = 1440 phút
        const safeDuration = Math.min(Math.max(durationMinutes, 15), maxDuration - startMinutes);

        return {
            top: `${Math.max(0, (startMinutes / 60) * 80)}px`,
            height: `${Math.max((safeDuration / 60) * 80, 40)}px`,
            position: 'absolute' as const,
            width: '92%',
            left: '4%',
            right: '4%',
            zIndex: 10
        };
    };

    const getEventColors = (color?: string, type?: string) => {
        if (type === 'personal') return "bg-emerald-50/90 border-emerald-200 text-emerald-900 shadow-emerald-100 hover:ring-emerald-200";
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
        <div className={cn(
            "page-container flex flex-col transition-all duration-300",
            isAIPanelOpen && "md:mr-[450px]"
        )}>
            <div className="page-content flex flex-col gap-6 h-full min-h-0">
                {/* HERO SECTION - Compact Mode */}
                <div
                    className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-[2rem] p-4 text-white shadow-xl shadow-purple-500/10 shrink-0 flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <CalendarDays className="w-5 h-5" />
                        </div>
                        <h1 className="text-xl font-bold">Thời khóa biểu</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowFocusModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 backdrop-blur-md rounded-xl font-semibold transition-all shadow-sm border border-emerald-400/50"
                        >
                            <Timer className="w-4 h-4" />
                            <span>Tập trung</span>
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl font-semibold transition-all shadow-sm border border-white/20"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tạo lịch biểu</span>
                        </button>
                    </div>
                </div>

                {/* CONTROL BAR */}
                <div
                    className="bg-white p-2 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-4 shrink-0"
                >
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <button
                            onClick={goToToday}
                            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl transition-all"
                        >
                            Hôm nay
                        </button>
                        <div className="flex items-center bg-gray-50 rounded-2xl border border-gray-200 p-1">
                            <button onClick={prevWeek} className="p-2 hover:bg-white rounded-xl transition-all text-gray-600 hover:text-indigo-600 shadow-sm hover:shadow">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
                            <button onClick={nextWeek} className="p-2 hover:bg-white rounded-xl transition-all text-gray-600 hover:text-indigo-600 shadow-sm hover:shadow">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        <span className="ml-2 font-bold text-gray-700 text-lg hidden md:block lg:hidden xl:block">
                            Tháng {format(currentDate, "MM, yyyy", { locale: vi })}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto overflow-visible">
                        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50/60 rounded-full border border-indigo-100/50 shadow-sm transition-all hover:bg-indigo-100/50">
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_-1px_rgba(99,102,241,0.6)]"></div>
                            <span className="text-[11px] font-bold text-indigo-700 tracking-wide uppercase">Lớp học</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50/60 rounded-full border border-orange-100/50 shadow-sm transition-all hover:bg-orange-100/50">
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_-1px_rgba(249,115,22,0.6)]"></div>
                            <span className="text-[11px] font-bold text-orange-700 tracking-wide uppercase">Bài tập</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50/60 rounded-full border border-emerald-100/50 shadow-sm transition-all hover:bg-emerald-100/50">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_-1px_rgba(16,185,129,0.6)]"></div>
                            <span className="text-[11px] font-bold text-emerald-700 tracking-wide uppercase">Cá nhân</span>
                        </div>
                    </div>
                </div>

                {/* FOCUS ANALYTICS WIDGET */}
                {/* <FocusAnalyticsWidget /> */}

                {/* SCHEDULE GRID CARD */}
                <div
                    className="flex-1 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-0"
                >
                    {/* Scrollable Container */}
                    <div className="flex-1 overflow-y-auto overflow-x-auto relative scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                        <div className="min-w-[800px] h-full relative">

                            {/* Sticky Header Row (Days) */}
                            <div className="grid grid-cols-[70px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] sticky top-0 bg-white/95 backdrop-blur-md z-30 border-b border-gray-200 shadow-sm">
                                <div className="p-4 border-r border-gray-100 flex items-center justify-center bg-gray-50/30">
                                    <Clock className="w-5 h-5 text-gray-400" />
                                </div>
                                {weekDays.map(day => {
                                    const isToday = isSameDay(day, now);
                                    return (
                                        <div key={day.toString()} className={cn(
                                            "py-4 px-2 text-center border-r border-gray-100 transition-colors",
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
                                <div className="border-r border-gray-100 bg-gray-50/30 pb-4">
                                    {hours.map((hour, idx) => (
                                        <div key={hour} className={cn(
                                            "h-20 border-b border-gray-100/60 text-xs font-semibold text-gray-400 text-right pr-3 pt-2 relative",
                                            idx === hours.length - 1 ? "border-b-0" : ""
                                        )}>
                                            <span className="-top-3 relative">{hour}:00</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Days Columns */}
                                {weekDays.map((day, dayIndex) => {
                                    const isToday = isSameDay(day, now);

                                    return (
                                        <div key={day.toString()} className={cn(
                                            "relative border-r border-gray-100",
                                            isToday ? "bg-purple-50/10" : ""
                                        )}>
                                            {/* Horizontal Grid Lines */}
                                            <div className="pb-4">
                                                {hours.map((hour, idx) => (
                                                    <div key={hour} className={cn(
                                                        "h-20 border-b border-gray-100/60 relative",
                                                        idx === hours.length - 1 ? "border-b-0" : ""
                                                    )}>
                                                        {/* Optional: Half-hour dashed line */}
                                                        {idx !== hours.length - 1 && (
                                                            <div className="absolute w-full border-b border-gray-50/50 top-1/2 border-dashed"></div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

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
                                                    .filter(e => {
                                                        // Hiển thị event nếu ngày hiện tại nằm trong khoảng start → end
                                                        const eventStart = new Date(e.start);
                                                        const eventEnd = new Date(e.end);
                                                        const dayStart = new Date(day);
                                                        dayStart.setHours(0, 0, 0, 0);
                                                        const dayEnd = new Date(day);
                                                        dayEnd.setHours(23, 59, 59, 999);

                                                        // Event xuất hiện trong ngày nếu: eventStart <= dayEnd && eventEnd >= dayStart
                                                        return eventStart <= dayEnd && eventEnd >= dayStart;
                                                    })
                                                    .map((event, idx) => {
                                                        const duration = differenceInMinutes(new Date(event.end), new Date(event.start));
                                                        const isMicro = duration < 15;
                                                        const isVeryShort = duration <= 35;
                                                        const isShort = duration <= 50;

                                                        return (
                                                            <motion.div
                                                                key={event.id || `event-${idx}`}
                                                                initial={{ opacity: 0, scale: 0.9 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                whileHover={{ scale: 1.02, zIndex: 50 }}
                                                                style={getEventStyle(event, day)}
                                                                onClick={() => setSelectedEvent(event)}
                                                                className={cn(
                                                                    "rounded-xl border shadow-sm hover:shadow-lg cursor-pointer flex transition-all duration-200 relative overflow-hidden backdrop-blur-md group",
                                                                    isMicro ? "flex-row items-center p-1 px-2 gap-2" : "flex-col p-2 gap-1",
                                                                    isVeryShort && !isMicro ? "p-1.5 gap-0.5" : "",
                                                                    getEventColors(event.color, event.type)
                                                                )}
                                                            >
                                                                <div className={cn(
                                                                    "font-bold text-xs leading-tight shrink-0",
                                                                    isShort ? "line-clamp-1" : "line-clamp-2",
                                                                    isMicro ? "max-w-[60%]" : "w-full"
                                                                )}>
                                                                    {event.title}
                                                                </div>

                                                                <div className={cn(
                                                                    "flex items-center gap-1 font-bold bg-white/40 rounded-md shrink-0",
                                                                    isMicro ? "text-[9px] px-1.5 py-0.5 ml-auto" :
                                                                        isVeryShort ? "text-[9px] px-1 py-0 w-fit mt-auto" : "text-[10px] px-1.5 py-0.5 w-fit mt-auto"
                                                                )}>
                                                                    <Clock className={isVeryShort ? "w-2.5 h-2.5" : "w-3 h-3"} />
                                                                    <span className="whitespace-nowrap">
                                                                        {format(new Date(event.start), "HH:mm")}
                                                                        {!isMicro && (
                                                                            <>
                                                                                {isVeryShort ? "-" : " - "}
                                                                                {format(new Date(event.end), "HH:mm")}
                                                                            </>
                                                                        )}
                                                                    </span>
                                                                </div>

                                                                {!isShort && event.location && (
                                                                    <div className="flex items-center gap-1 text-[10px] font-medium opacity-80 pl-0.5 mt-0.5">
                                                                        <MapPin className="w-3 h-3" />
                                                                        <span className="truncate">{event.location}</span>
                                                                    </div>
                                                                )}

                                                                {/* Modern Accent Bar */}
                                                                <div className={cn(
                                                                    "absolute left-0 top-0 bottom-0 w-1",
                                                                    event.type === 'assignment' ? "bg-orange-400" :
                                                                        event.type === 'personal' ? "bg-emerald-500" :
                                                                            "bg-purple-500"
                                                                )}></div>
                                                            </motion.div>
                                                        );
                                                    })}
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
                </div>

                <ScheduleCreationWizard
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleRefresh}
                    initialDate={currentDate}
                />

                <EventDetailModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onEventDeleted={handleRefresh}
                />

                <FocusSessionModal
                    isOpen={showFocusModal}
                    onClose={() => setShowFocusModal(false)}
                    onSessionComplete={async (data) => {
                        try {
                            await createFocusSessionAction({
                                duration: data.duration,
                                type: data.type,
                                subject: data.subject,
                            });
                            console.log("Focus session saved:", data);
                        } catch (error) {
                            console.error("Failed to save focus session:", error);
                        }
                    }}
                />
            </div>
        </div>
    );
}
