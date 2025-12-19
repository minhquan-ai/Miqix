"use client";

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock, CheckCircle } from 'lucide-react';

interface FocusTimerProps {
    initialDuration?: number; // in minutes, default 25
    onComplete?: (timeSpent: number) => void; // timeSpent in seconds
    onStop?: (timeSpent: number) => void;
}

export function FocusTimer({ initialDuration = 25, onComplete, onStop }: FocusTimerProps) {
    const [timeLeft, setTimeLeft] = useState(initialDuration * 60);
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(true);
    const [totalTimeSpent, setTotalTimeSpent] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isActive && !isPaused) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        setIsActive(false);
                        setIsPaused(true);
                        if (onComplete) onComplete(totalTimeSpent + 1);
                        return 0;
                    }
                    return prev - 1;
                });
                setTotalTimeSpent(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isActive, isPaused, onComplete, totalTimeSpent]);

    const toggleTimer = () => {
        if (!isActive) {
            setIsActive(true);
            setIsPaused(false);
        } else {
            setIsPaused(!isPaused);
        }
    };

    const stopTimer = () => {
        setIsActive(false);
        setIsPaused(true);
        if (timerRef.current) clearInterval(timerRef.current);
        if (onStop) onStop(totalTimeSpent);
        // Reset? Or keep state? Let's keep state to show result
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = ((initialDuration * 60 - timeLeft) / (initialDuration * 60)) * 100;

    return (
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center space-y-6 shadow-sm">
            <div className="text-center space-y-1">
                <h3 className="font-semibold text-lg flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Chế độ Tập trung
                </h3>
                <p className="text-sm text-muted-foreground">
                    Tắt thông báo và tập trung làm bài nhé!
                </p>
            </div>

            {/* Timer Display */}
            <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Circular Progress Background */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="96"
                        cy="96"
                        r="88"
                        className="stroke-muted fill-none"
                        strokeWidth="12"
                    />
                    <circle
                        cx="96"
                        cy="96"
                        r="88"
                        className="stroke-primary fill-none transition-all duration-1000 ease-linear"
                        strokeWidth="12"
                        strokeDasharray={2 * Math.PI * 88}
                        strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
                        strokeLinecap="round"
                    />
                </svg>

                {/* Time Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold font-mono tracking-wider">
                        {formatTime(timeLeft)}
                    </span>
                    <span className="text-sm text-muted-foreground mt-2">
                        {isActive ? (isPaused ? "Đang tạm dừng" : "Đang làm bài...") : "Sẵn sàng?"}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 w-full max-w-xs">
                {!isActive ? (
                    <button
                        onClick={toggleTimer}
                        className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <Play className="w-5 h-5" />
                        Bắt đầu
                    </button>
                ) : (
                    <>
                        <button
                            onClick={toggleTimer}
                            className={`flex-1 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${isPaused
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                    : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
                                }`}
                        >
                            {isPaused ? (
                                <>
                                    <Play className="w-5 h-5" /> Tiếp tục
                                </>
                            ) : (
                                <>
                                    <Pause className="w-5 h-5" /> Tạm dừng
                                </>
                            )}
                        </button>
                        <button
                            onClick={stopTimer}
                            className="flex-1 bg-red-100 text-red-700 py-3 rounded-lg font-bold hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-all flex items-center justify-center gap-2"
                        >
                            <Square className="w-5 h-5 fill-current" />
                            Kết thúc
                        </button>
                    </>
                )}
            </div>

            {/* Stats */}
            {totalTimeSpent > 0 && !isActive && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-full">
                    <CheckCircle className="w-4 h-4" />
                    Đã tập trung: {Math.floor(totalTimeSpent / 60)} phút {totalTimeSpent % 60} giây
                </div>
            )}
        </div>
    );
}
