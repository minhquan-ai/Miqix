"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Share2,
    Send,
    Mic,
    Bot,
    Loader2,
    ChevronDown,
    MessageCircle,
    BrainCircuit,
    FileText,
    Target,
    PenTool,
    Maximize2,
    X,
    MoreHorizontal,
    Plus,
    MessageSquare,
    PanelLeft,
    LayoutGrid,
    Activity,
    ListTodo,
    History,
    Zap,
    BookMarked,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    ArrowRight,
    GraduationCap,
    Search,
    User,
    Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { User as UserType } from "@/types";
import { useAIContext } from "@/contexts/AIContext";
import { useAIChat, ChatMessage } from "@/hooks/useAIChat";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { CanvasContentRenderer } from './CanvasContentRenderer';
import { format, startOfWeek, isAfter, isToday } from "date-fns";
import { getAggregatedScheduleAction, ScheduleEvent } from "@/lib/schedule-actions";
import { getAssignmentsAction, getClassesAction } from "@/lib/actions";
import { getStudentDashboardAnalyticsAction, getTeacherDashboardAnalyticsAction } from "@/lib/analytics-actions";
import { WIDGET_REGISTRY, getDefaultLayout, WidgetDefinition } from "@/config/widget-registry";
import { WidgetStore } from "@/components/features/dashboard/WidgetStore";
import { WidgetPlaceholder } from "@/components/features/dashboard/WidgetPlaceholder";
import { CanvasDashboard } from "./CanvasDashboard";
import { SocraticCanvas, SocraticStep, SocraticHistoryItem } from "./SocraticCanvas";

import { DashboardData } from "@/lib/analytics-actions";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableWidget } from '@/components/features/dashboard/SortableWidget';
import { Grip, Edit3, Settings2, Command, Trash2 } from 'lucide-react';

interface AIPlaygroundProps {
    user: UserType;
    initialData?: DashboardData;
}

interface WidgetConfig {
    left: string[];
    right: string[];
}

// interface Message removed in favor of ChatMessage

interface PendingAssignment {
    id: string;
    title: string;
    className: string;
    dueDate: Date;
    subjectCode: string;
}

interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    updatedAt: number;
}

type ChatMode = "standard" | "tutor" | "solver" | "summary" | "exam" | "writing" | "planner" | "grader" | "analysis";

interface ModeInfo {
    id: ChatMode;
    label: string;
    icon: any;
    description: string;
    recommendations: string[];
    contextType?: 'assignment' | 'class' | 'schedule' | 'none';
    prompt?: string;
}

const STUDENT_MODES: ModeInfo[] = [
    {
        id: "standard",
        label: "Bình thường",
        icon: MessageCircle,
        description: "Trợ lý học tập tổng quát",
        recommendations: ["Lập kế hoạch học tập tuần này", "Giải thích khái niệm lực hấp dẫn", "Cách học tốt môn Văn", "Tìm tài liệu ôn thi Toán"],
        contextType: "assignment"
    },
    {
        id: "tutor", // Changed from multiple modes to one "Learning" mode
        label: "Học tập",
        icon: GraduationCap,
        description: "Chế độ chuyên sâu cho việc học",
        recommendations: ["Giải bài tập này giúp mình", "Tóm tắt bài học lịch sử", "Kiểm tra kiến thức toán", "Viết bài văn nghị luận"],
        contextType: "assignment"
    }
];

const TEACHER_MODES: ModeInfo[] = [
    {
        id: "standard",
        label: "Chung",
        icon: MessageCircle,
        description: "Trợ lý giảng dạy tổng quát",
        recommendations: ["Soạn tin nhắn nhắc nhở lớp 12A1", "Gợi ý cách quản lý lớp học", "Tổng hợp thông báo tuần", "Tạo đề kiểm tra 15 phút"],
        contextType: "assignment"
    },
    {
        id: "planner",
        label: "Soạn giáo án",
        icon: PenTool,
        description: "Thiết kế giáo án và bài tập",
        recommendations: ["Soạn giáo án tiết 'Việt Bắc'", "Tạo bộ đề kiểm tra 15p Lý", "Gợi ý hoạt động nhóm môn Sử"],
        contextType: "class"
    },
    {
        id: "grader",
        label: "Hỗ trợ chấm bài",
        icon: CheckCircle,
        description: "Phân tích và gợi ý chấm điểm",
        recommendations: ["Chấm điểm bài làm môn Văn này", "Nhận xét bài nộp của học sinh A", "Tạo rubric chấm điểm nghị luận"],
        contextType: "assignment"
    },
    {
        id: "analysis",
        label: "Phân tích lớp",
        icon: Activity,
        description: "Phân tích hiệu suất học sinh",
        recommendations: ["Tại sao lớp 10A1 điểm thấp?", "Danh sách học sinh cần quan tâm", "Xu hướng điểm số tháng này"],
        contextType: "class"
    },
    {
        id: "summary",
        label: "Tóm tắt bài dạy",
        icon: FileText,
        description: "Cô đọng kiến thức truyền đạt",
        recommendations: ["Tóm tắt ý chính tiết học vừa rồi", "Soạn nội dung ghi bảng nhanh", "Tạo sơ đồ tư duy cho bài học"],
        contextType: "none"
    }
];

// --- Payload Parsing Utilities ---
interface AIPayload {
    type: 'flashcards' | 'structured_content' | 'options' | 'quiz' | 'mindmap' | 'text' | 'default';
    data?: any; // For flashcards, quiz, or options
    title?: string;
    content?: string; // For text type
    sections?: { heading: string; content: string }[]; // For structured content
}

const extractPayload = (content: string): { text: string; payload: AIPayload | null } => {
    const payloadRegex = /:::payload([\s\S]*?):::/;
    const match = content.match(payloadRegex);

    if (!match) return { text: content, payload: null };

    try {
        const jsonStr = match[1].trim();
        const payload = JSON.parse(jsonStr);
        const text = content.replace(match[0], "").trim();
        return { text, payload };
    } catch (e) {
        console.error("Failed to parse AI payload:", e);
        return { text: content, payload: null };
    }
};

// Extract split response (Gemini-style: :::chat::: and :::canvas:::)
interface SplitResponse {
    chatContent: string;
    canvasContent: string | null;
    isSplit: boolean;
}

const extractSplitResponse = (content: string): SplitResponse => {
    const chatRegex = /:::chat:::([\s\S]*?):::end:::/;
    const canvasRegex = /:::canvas:::([\s\S]*?):::end:::/;

    const chatMatch = content.match(chatRegex);
    const canvasMatch = content.match(canvasRegex);

    if (chatMatch && canvasMatch) {
        return {
            chatContent: chatMatch[1].trim(),
            canvasContent: canvasMatch[1].trim(),
            isSplit: true
        };
    }

    // Fallback: not split, return original content
    return {
        chatContent: content,
        canvasContent: null,
        isSplit: false
    };
};

// Extract main content for Canvas - remove greetings and intro text
const extractMainContent = (content: string): string => {
    // Patterns to detect greeting/intro lines to skip
    const greetingPatterns = [
        /^Chào bạn[!.]?.*/i,
        /^Xin chào[!.]?.*/i,
        /^Rất vui được giúp.*/i,
        /^Tuyệt vời[!.]?.*/i,
        /^Được rồi[!.]?.*/i,
        /^Dĩ nhiên[!.]?.*/i,
        /^Tất nhiên[!.]?.*/i,
        /^Vâng[!,.]?.*/i,
        /^Dạ[!,.]?.*/i,
        /^Ok[!,.]?.*/i,
        /^Okay[!,.]?.*/i,
    ];

    const lines = content.split('\n');
    let startIndex = 0;

    // Skip initial greeting/intro lines
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const line = lines[i].trim();
        if (!line) {
            startIndex = i + 1;
            continue;
        }

        const isGreeting = greetingPatterns.some(pattern => pattern.test(line));
        if (isGreeting) {
            startIndex = i + 1;
            continue;
        }

        // If line starts with a heading or structured content, keep from here
        if (line.startsWith('#') || line.startsWith('**') || line.startsWith('- ') || line.startsWith('1.')) {
            break;
        }

        // If first real paragraph is short and conversational, skip it too
        if (line.length < 150 && !line.includes(':') && i === startIndex) {
            startIndex = i + 1;
        } else {
            break;
        }
    }

    return lines.slice(startIndex).join('\n').trim();
};


// --- Typewriter Effect Component (renders markdown in realtime) ---
const TypewriterText = ({ text, speed = 8, onComplete }: { text: string; speed?: number; onComplete?: () => void }) => {
    const [displayedChars, setDisplayedChars] = useState(0);

    useEffect(() => {
        if (displayedChars >= text.length) {
            onComplete?.();
            return;
        }

        const timer = setTimeout(() => {
            // Show 4 characters at a time for faster speed
            setDisplayedChars(prev => Math.min(prev + 4, text.length));
        }, speed);

        return () => clearTimeout(timer);
    }, [displayedChars, text.length, speed, onComplete]);

    const displayed = text.slice(0, displayedChars);
    const isComplete = displayedChars >= text.length;

    return (
        <div className="prose prose-sm max-w-none dark:prose-invert break-words">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {displayed}
            </ReactMarkdown>
            {!isComplete && <span className="inline-block w-1.5 h-4 bg-blue-500 animate-pulse align-middle rounded-sm" />}
        </div>
    );
};

// --- Thinking Bar Component (compact, collapsible) ---
const ThinkingBar = ({ content, isExpanded, onToggle }: { content: string; isExpanded: boolean; onToggle: () => void }) => {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        let index = 0;
        const speed = 20;
        const interval = setInterval(() => {
            if (index < content.length) {
                setDisplayedText(content.slice(0, index + 1));
                index++;
            } else {
                clearInterval(interval);
            }
        }, speed);

        return () => clearInterval(interval);
    }, [content]);

    return (
        <div className="mb-3">
            <button
                onClick={onToggle}
                className="flex items-center gap-2 text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors"
            >
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>Suy nghĩ</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform", isExpanded && "rotate-180")} />
            </button>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2 p-3 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-700 max-h-24 overflow-y-auto font-mono break-words">
                            {displayedText}
                            {displayedText.length < content.length && (
                                <span className="inline-block w-1 h-3 bg-purple-400 ml-0.5 animate-pulse" />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Specialized Canvas Components ---
const FlashcardCanvas = ({ data }: { data: { front: string; back: string }[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex((prev) => (prev + 1) % data.length), 200);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex((prev) => (prev - 1 + data.length) % data.length), 200);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-6 space-y-8">
            <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-foreground">Flashcard Ôn Tập</h3>
                <p className="text-sm text-muted-foreground font-medium">Thẻ {currentIndex + 1} / {data.length}</p>
            </div>

            <div
                className="perspective-1000 w-full max-w-md h-96 cursor-pointer group"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <motion.div
                    initial={false}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                    className="relative w-full h-full transform-style-3d shadow-2xl rounded-3xl"
                >
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 flex flex-col items-center justify-center text-center text-white border-4 border-white/20">
                        <span className="text-sm font-bold uppercase tracking-widest opacity-70 mb-4">Câu hỏi / Thuật ngữ</span>
                        <h4 className="text-3xl font-bold leading-tight">{data[currentIndex].front}</h4>
                        <div className="absolute bottom-6 text-xs font-semibold opacity-60 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-card rounded-full animate-pulse" />
                            Chạm để lật
                        </div>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-card rounded-3xl p-8 flex flex-col items-center justify-center text-center border border-border">
                        <span className="text-sm font-bold uppercase tracking-widest text-emerald-500 mb-4">Đáp án</span>
                        <div className="prose prose-lg text-foreground leading-relaxed font-medium">
                            {data[currentIndex].back}
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={handlePrev}
                    className="p-4 rounded-full bg-card border border-border text-muted-foreground hover:text-indigo-600 hover:border-indigo-200 hover:shadow-lg transition-all"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={handleNext}
                    className="p-4 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

// --- Quiz Canvas Component ---
interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
}

const QuizCanvas = ({ data, title }: { data: QuizQuestion[]; title?: string }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>(new Array(data.length).fill(null));

    const currentQuestion = data[currentIndex];
    const isCompleted = currentIndex >= data.length || showResult;

    const handleSelectAnswer = (index: number) => {
        if (answers[currentIndex] !== null) return; // Already answered
        const newAnswers = [...answers];
        newAnswers[currentIndex] = index;
        setAnswers(newAnswers);
        setSelectedAnswer(index);

        if (index === currentQuestion.correctIndex) {
            setScore(s => s + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < data.length - 1) {
            setCurrentIndex(i => i + 1);
            setSelectedAnswer(answers[currentIndex + 1]);
        } else {
            setShowResult(true);
        }
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setScore(0);
        setAnswers(new Array(data.length).fill(null));
    };

    if (showResult) {
        const percentage = Math.round((score / data.length) * 100);
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 space-y-6">
                <div className={cn(
                    "w-32 h-32 rounded-full flex items-center justify-center text-white text-4xl font-black",
                    percentage >= 80 ? "bg-emerald-500" : percentage >= 60 ? "bg-amber-500" : "bg-rose-500"
                )}>
                    {percentage}%
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-foreground">
                        {percentage >= 80 ? "Xuất sắc! 🎉" : percentage >= 60 ? "Khá tốt! 👍" : "Cần cố gắng thêm! 💪"}
                    </h3>
                    <p className="text-muted-foreground">Bạn trả lời đúng {score}/{data.length} câu</p>
                </div>
                <button
                    onClick={handleRestart}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                >
                    Làm lại
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-muted-foreground">Câu {currentIndex + 1}/{data.length}</span>
                <div className="flex-1 mx-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / data.length) * 100}%` }}
                    />
                </div>
                <span className="text-sm font-bold text-emerald-600">{score} điểm</span>
            </div>

            {/* Question */}
            <div className="bg-card dark:bg-card p-6 rounded-2xl border border-border shadow-sm">
                <h3 className="text-xl font-bold text-foreground mb-6">{currentQuestion.question}</h3>

                <div className="space-y-3">
                    {currentQuestion.options.map((option, idx) => {
                        const isSelected = selectedAnswer === idx;
                        const isCorrect = idx === currentQuestion.correctIndex;
                        const hasAnswered = answers[currentIndex] !== null;

                        return (
                            <button
                                key={idx}
                                onClick={() => handleSelectAnswer(idx)}
                                disabled={hasAnswered}
                                className={cn(
                                    "w-full p-4 rounded-xl text-left transition-all font-medium",
                                    hasAnswered
                                        ? isCorrect
                                            ? "bg-emerald-100 text-emerald-800 border-2 border-emerald-500"
                                            : isSelected
                                                ? "bg-rose-100 text-rose-800 border-2 border-rose-500"
                                                : "bg-muted text-muted-foreground"
                                        : isSelected
                                            ? "bg-indigo-100 text-indigo-800 border-2 border-indigo-500"
                                            : "bg-muted hover:bg-muted text-foreground/80"
                                )}
                            >
                                <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                                {option}
                            </button>
                        );
                    })}
                </div>

                {/* Explanation */}
                {answers[currentIndex] !== null && currentQuestion.explanation && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl text-blue-800 text-sm">
                        <strong>Giải thích:</strong> {currentQuestion.explanation}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex justify-end">
                <button
                    onClick={handleNext}
                    disabled={answers[currentIndex] === null}
                    className={cn(
                        "px-6 py-3 rounded-xl font-semibold transition-all",
                        answers[currentIndex] !== null
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : "bg-gray-100 text-muted-foreground/80 cursor-not-allowed"
                    )}
                >
                    {currentIndex < data.length - 1 ? "Câu tiếp theo" : "Xem kết quả"}
                </button>
            </div>
        </div>
    );
};

// --- Mind Map Canvas Component (Simple display) ---
const MindMapCanvas = ({ data }: { data: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(data);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6">
            <h3 className="text-xl font-bold text-foreground mb-2">Sơ đồ tư duy</h3>
            <p className="text-sm text-muted-foreground mb-6">Copy code và paste vào <a href="https://mermaid.live" target="_blank" rel="noopener" className="text-blue-600 underline">mermaid.live</a> để xem sơ đồ</p>
            <div className="w-full max-w-3xl bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                    <span className="text-sm font-mono text-muted-foreground/80">mermaid</span>
                    <button
                        onClick={handleCopy}
                        className={cn(
                            "px-3 py-1 rounded-lg text-xs font-semibold transition-colors",
                            copied ? "bg-emerald-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        )}
                    >
                        {copied ? "Đã copy!" : "Copy"}
                    </button>
                </div>
                <pre className="p-4 text-sm text-emerald-400 font-mono overflow-x-auto max-h-96">
                    <code>{data}</code>
                </pre>
            </div>
        </div>
    );
};

const LessonPlanCanvas = ({ title, sections }: { title: string; sections: any[] }) => {
    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="bg-card dark:bg-card rounded-2xl p-8 border border-border shadow-sm text-center space-y-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-black text-foreground leading-tight">{title}</h1>
                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground">
                    <span className="bg-gray-100 px-3 py-1 rounded-full">Giáo án</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-full">{sections.length} phần</span>
                </div>
            </div>

            <div className="space-y-6">
                {sections.map((section, idx) => (
                    <div key={idx} className="bg-card dark:bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            {section.heading}
                        </h3>
                        <div className="prose prose-sm text-muted-foreground max-w-none prose-p:leading-loose">
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{section.content}</ReactMarkdown>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-dashed border-border">
                <button className="px-5 py-2.5 bg-gray-100 hover:bg-muted/80 text-foreground/80 rounded-xl font-bold transition-colors">
                    Xuất PDF
                </button>
                <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-colors">
                    Lưu vào Thư viện
                </button>
            </div>
        </div>
    );
};

export function AIPlayground({ user, initialData }: AIPlaygroundProps) {
    const isTeacher = user?.role === 'teacher';
    // --- State ---
    const chatFetcherRef = useRef<any>(null);
    const {
        messages,
        setMessages,
        input: inputValue,
        setInput: setInputValue,
        loading: isLoading,
        sendMessage
    } = useAIChat({
        fetcher: useCallback((...args: any[]) => {
            if (chatFetcherRef.current) {
                return chatFetcherRef.current(...args);
            }
            throw new Error("Fetcher not initialized");
        }, [])
    });

    const [chatMode, setChatMode] = useState<ChatMode>("standard");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- Widget State ---
    const [isWidgetStoreOpen, setIsWidgetStoreOpen] = useState(false);
    const [activeWidgetColumn, setActiveWidgetColumn] = useState<'left' | 'right' | null>(null);
    const [widgetsConfig, setWidgetsConfig] = useState<WidgetConfig>({
        left: [],
        right: []
    });

    const [isEditingWidgets, setIsEditingWidgets] = useState(false);
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setWidgetsConfig((items) => {
                // Determine which column the widget is in
                const leftIdx = items.left.indexOf(active.id as string);
                const rightIdx = items.right.indexOf(active.id as string);

                const column = rightIdx !== -1 ? 'right' : (leftIdx !== -1 ? 'left' : null);

                if (!column) return items;

                const oldIndex = items[column].indexOf(active.id as string);
                const newIndex = items[column].indexOf(over.id as string);

                if (oldIndex === -1 || newIndex === -1) return items;

                const newConfig = {
                    ...items,
                    [column]: arrayMove(items[column], oldIndex, newIndex),
                };

                // Persist
                if (user) {
                    localStorage.setItem(`miqix_widgets_${user.id}`, JSON.stringify(newConfig));
                }
                return newConfig;
            });
        }
    };

    // --- Load Widget Config ---
    useEffect(() => {
        if (!user) return;

        const storedConfig = localStorage.getItem(`miqix_widgets_${user.id}`);
        if (storedConfig) {
            try {
                setWidgetsConfig(JSON.parse(storedConfig));
            } catch (e) {
                console.error("Failed to parse widget config", e);
                setWidgetsConfig(getDefaultLayout(user.role as any));
            }
        } else {
            setWidgetsConfig(getDefaultLayout(user.role as any));
        }
    }, [user]);

    // --- Widget Handlers ---
    const handleOpenWidgetStore = (column: 'left' | 'right') => {
        setActiveWidgetColumn(column);
        setIsWidgetStoreOpen(true);
    };

    const handleAddWidget = (widgetId: string) => {
        if (!activeWidgetColumn) return;

        const newConfig = {
            ...widgetsConfig,
            [activeWidgetColumn]: [...widgetsConfig[activeWidgetColumn], widgetId]
        };

        setWidgetsConfig(newConfig);
        localStorage.setItem(`miqix_widgets_${user.id}`, JSON.stringify(newConfig));
        setIsWidgetStoreOpen(false);
    };

    const handleRemoveWidget = (widgetId: string, column: 'left' | 'right') => {
        const newConfig = {
            ...widgetsConfig,
            [column]: widgetsConfig[column].filter(id => id !== widgetId)
        };
        setWidgetsConfig(newConfig);
        localStorage.setItem(`miqix_widgets_${user.id}`, JSON.stringify(newConfig));
    };

    // Helper to get active widgets for a column
    const getActiveWidgets = (column: 'left' | 'right') => {
        return widgetsConfig[column].map(id => WIDGET_REGISTRY[id]).filter(Boolean);
    };

    // --- Context & Refs ---
    const MODES = user.role === 'teacher' ? TEACHER_MODES : STUDENT_MODES;
    // isTyping replaced by isLoading
    const [upcomingEvents, setUpcomingEvents] = useState<ScheduleEvent[]>([]);
    const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);
    const [showModeMenu, setShowModeMenu] = useState(false);
    const [analytics, setAnalytics] = useState<any>(null);

    // Chat History States
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);

    // Canvas State
    const { isCanvasOpen, setCanvasOpen: setIsCanvasOpen } = useAIContext();
    const [canvasContent, setCanvasContent] = useState<any>(null); // Changed to any to support objects
    const [canvasViewMode, setCanvasViewMode] = useState<"dashboard" | "content" | "flashcards" | "lesson_plan" | "socratic">("dashboard");
    const [isEditingContent, setIsEditingContent] = useState(false); // New state for editing mode

    // Socratic State
    const [socraticCurrentStep, setSocraticCurrentStep] = useState<SocraticStep | null>(null);
    const [socraticHistory, setSocraticHistory] = useState<SocraticHistoryItem[]>([]);
    const [isSocraticLoading, setIsSocraticLoading] = useState(false);
    const [latestMessageId, setLatestMessageId] = useState<string | null>(null); // Track latest AI message for typewriter
    const [thinkingExpanded, setThinkingExpanded] = useState(true); // Thinking bar expanded by default

    // New AI Config States
    const [isThinkingEnabled, setIsThinkingEnabled] = useState(false);
    const [isCanvasMode, setIsCanvasMode] = useState(false); // Force Canvas Output
    const [showToolHub, setShowToolHub] = useState(false); // Toggle between greeting and tool hub
    const [targetAssignmentIds, setTargetAssignmentIds] = useState<string[]>([]);
    const [targetClassIds, setTargetClassIds] = useState<string[]>([]);
    const [allAssignments, setAllAssignments] = useState<any[]>([]);
    const [allClasses, setAllClasses] = useState<any[]>([]);
    const [showAssignmentSelector, setShowAssignmentSelector] = useState(false);
    const [showClassSelector, setShowClassSelector] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState("");

    // Rate Limiting States
    const [sendCooldown, setSendCooldown] = useState(false);
    const [messageTimestamps, setMessageTimestamps] = useState<number[]>([]);
    const RATE_LIMIT_MAX = 10; // Max messages per minute
    const RATE_LIMIT_WINDOW = 60000; // 1 minute in ms
    const COOLDOWN_MS = 2000; // 2 seconds cooldown

    const menuRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea logic
    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height to recalculate
            const newHeight = Math.min(textarea.scrollHeight, 200); // Limit to 200px
            textarea.style.height = `${newHeight}px`;
        }
    }, []);

    useEffect(() => {
        adjustTextareaHeight();
    }, [inputValue, adjustTextareaHeight]);

    // Restore Sidebar on Desktop (Fix "UI UX cũ đâu")
    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            setIsHistoryVisible(true);
        }
    }, []);

    // State for Socratic Mode
    const [isSocraticMode, setIsSocraticMode] = useState<boolean>(false);

    // Slash Commands Definition
    const SLASH_COMMANDS = [
        {
            command: "/reset", description: "Xóa ngữ cảnh & lịch sử", icon: Trash2, color: "text-red-500", action: () => {
                createNewChat();
                setTargetAssignmentIds([]);
                setTargetClassIds([]);
                setSearchQuery("");
            }
        },
        {
            command: "/canvas", description: "Mở chế độ Canvas", icon: Sparkles, color: "text-purple-500", action: () => {
                setIsCanvasMode(true);
                setSearchQuery("");
            }
        },
        {
            command: "/web", description: "Tìm kiếm thông tin từ Web", icon: Search, color: "text-blue-500", action: () => {
                // Mock web search toggle
                setSearchQuery("");
                alert("Đã bật chế độ tìm kiếm Web (Mock)");
            }
        },
        {
            command: "/image", description: "Tạo hình ảnh minh họa", icon: Zap, color: "text-orange-500", action: () => {
                setSearchQuery("");
                handleSend("Tạo một hình ảnh về...");
            }
        }
    ];

    const toggleAssignment = (id: string) => {
        setTargetAssignmentIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleClass = (id: string) => {
        setTargetClassIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Initialize state from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('aiPlayground_socraticMode');
        if (saved) {
            setIsSocraticMode(JSON.parse(saved));
        }
    }, []);

    // Save state to local storage when changed
    useEffect(() => {
        localStorage.setItem('aiPlayground_socraticMode', JSON.stringify(isSocraticMode));
    }, [isSocraticMode]);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowModeMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Reset context selectors when changing AI mode
    useEffect(() => {
        setTargetAssignmentIds([]);
        setTargetClassIds([]);
        setShowAssignmentSelector(false);
        setShowClassSelector(false);
    }, [chatMode]);

    // Load real data for smart responses and chat history
    useEffect(() => {
        async function loadData() {
            try {
                // If we have initialData, use it to avoid redundant fetches
                if (initialData) {
                    const now = new Date();
                    const todayEvents = initialData.schedule
                        .filter(e => isToday(new Date(e.start)) && isAfter(new Date(e.end), now))
                        .slice(0, 3);
                    setUpcomingEvents(todayEvents);
                    setAllAssignments(initialData.allAssignments);
                    setAllClasses(initialData.allClasses);
                    setAnalytics(initialData.analytics);

                    const pending = user.role === 'teacher'
                        ? initialData.allAssignments
                            .filter((a: any) => a.teacherId === user.id)
                            .slice(0, 3)
                            .map((a: any) => ({
                                id: a.id,
                                title: a.title,
                                className: a.assignmentClasses?.[0]?.class?.name || 'Lớp học',
                                dueDate: new Date(a.dueDate),
                                subjectCode: (a.subject || 'Học').substring(0, 3)
                            }))
                        : initialData.allAssignments
                            .filter((a: any) => a.status !== 'completed')
                            .sort((a: any) => new Date(a.dueDate).getTime() - new Date().getTime())
                            .slice(0, 3)
                            .map((a: any) => ({
                                id: a.id,
                                title: a.title,
                                className: a.assignmentClasses?.[0]?.class?.name || 'Lớp học',
                                dueDate: new Date(a.dueDate),
                                subjectCode: (a.subject || 'Học').substring(0, 3)
                            }));
                    setPendingAssignments(pending);
                } else {
                    // Fallback to individual fetches if initialData is not provided
                    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

                    const [scheduleData, assignmentsData, classesData, analyticsData] = await Promise.all([
                        getAggregatedScheduleAction(weekStart.toISOString()),
                        getAssignmentsAction(),
                        getClassesAction(),
                        user.role === 'teacher' ? getTeacherDashboardAnalyticsAction() : getStudentDashboardAnalyticsAction()
                    ]);

                    const now = new Date();
                    const todayEvents = scheduleData?.events
                        ? scheduleData.events
                            .filter(e => isToday(new Date(e.start)) && isAfter(new Date(e.end), now))
                            .slice(0, 3)
                        : [];
                    setUpcomingEvents(todayEvents);
                    setAllAssignments(assignmentsData || []);
                    setAllClasses(classesData || []);
                    setAnalytics(analyticsData);

                    const validAssignments = Array.isArray(assignmentsData) ? assignmentsData : [];

                    const pending = user.role === 'teacher'
                        ? validAssignments
                            .filter((a: any) => a.teacherId === user.id)
                            .slice(0, 3)
                            .map((a: any) => ({
                                id: a.id,
                                title: a.title,
                                className: a.assignmentClasses?.[0]?.class?.name || 'Lớp học',
                                dueDate: new Date(a.dueDate),
                                subjectCode: (a.subject || 'Học').substring(0, 3)
                            }))
                        : validAssignments
                            .filter((a: any) => a.status !== 'completed')
                            .sort((a: any) => new Date(a.dueDate).getTime() - new Date().getTime())
                            .slice(0, 3)
                            .map((a: any) => ({
                                id: a.id,
                                title: a.title,
                                className: a.assignmentClasses?.[0]?.class?.name || 'Lớp học',
                                dueDate: new Date(a.dueDate),
                                subjectCode: (a.subject || 'Học').substring(0, 3)
                            }));
                    setPendingAssignments(pending);
                }

                // Load Chat History (always from local storage for now)
                const savedSessions = localStorage.getItem("miqix_chat_sessions");
                if (savedSessions) {
                    const parsed = JSON.parse(savedSessions);
                    setSessions(parsed);
                }
            } catch (error) {
                console.error("Error loading data:", error);
            }
        };

        loadData();
    }, [initialData, user.id, user.role]);

    // Session Management Functions
    const createNewChat = () => {
        setMessages([]);
        setCurrentSessionId(null);
        setCanvasContent(null);
        setCanvasViewMode("dashboard");
        if (window.innerWidth < 768) setIsHistoryVisible(false); // Close history on mobile after new chat
    };

    const switchSession = (sessionId: string) => {
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
            setMessages(session.messages);
            setCurrentSessionId(session.id);
            if (window.innerWidth < 768) setIsHistoryVisible(false);
        }
    };

    const deleteSession = (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering switchSession
        const updated = sessions.filter(s => s.id !== sessionId);
        setSessions(updated);
        localStorage.setItem("miqix_chat_sessions", JSON.stringify(updated));
        if (currentSessionId === sessionId) {
            createNewChat();
        }
    };

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        // Use a small timeout to ensure the DOM has updated
        setTimeout(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({
                    behavior,
                    block: "end",
                    inline: "nearest"
                });
            }
        }, 100);
    };

    // Track previous messages length to only scroll on new messages
    const prevMessagesLengthRef = useRef(messages.length);

    // Unified scroll to bottom effect
    useEffect(() => {
        if (messages.length === 0) return;

        // Is this a newly added message?
        const isNewMessage = messages.length > prevMessagesLengthRef.current;
        prevMessagesLengthRef.current = messages.length;

        // Use smooth scroll for new messages or state changes (canvas/typing)
        // Use instant scroll (auto) for session changes to prevent jumping
        const behavior = isNewMessage ? "smooth" : "auto";

        scrollToBottom(behavior as ScrollBehavior);
    }, [messages.length, currentSessionId, isCanvasOpen, isLoading, thinkingExpanded]);

    const getDueLabel = (date: Date) => {
        const now = new Date();
        const diff = date.getTime() - now.getTime();
        const hours = diff / (1000 * 60 * 60);
        if (hours < 0) return { text: "Quá hạn", color: "text-red-600 bg-red-50" };
        if (hours < 24) return { text: "Hôm nay", color: "text-orange-500 bg-orange-50" };
        return { text: format(date, "dd/MM"), color: "text-muted-foreground bg-muted" };
    };

    const handleQuickAction = (action: "assignments" | "grades" | "flashcards" | "history" | "classes") => {
        let content = "";
        const canvasData = null;

        if (action === "assignments") {
            if (pendingAssignments.length === 0) {
                content = "Tuyệt vời! Bạn không có bài tập nào sắp tới. Bạn đã hoàn thành hết rồi! 🎉";
            } else {
                content = "📝 **Bài tập sắp tới của bạn:**\n\n";
                pendingAssignments.forEach((a, idx) => {
                    const due = getDueLabel(a.dueDate);
                    content += `${idx + 1}. **${a.title}**\n   📚 ${a.className}\n   ⏰ ${due.text}\n\n`;
                });
                content += "Bạn muốn mình hỗ trợ môn nào trước?";
            }
        } else if (action === "grades") {
            content = "Hiện tại mình đang cập nhật dữ liệu điểm số mới nhất từ giáo viên. Bạn muốn xem điểm của môn học cụ thể nào không?";
        } else if (action === "flashcards") {
            handleSend("Tạo flashcard về chủ đề này.");
            return;
            // setCanvasContent({ type: 'flashcards', data: MOCK_FLASHCARDS });
        } else if (action === "history") {
            setIsHistoryVisible(true);
            return;
        }

        const aiMsg: ChatMessage = {
            id: Date.now().toString(),
            role: "ai",
            content: content,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, aiMsg]);

        // Demo Canvas triggering if needed
        if (canvasData) {
            setCanvasContent(canvasData);
            setCanvasViewMode("content");
            setIsCanvasOpen(true);
        }
    };

    // --- Chat Logic using useAIChat ---

    // 1. Define the fetcher (encapsulates API logic)
    const chatFetcher = useCallback(async (message: string, context: string, history: ChatMessage[]) => {
        const payload = {
            message,
            mode: chatMode,
            userRole: user.role,
            includeReasoning: isThinkingEnabled,
            forceCanvas: isCanvasMode,
            socraticMode: isSocraticMode,
            targetAssignmentIds,
            targetClassIds,
            previousMessages: history.slice(-10).map((m: any) => ({
                role: m.role === 'ai' ? 'assistant' : m.role, // normalize
                content: m.content
            })),
            context: {
                assignments: pendingAssignments.slice(0, 5).map(a => `${a.title} (${a.subjectCode}) - Due: ${format(a.dueDate, 'dd/MM')}`),
                eventsToday: (upcomingEvents || []).filter(e => isToday(e.start)).map(e => `${e.title} at ${format(e.start, 'HH:mm')}`),
                analytics: analytics ? {
                    averageScore: analytics.myAverageScore,
                    submissionRate: analytics.mySubmissionRate,
                    attendance: analytics.myAttendanceRate
                } : null,
                socraticContext: socraticCurrentStep ? {
                    currentStep: socraticCurrentStep.step_number,
                    historyCount: socraticHistory.length
                } : undefined
            }
        };

        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        setIsSocraticLoading(false);

        if (data.error) {
            throw new Error(`⚠️ Lỗi AI: ${data.details || data.error}`);
        }

        // Response Processing
        const rawReply = data.reply || "Xin lỗi, mình gặp chút trục trặc.";
        const splitResponse = extractSplitResponse(rawReply);

        let chatDisplayContent: string;
        let canvasDisplayContent: string | null = null;
        const messageId = (Date.now() + 1).toString();

        if (splitResponse.isSplit) {
            chatDisplayContent = splitResponse.chatContent;
            canvasDisplayContent = splitResponse.canvasContent;
        } else {
            const { text: cleanText, payload: extractedPayload } = extractPayload(rawReply);
            chatDisplayContent = cleanText || rawReply;

            if (extractedPayload) {
                if (extractedPayload.type === 'flashcards') {
                    setCanvasContent(extractedPayload);
                    setCanvasViewMode("flashcards");
                    setIsCanvasOpen(true);
                } else if (extractedPayload.type === 'structured_content' || extractedPayload.type === 'quiz') {
                    setCanvasContent(extractedPayload);
                    setCanvasViewMode("content");
                    setIsCanvasOpen(true);
                }
            }

            // Socratic Logic
            if (isSocraticMode) {
                try {
                    const parsed = typeof rawReply === 'string' ? JSON.parse(rawReply) : rawReply;
                    if (parsed && parsed.type === 'socratic_step') {
                        const stepData = parsed as SocraticStep;

                        // History handling
                        if (socraticCurrentStep && stepData.step_number > socraticCurrentStep.step_number) {
                            setSocraticHistory(prev => [...prev, {
                                step: socraticCurrentStep,
                                userAnswer: history[history.length - 1]?.role === 'user' ? history[history.length - 1].content : undefined
                            }]);
                        } else if (socraticCurrentStep && stepData.status === 'correct_and_next') {
                            setSocraticHistory(prev => [...prev, {
                                step: socraticCurrentStep,
                                userAnswer: message
                            }]);
                        }

                        setSocraticCurrentStep(stepData);
                        setCanvasViewMode('socratic');
                        setIsCanvasOpen(true);

                        // Return special Socratic message structure
                        setLatestMessageId((Date.now() + 2).toString()); // Different ID
                        // We need to return the content for useAIChat to add to messages
                        // But Socratic step adds a "virtual" message. 
                        // We will return the formatted content.
                        return {
                            id: messageId,
                            reply: `**Socratic Step ${stepData.step_number}:** ${stepData.question}`,
                            reasoning: data.reasoning,
                            hasCanvasContent: true,
                            timestamp: Date.now()
                        };
                    }
                } catch (e) {
                    console.log("Not a JSON socratic response", e);
                }
            }
        }

        if (canvasDisplayContent) {
            setCanvasContent({ type: 'text', content: canvasDisplayContent });
            setCanvasViewMode("content");
            setIsCanvasOpen(true);
        }

        // Side effect: existing logic setLatestMessageId
        setLatestMessageId(messageId);

        return {
            id: messageId,
            reply: chatDisplayContent,
            reasoning: data.reasoning,
            hasCanvasContent: !!canvasDisplayContent
        };

    }, [chatMode, user.role, isThinkingEnabled, isCanvasMode, isSocraticMode, targetAssignmentIds, targetClassIds, pendingAssignments, upcomingEvents, analytics, socraticCurrentStep, socraticHistory]);

    // 2. Sync fetcher to ref
    useEffect(() => {
        chatFetcherRef.current = chatFetcher;
    }, [chatFetcher]);

    // 3. Wrapper for UI interactions (Rate limiting, etc)
    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || inputValue;
        if (!textToSend.trim() || isLoading || sendCooldown) return;

        // Rate limit
        const now = Date.now();
        const recentMessages = messageTimestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
        if (recentMessages.length >= RATE_LIMIT_MAX) {
            alert(`Bạn đã gửi quá ${RATE_LIMIT_MAX} tin nhắn trong 1 phút. Vui lòng đợi một chút!`);
            return;
        }
        setMessageTimestamps([...recentMessages, now]);
        setSendCooldown(true);
        setTimeout(() => setSendCooldown(false), COOLDOWN_MS);

        await sendMessage(textToSend);
    };

    // 4. Session Management Sync
    useEffect(() => {
        if (messages.length === 0) return;

        let updatedSessions = [...sessions];
        // If we don't have a current session ID but have messages, create one
        // (This logic was in handleSend, now reactive)

        // Wait, if I create a new session here, it might loop if I setSessions -> render.
        // But messages change is the trigger.

        if (!currentSessionId) {
            const firstUserMsg = messages.find(m => m.role === 'user');
            if (firstUserMsg) {
                const newId = Date.now().toString();
                const newSession: ChatSession = {
                    id: newId,
                    title: firstUserMsg.content.slice(0, 40) + (firstUserMsg.content.length > 40 ? "..." : ""),
                    messages: messages as any[], // Safe cast
                    updatedAt: Date.now()
                };
                setCurrentSessionId(newId);
                setSessions([newSession, ...updatedSessions]);
                localStorage.setItem("miqix_chat_sessions", JSON.stringify([newSession, ...updatedSessions]));
            }
        } else {
            updatedSessions = updatedSessions.map(s =>
                s.id === currentSessionId
                    ? { ...s, messages: messages as any[], updatedAt: Date.now() }
                    : s
            ).sort((a, b) => b.updatedAt - a.updatedAt);
            setSessions(updatedSessions);
            localStorage.setItem("miqix_chat_sessions", JSON.stringify(updatedSessions));
        }
    }, [messages, currentSessionId]); // Be careful of loops. messages change -> update session. Session update doesn't change messages. Safe.



    const currentModeInfo = MODES.find(m => m.id === chatMode) || MODES[0];

    return (
        <div className="page-container !p-0 flex overflow-hidden font-sans text-foreground relative">
            {/* LEFT SIDEBAR - CHAT HISTORY */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-10 w-72 bg-muted border-r border-border transition-all duration-300 transform md:relative md:translate-x-0 flex flex-col overflow-hidden",
                isHistoryVisible ? "translate-x-0" : "-translate-x-full md:absolute md:w-0 md:opacity-0 pointer-events-none"
            )}>
                <div className="p-4 flex flex-col h-full">
                    <button
                        onClick={createNewChat}
                        className="flex items-center gap-3 w-full p-3 bg-card hover:bg-muted border border-border rounded-2xl transition-all shadow-sm mb-6 group"
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-foreground/80">Đoạn chat mới</span>
                    </button>

                    <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                        <h3 className="text-[11px] font-black text-muted-foreground/80 uppercase tracking-widest px-3 mb-2">Gần đây</h3>
                        {sessions.length > 0 ? (
                            sessions.map(session => (
                                <div
                                    key={session.id}
                                    onClick={() => switchSession(session.id)}
                                    className={cn(
                                        "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                                        currentSessionId === session.id ? "bg-card dark:bg-card shadow-sm border border-border" : "hover:bg-muted/80/50"
                                    )}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                                        <MessageSquare className={cn("w-4 h-4 shrink-0", currentSessionId === session.id ? "text-blue-600" : "text-muted-foreground/80")} />
                                        <div className="flex flex-col flex-1 overflow-hidden">
                                            <span className={cn(
                                                "text-sm truncate",
                                                currentSessionId === session.id ? "font-bold text-foreground" : "text-muted-foreground font-medium"
                                            )}>
                                                {session.title}
                                            </span>
                                            {(session as any).source && (
                                                <span className="text-[10px] text-muted-foreground/80 font-medium">
                                                    Từ: {(session as any).source}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => deleteSession(session.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted/80 rounded-md transition-all"
                                    >
                                        <X className="w-3.5 h-3.5 text-muted-foreground/80" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-xs text-muted-foreground/80 font-medium">Chưa có lịch sử.</div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-border mt-auto">
                        <div className="flex items-center gap-3 p-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-foreground/80">MiQiX Pro</p>
                                <p className="text-[10px] text-muted-foreground">Mở khóa sức mạnh AI</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Overlay for mobile history */}
                {isHistoryVisible && (
                    <div
                        className="fixed inset-0 bg-black/20 z-40 md:hidden"
                        onClick={() => setIsHistoryVisible(false)}
                    />
                )}

                {/* MAIN CHAT AREA */}
                <div className={cn(
                    "flex flex-col relative transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                    isCanvasOpen ? "w-1/2" : "w-full"
                )}>
                    {/* Header */}
                    <header className="h-16 flex items-center justify-between px-6 border-b border-border shrink-0 sticky top-0 bg-card/80 backdrop-blur-md z-20">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsHistoryVisible(!isHistoryVisible)}
                                className="p-2 hover:bg-muted rounded-xl text-muted-foreground transition-colors"
                                title="Lịch sử chat"
                            >
                                <PanelLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <h1 className="font-bold text-foreground group flex items-center gap-1.5">
                                    {MODES.find(m => m.id === chatMode)?.label}
                                    <ChevronDown className="w-4 h-4 text-muted-foreground/80" />
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative group z-30">
                                <Search className="w-5 h-5 text-muted-foreground/80 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm, lệnh, tài nguyên..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-48 md:w-80 bg-muted border border-border rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all outline-none"
                                />

                                {/* Smart Search Dropdown */}
                                <AnimatePresence>
                                    {searchQuery.trim().length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border overflow-hidden"
                                        >
                                            <div className="max-h-[60vh] overflow-y-auto thin-scrollbar p-2 space-y-4">

                                                {/* 1. Results from Context (Assignments & Classes) */}
                                                {(allAssignments.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ||
                                                    allClasses.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0) && (
                                                        <div>
                                                            <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider flex items-center gap-2">
                                                                <Command className="w-3 h-3" /> Tài nguyên & Lệnh
                                                            </div>
                                                            <div className="space-y-1">
                                                                {allAssignments.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3).map(a => {
                                                                    const isSelected = targetAssignmentIds.includes(a.id);
                                                                    return (
                                                                        <button
                                                                            key={a.id}
                                                                            onClick={() => toggleAssignment(a.id)}
                                                                            className={cn(
                                                                                "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors group",
                                                                                isSelected ? "bg-blue-50" : "hover:bg-blue-50"
                                                                            )}
                                                                        >
                                                                            <div className={cn(
                                                                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                                                                                isSelected ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
                                                                            )}>
                                                                                {isSelected ? <CheckCircle className="w-4 h-4" /> : <ListTodo className="w-4 h-4" />}
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-xs font-bold text-foreground">{a.title}</div>
                                                                                <div className="text-[10px] text-blue-600 font-medium">
                                                                                    {isSelected ? "Đang chọn" : "Thêm vào ngữ cảnh"}
                                                                                </div>
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                                {allClasses.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3).map(c => {
                                                                    const isSelected = targetClassIds.includes(c.id);
                                                                    return (
                                                                        <button
                                                                            key={c.id}
                                                                            onClick={() => toggleClass(c.id)}
                                                                            className={cn(
                                                                                "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors group",
                                                                                isSelected ? "bg-indigo-50" : "hover:bg-indigo-50"
                                                                            )}
                                                                        >
                                                                            <div className={cn(
                                                                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                                                                                isSelected ? "bg-indigo-500 text-white" : "bg-indigo-100 text-indigo-600"
                                                                            )}>
                                                                                {isSelected ? <CheckCircle className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-xs font-bold text-foreground">{c.name}</div>
                                                                                <div className="text-[10px] text-indigo-600 font-medium">
                                                                                    {isSelected ? "Đang chọn" : "Thêm vào ngữ cảnh"}
                                                                                </div>
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                {/* 2. Results from Current Chat */}
                                                {messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
                                                    <div>
                                                        <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider flex items-center gap-2">
                                                            <MessageSquare className="w-3 h-3" /> Trong hội thoại này
                                                        </div>
                                                        <div className="space-y-1">
                                                            {messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map(m => (
                                                                <button
                                                                    key={m.id}
                                                                    onClick={() => {
                                                                        const el = document.getElementById(`msg-${m.id}`);
                                                                        if (el) {
                                                                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                            el.classList.add('bg-yellow-50/50'); // Highlight effect
                                                                            setTimeout(() => el.classList.remove('bg-yellow-50/50'), 2000);
                                                                        }
                                                                        setSearchQuery("");
                                                                    }}
                                                                    className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted text-left transition-colors group"
                                                                >
                                                                    <div className={cn(
                                                                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                                                        m.role === 'user' ? "bg-gray-200 text-muted-foreground" : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                                                                    )}>
                                                                        {m.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-xs text-muted-foreground mb-0.5 font-medium">{m.role === 'user' ? "Bạn" : "AI"} • <span className="text-[10px] opacity-70">Vừa xong</span></div>
                                                                        <div className="text-xs text-foreground line-clamp-2 leading-relaxed">
                                                                            {m.content.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) =>
                                                                                part.toLowerCase() === searchQuery.toLowerCase()
                                                                                    ? <span key={i} className="bg-yellow-200 text-yellow-900 rounded-[2px] px-0.5">{part}</span>
                                                                                    : part
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Empty State */}
                                                {messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 &&
                                                    allAssignments.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 &&
                                                    allClasses.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 &&
                                                    !searchQuery.startsWith("/") && (
                                                        <div className="py-8 text-center">
                                                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                                                                <Search className="w-5 h-5 text-gray-300" />
                                                            </div>
                                                            <p className="text-xs text-muted-foreground font-medium">Không tìm thấy kết quả nào</p>
                                                        </div>
                                                    )}
                                            </div>

                                            {/* Footer */}
                                            <div className="px-4 py-2 bg-muted/50 border-t border-border flex items-center justify-between">
                                                <span className="text-[10px] text-muted-foreground/80"><strong>Enter</strong> để chọn kết quả đầu tiên</span>
                                                <span className="text-[10px] text-muted-foreground/80"><strong>Esc</strong> để đóng</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="hidden sm:flex items-center bg-gray-100 rounded-full px-3 py-1 gap-2">
                                <Zap className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">MiMo V2 Flash</span>
                            </div>
                        </div>
                    </header>

                    {/* Chat Messages */}
                    <div className="flex-1 flex overflow-hidden pt-16 pb-32 px-4">
                        <div className={cn(
                            "mx-auto transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex gap-6 w-full",
                            messages.length === 0 ? "" : "max-w-2xl px-4"
                        )}>
                            {/* Messages Content */}
                            {messages.length === 0 ? (
                                <div className="flex flex-col 2xl:flex-row gap-6 w-full min-h-[75vh] items-stretch justify-center animate-in fade-in zoom-in duration-500">
                                    {/* Left Widgets */}
                                    {!isCanvasOpen && (
                                        <div className="hidden 2xl:flex 2xl:flex-col w-80 2xl:w-88 shrink-0 h-[calc(100vh-180px)]">
                                            {/* Widget Column Header - Left Side */}
                                            <div className="flex items-center justify-between mb-3 px-1">
                                                <h3 className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider">Tiện ích</h3>
                                                <button
                                                    onClick={() => setIsEditingWidgets(!isEditingWidgets)}
                                                    className={cn(
                                                        "p-1.5 rounded-lg transition-colors",
                                                        isEditingWidgets ? "bg-blue-100 text-blue-600" : "hover:bg-muted text-muted-foreground/80"
                                                    )}
                                                    title={isEditingWidgets ? "Xong" : "Sắp xếp & Chỉnh sửa"}
                                                    aria-label={isEditingWidgets ? "Tắt chế độ chỉnh sửa" : "Bật chế độ chỉnh sửa tiện ích"}
                                                >
                                                    {isEditingWidgets ? <Settings2 className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                                </button>
                                            </div>

                                            <div className="flex-1 overflow-y-auto space-y-4 p-3 pt-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={handleDragEnd}
                                                >
                                                    <SortableContext
                                                        items={widgetsConfig.left}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        {getActiveWidgets('left').map((widget) => {
                                                            const WidgetComponent = widget.component;
                                                            let widgetProps: any = widget.defaultProps || {};

                                                            // Inject real data where applicable
                                                            if (widget.id === 'schedule') widgetProps = { classes: allClasses.slice(0, 3) };
                                                            if (widget.id === 'assignments') widgetProps = { assignments: allAssignments.slice(0, 3) };
                                                            if (widget.id === 'teacher_classes') widgetProps = { classes: allClasses };

                                                            // Inject specific mock data for demo if not provided
                                                            if (widget.id === 'notifications') widgetProps = { notifications: [{ id: '1', title: 'Thông báo mới', from: 'Hệ thống', time: new Date(), unread: true }] };
                                                            if (widget.id === 'student_stats') widgetProps = { averageScore: 8.5, attendanceRate: 95, rank: 3 };
                                                            if (widget.id === 'grading') widgetProps = {
                                                                assignments: [
                                                                    { id: '1', title: 'Bài tập Đại số', className: '12A1', submissionsToGrade: 5, dueDate: new Date(Date.now() + 86400000) }
                                                                ]
                                                            };
                                                            if (widget.id === 'students_risk') widgetProps = {
                                                                students: [
                                                                    { id: '1', name: 'Nguyễn Văn A', className: '12A1', reason: 'Điểm thấp', score: 4.5 },
                                                                    { id: '2', name: 'Trần Thị B', className: '12A1', reason: 'Vắng nhiều', score: 6.0 },
                                                                    { id: '3', name: 'Lê Văn C', className: '12A2', reason: 'Không nộp bài', score: 5.5 },
                                                                ]
                                                            };
                                                            if (widget.id === 'recent_activity') widgetProps = {
                                                                activities: [
                                                                    { id: '1', type: 'submission', title: 'Nộp bài Toán', description: 'Đã nộp sớm 1 ngày', time: new Date() },
                                                                    { id: '2', type: 'grade', title: 'Điểm Vật Lý', description: 'Bạn đạt 9.0 điểm', time: new Date(Date.now() - 86400000) }
                                                                ]
                                                            };

                                                            return (
                                                                <SortableWidget
                                                                    key={widget.id}
                                                                    id={widget.id}
                                                                    isEditing={isEditingWidgets}
                                                                    onRemove={() => handleRemoveWidget(widget.id, 'left')}
                                                                >
                                                                    <WidgetComponent {...widgetProps} />
                                                                </SortableWidget>
                                                            );
                                                        })}
                                                    </SortableContext>
                                                </DndContext>
                                                <WidgetPlaceholder onClick={() => handleOpenWidgetStore('left')} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Center Content - Toggle between Greeting and Tool Hub */}
                                    <div className="flex-1 flex flex-col items-center justify-center min-w-0 max-w-2xl mx-auto px-4 py-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative">
                                        {/* Toggle Button */}
                                        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
                                            <button
                                                onClick={() => setShowToolHub(!showToolHub)}
                                                className={cn(
                                                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-md",
                                                    showToolHub
                                                        ? "bg-gray-900 text-white hover:bg-gray-800"
                                                        : "bg-card dark:bg-card text-foreground/80 hover:bg-muted border border-border"
                                                )}
                                            >
                                                <LayoutGrid className="w-4 h-4" />
                                                {showToolHub ? "Về trang chính" : "Mở công cụ"}
                                            </button>
                                        </div>

                                        {showToolHub ? (
                                            /* Tool Hub View - Simplified */
                                            <div className="w-full max-w-2xl space-y-6 pt-10">
                                                {/* AI Greeting */}
                                                <div className="text-center mb-4">
                                                    <h2 className="text-3xl font-bold text-foreground tracking-tight mb-2">
                                                        {isTeacher ? "Công cụ Giảng dạy" : "Công cụ Học tập"}
                                                    </h2>
                                                    <p className="text-base text-muted-foreground">
                                                        {isTeacher ? "Truy cập nhanh các tính năng hỗ trợ giảng dạy" : "Truy cập nhanh các tính năng hữu ích"}
                                                    </p>
                                                </div>

                                                {/* Stats Bar - Horizontal compact */}
                                                <div className="flex items-center justify-between bg-card rounded-2xl p-4 border border-border shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                                            <ListTodo className="w-5 h-5 text-blue-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground font-medium">{isTeacher ? "Cần chấm" : "Bài tập"}</p>
                                                            <p className="text-lg font-bold text-foreground">
                                                                {isTeacher ? (analytics?.ungradedCount || 0) : pendingAssignments.length}
                                                                <span className="text-xs text-muted-foreground/80 font-normal ml-1">
                                                                    {isTeacher ? " bài" : `/ ${allAssignments.length}`}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="w-px h-8 bg-gray-100" />
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                                                            <Activity className="w-5 h-5 text-rose-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground font-medium">{isTeacher ? "Lớp học" : "Điểm TB"}</p>
                                                            <p className="text-lg font-bold text-foreground">
                                                                {isTeacher ? allClasses.length : (analytics?.myAverageScore?.toFixed(1) || "0.0")}
                                                                <span className={cn("text-xs font-normal ml-1", isTeacher ? "text-muted-foreground/80" : "text-emerald-500")}>
                                                                    {isTeacher ? " lớp" : "/ 10"}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="w-px h-8 bg-gray-100" />
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground font-medium">{isTeacher ? "Nộp bài" : "Chuyên cần"}</p>
                                                            <p className="text-lg font-bold text-foreground">
                                                                {isTeacher ? (analytics?.submissionRate || "100") : (analytics?.myAttendanceRate || "100")}
                                                                <span className="text-xs text-muted-foreground/80 font-normal ml-0.5">%</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* AI Suggestion - Compact */}
                                                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                                            <Sparkles className="w-5 h-5 text-amber-400" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-300 mb-1">Gợi ý cho bạn</p>
                                                            <p className="text-base font-medium leading-relaxed">
                                                                {isTeacher
                                                                    ? (analytics?.ungradedCount > 0
                                                                        ? `Thầy/Cô có ${analytics.ungradedCount} bài bài làm mới cần được chấm điểm!`
                                                                        : `Lớp học đang diễn ra rất tốt! Thầy/Cô có muốn soạn bài mới?`)
                                                                    : (pendingAssignments.length > 0
                                                                        ? `Có ${pendingAssignments.length} bài tập cần hoàn thành!`
                                                                        : `Bạn đang làm rất tốt! Ôn tập thêm nhé?`)}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleSend(isTeacher
                                                                ? (analytics?.ungradedCount > 0 ? "Hỗ trợ mình chấm bài" : "Soạn bài giảng mới")
                                                                : (pendingAssignments.length > 0 ? "Giúp mình giải bài tập" : "Tóm tắt kiến thức cho mình"))}
                                                            className="px-4 py-2 bg-card text-foreground rounded-xl text-sm font-semibold hover:bg-muted transition-colors shrink-0"
                                                        >
                                                            Bắt đầu
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Quick Actions Grid - Role Based */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => handleSend(isTeacher ? "Soạn giáo án cho tiết học mới" : "Tạo flashcard ôn tập cho mình")}
                                                        className="flex items-center gap-3 p-4 bg-card border border-border hover:border-purple-200 hover:bg-purple-50 rounded-2xl transition-all group"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center transition-colors">
                                                            <Sparkles className="w-5 h-5 text-purple-500" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm font-semibold text-foreground">{isTeacher ? "Soạn giáo án" : "Flashcard"}</p>
                                                            <p className="text-xs text-muted-foreground">{isTeacher ? "Thiết kế bài dạy" : "Ôn tập nhanh"}</p>
                                                        </div>
                                                    </button>
                                                    <button
                                                        onClick={() => handleSend(isTeacher ? "Lịch dạy hôm nay của mình thế nào?" : "Lịch học hôm nay của mình là gì?")}
                                                        className="flex items-center gap-3 p-4 bg-card border border-border hover:border-blue-200 hover:bg-blue-50 rounded-2xl transition-all group"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                                                            <Calendar className="w-5 h-5 text-blue-500" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm font-semibold text-foreground">{isTeacher ? "Lịch dạy" : "Lịch học"}</p>
                                                            <p className="text-xs text-muted-foreground">Hôm nay</p>
                                                        </div>
                                                    </button>
                                                    <button
                                                        onClick={() => handleSend(isTeacher ? "Tạo bài tập về nhà cho lớp" : "Tạo quiz kiểm tra kiến thức")}
                                                        className="flex items-center gap-3 p-4 bg-card border border-border hover:border-emerald-200 hover:bg-emerald-50 rounded-2xl transition-all group"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                                                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm font-semibold text-foreground">{isTeacher ? "Tạo bài tập" : "Quiz"}</p>
                                                            <p className="text-xs text-muted-foreground">{isTeacher ? "Giao bài mới" : "Tự kiểm tra"}</p>
                                                        </div>
                                                    </button>
                                                    <button
                                                        onClick={() => handleSend(isTeacher ? "Phân tích tình hình học tập của lớp" : "Tóm tắt bài học hôm nay")}
                                                        className="flex items-center gap-3 p-4 bg-card border border-border hover:border-amber-200 hover:bg-amber-50 rounded-2xl transition-all group"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                                                            <Activity className="w-5 h-5 text-amber-500" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm font-semibold text-foreground">{isTeacher ? "Phân tích lớp" : "Tóm tắt"}</p>
                                                            <p className="text-xs text-muted-foreground">{isTeacher ? "Báo cáo hiệu suất" : "Ghi chú nhanh"}</p>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Greeting View (Default) */
                                            <div className="text-center space-y-5 px-4 w-full">
                                                <div className="relative inline-block">
                                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-card border-2 border-border rounded-2xl flex items-center justify-center shadow-lg">
                                                        <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-teal-500" />
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-card rounded-full flex items-center justify-center shadow-md border border-border">
                                                        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-400" />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                                                        Chào {isTeacher ? "Thầy/Cô" : "bạn"}, mình là MiQiX AI!
                                                    </h2>
                                                    <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-md mx-auto px-2">
                                                        {isTeacher ? "Trợ lý giảng dạy cá nhân của Thầy/Cô. Sẵn sàng hỗ trợ mọi lúc." : "Trợ lý học tập cá nhân của bạn. Sẵn sàng hỗ trợ mọi lúc."}
                                                    </p>
                                                </div>

                                                {/* Suggestions - Stack on mobile, 2-col on md+ */}
                                                <div className="flex flex-col gap-2.5 w-full max-w-md mx-auto">
                                                    {currentModeInfo.recommendations.map((text, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => handleSend(text)}
                                                            className="flex items-center gap-3 p-3.5 sm:p-4 bg-card border border-border hover:border-teal-200 hover:bg-teal-50/30 rounded-xl sm:rounded-2xl text-sm font-medium text-foreground/80 hover:text-teal-700 text-left transition-all shadow-sm hover:shadow-md group w-full"
                                                        >
                                                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400 shrink-0" />
                                                            <span className="line-clamp-2">{text}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Widgets */}
                                    {!isCanvasOpen && (
                                        <div className="hidden 2xl:flex 2xl:flex-col w-80 2xl:w-88 shrink-0 h-[calc(100vh-180px)]">
                                            <div className="flex items-center justify-between mb-3 px-1">
                                                <h3 className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider">Tiện ích</h3>
                                                <button
                                                    onClick={() => setIsEditingWidgets(!isEditingWidgets)}
                                                    className={cn(
                                                        "p-1.5 rounded-lg transition-colors",
                                                        isEditingWidgets ? "bg-blue-100 text-blue-600" : "hover:bg-muted text-muted-foreground/80"
                                                    )}
                                                    title={isEditingWidgets ? "Xong" : "Sắp xếp & Chỉnh sửa"}
                                                    aria-label={isEditingWidgets ? "Tắt chế độ chỉnh sửa" : "Bật chế độ chỉnh sửa tiện ích"}
                                                >
                                                    {isEditingWidgets ? <Settings2 className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                                </button>
                                            </div>

                                            <div className="flex-1 overflow-y-auto space-y-4 p-3 pt-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={handleDragEnd}
                                                >
                                                    <SortableContext
                                                        items={widgetsConfig.right}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        {getActiveWidgets('right').map((widget) => {
                                                            const WidgetComponent = widget.component;
                                                            let widgetProps: any = widget.defaultProps || {};

                                                            // Inject real data where applicable
                                                            if (widget.id === 'grading_progress') widgetProps = { ungradedCount: 5 }; // Mock for now
                                                            if (widget.id === 'notifications') widgetProps = { notifications: [] };
                                                            if (widget.id === 'achievements') widgetProps = { streak: 5, badges: 12, rank: 3 };
                                                            if (widget.id === 'weekly_goals') widgetProps = { completed: 3, total: 5, goal: 'Hoàn thành bài tập Toán' };
                                                            if (widget.id === 'teacher_classes') widgetProps = { classes: allClasses.length > 0 ? allClasses : [{ id: '1', name: '12A1', code: 'ABC123' }] };
                                                            if (widget.id === 'students_risk') widgetProps = {
                                                                students: [
                                                                    { id: '1', name: 'Nguyễn Văn A', className: '12A1', reason: 'Điểm thấp', score: 4.5 },
                                                                    { id: '2', name: 'Trần Thị B', className: '12A1', reason: 'Vắng nhiều', score: 6.0 },
                                                                    { id: '3', name: 'Lê Văn C', className: '12A2', reason: 'Không nộp bài', score: 5.5 },
                                                                ]
                                                            };
                                                            if (widget.id === 'grading') widgetProps = {
                                                                assignments: [
                                                                    { id: '1', title: 'Bài tập Đại số', className: '12A1', submissionsToGrade: 5, dueDate: new Date(Date.now() + 86400000) }
                                                                ]
                                                            };
                                                            if (widget.id === 'schedule') widgetProps = { classes: allClasses.slice(0, 3) };
                                                            if (widget.id === 'assignments') widgetProps = { assignments: allAssignments.slice(0, 3) };
                                                            if (widget.id === 'student_stats') widgetProps = { averageScore: 8.5, attendanceRate: 95, rank: 3 };
                                                            if (widget.id === 'recent_activity') widgetProps = {
                                                                activities: [
                                                                    { id: '1', type: 'submission', title: 'Nộp bài Toán', description: 'Đã nộp sớm 1 ngày', time: new Date() },
                                                                    { id: '2', type: 'grade', title: 'Điểm Vật Lý', description: 'Bạn đạt 9.0 điểm', time: new Date(Date.now() - 86400000) }
                                                                ]
                                                            };

                                                            return (
                                                                <SortableWidget
                                                                    key={widget.id}
                                                                    id={widget.id}
                                                                    isEditing={isEditingWidgets}
                                                                    onRemove={() => handleRemoveWidget(widget.id, 'right')}
                                                                >
                                                                    <WidgetComponent {...widgetProps} />
                                                                </SortableWidget>
                                                            );
                                                        })}
                                                    </SortableContext>
                                                </DndContext>
                                                <WidgetPlaceholder onClick={() => handleOpenWidgetStore('right')} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Chat Messages List
                                <div className="flex-1 space-y-8 pb-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                    {messages.map((msg, idx) => {
                                        const isLatest = idx === messages.length - 1;
                                        return (
                                            <div
                                                key={msg.id}
                                                id={`msg-${msg.id}`}
                                                className={cn(
                                                    "flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 transition-colors rounded-2xl p-2 -mx-2",
                                                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                                    msg.role === "user" ? "bg-gray-900 text-white" : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                                                )}>
                                                    {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                                </div>
                                                <div className={cn(
                                                    "flex flex-col max-w-[85%] sm:max-w-[75%]",
                                                    msg.role === "user" ? "items-end" : "items-start"
                                                )}>
                                                    <div className={cn(
                                                        "px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm break-words overflow-hidden",
                                                        msg.role === "user"
                                                            ? "bg-gray-900 text-white rounded-br-none"
                                                            : "bg-card dark:bg-card border border-border text-foreground rounded-bl-none"
                                                    )}>
                                                        {(msg.role === "ai" || msg.role === 'assistant') && msg.reasoning && (
                                                            <ThinkingBar
                                                                content={msg.reasoning}
                                                                isExpanded={thinkingExpanded && isLatest}
                                                                onToggle={() => setThinkingExpanded(prev => !prev)}
                                                            />
                                                        )}

                                                        {(msg.role === "ai" || msg.role === 'assistant') && isLatest && latestMessageId === msg.id ? (
                                                            <TypewriterText text={msg.content} onComplete={() => setLatestMessageId(null)} />
                                                        ) : (
                                                            <div className="prose prose-sm max-w-none dark:prose-invert break-words">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {isLoading && (
                                        <div className="flex gap-4 animate-pulse">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            </div>
                                            <div className="bg-card dark:bg-card border border-border px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                                                <div className="flex gap-1.5 mt-1">
                                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Input Area */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent pt-10 px-4 md:px-6 z-20">
                        <div className="max-w-2xl mx-auto bg-card rounded-[2rem] shadow-xl shadow-blue-900/5 border border-border p-3 relative group focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                            {/* Selected Context Indicators */}
                            {(targetAssignmentIds.length > 0 || targetClassIds.length > 0 || isCanvasMode) && (
                                <div className="absolute -top-9 left-3 flex items-center gap-1.5 flex-wrap">
                                    {targetAssignmentIds.map(id => (
                                        <button
                                            key={id}
                                            onClick={() => toggleAssignment(id)}
                                            className="flex items-center gap-1 bg-card border border-border text-muted-foreground pl-2 pr-1.5 py-1 rounded-lg text-xs font-medium shadow-sm hover:bg-muted transition-colors animate-in fade-in zoom-in duration-200"
                                        >
                                            <ListTodo className="w-3 h-3 text-blue-500" />
                                            <span className="truncate max-w-[100px]">
                                                {allAssignments.find(a => a.id === id)?.title || "Bài tập"}
                                            </span>
                                            <X className="w-3 h-3 text-muted-foreground/80" />
                                        </button>
                                    ))}
                                    {targetClassIds.map(id => (
                                        <button
                                            key={id}
                                            onClick={() => toggleClass(id)}
                                            className="flex items-center gap-1 bg-card border border-border text-muted-foreground pl-2 pr-1.5 py-1 rounded-lg text-xs font-medium shadow-sm hover:bg-muted transition-colors animate-in fade-in zoom-in duration-200"
                                        >
                                            <LayoutGrid className="w-3 h-3 text-indigo-500" />
                                            <span className="truncate max-w-[100px]">
                                                {allClasses.find(c => c.id === id)?.name || "Lớp học"}
                                            </span>
                                            <X className="w-3 h-3 text-muted-foreground/80" />
                                        </button>
                                    ))}
                                    {isCanvasMode && (
                                        <button
                                            onClick={() => setIsCanvasMode(false)}
                                            className="flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-600 pl-2 pr-1.5 py-1 rounded-lg text-xs font-medium shadow-sm hover:bg-purple-100 transition-colors"
                                        >
                                            <Sparkles className="w-3 h-3" />
                                            <span>Canvas</span>
                                            <X className="w-3 h-3 text-purple-400" />
                                        </button>
                                    )}
                                    {isSocraticMode && (
                                        <button
                                            onClick={() => setIsSocraticMode(false)}
                                            className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-600 pl-2 pr-1.5 py-1 rounded-lg text-xs font-medium shadow-sm hover:bg-indigo-100 transition-colors"
                                        >
                                            <GraduationCap className="w-3 h-3" />
                                            <span>Socratic</span>
                                            <X className="w-3 h-3 text-indigo-400" />
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-2 relative">
                                <button
                                    onClick={() => setShowModeMenu(!showModeMenu)}
                                    className="p-3 bg-muted hover:bg-muted rounded-full text-muted-foreground transition-colors shrink-0"
                                >
                                    <Plus className={cn("w-5 h-5 transition-transform", showModeMenu && "rotate-45")} />
                                </button>

                                {/* Mode Menu Popup */}
                                {showModeMenu && (
                                    <div
                                        ref={menuRef}
                                        className="fixed md:absolute bottom-full left-0 md:left-0 mb-5 w-[calc(100vw-32px)] md:w-[420px] lg:w-[500px] bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-border p-5 z-50 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                                    >
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                                                <h3 className="text-xs font-bold text-muted-foreground/80 uppercase tracking-[0.2em]">Chọn chế độ trợ lý</h3>
                                            </div>
                                            <button onClick={() => setShowModeMenu(false)} className="p-2 hover:bg-muted rounded-xl transition-all">
                                                <X className="w-5 h-5 text-muted-foreground/80" />
                                            </button>
                                        </div>

                                        {/* Mode Grid - Horizontal style */}
                                        <div className={cn(
                                            "grid gap-2.5 mb-5",
                                            (user.role === 'teacher' ? TEACHER_MODES : STUDENT_MODES).length > 2
                                                ? "grid-cols-1 md:grid-cols-2"
                                                : "grid-cols-1 md:grid-cols-2"
                                        )}>
                                            {(user.role === 'teacher' ? TEACHER_MODES : STUDENT_MODES).map((mode) => {
                                                const IconComponent = mode.icon;
                                                const isActive = chatMode === mode.id;
                                                return (
                                                    <div
                                                        key={mode.id}
                                                        onClick={() => {
                                                            setChatMode(mode.id);
                                                            if (window.innerWidth < 1024) setShowModeMenu(false);
                                                        }}
                                                        className={cn(
                                                            "p-2.5 rounded-xl cursor-pointer border-2 transition-all relative group flex items-center gap-3 text-left",
                                                            isActive
                                                                ? "bg-card dark:bg-card border-indigo-500 shadow-sm"
                                                                : "bg-muted/30 border-transparent hover:border-indigo-100 hover:bg-white"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0",
                                                            isActive
                                                                ? "bg-indigo-500 text-white shadow-sm"
                                                                : "bg-card dark:bg-card text-indigo-400 border border-border group-hover:bg-indigo-50"
                                                        )}>
                                                            <IconComponent className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className={cn("font-bold text-[14px] leading-tight transition-colors", isActive ? "text-indigo-900" : "text-foreground")}>
                                                                {mode.label}
                                                            </h4>
                                                        </div>

                                                        {isActive && (
                                                            <div className="animate-pulse">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Dynamic Sub-options (Only shows when active mode has them) */}
                                        <AnimatePresence mode="wait">
                                            {chatMode === "tutor" && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                                    animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="p-3 bg-gradient-to-br from-indigo-50/50 to-white rounded-2xl border border-indigo-100/50 shadow-sm">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 bg-card rounded-lg flex items-center justify-center text-indigo-500 shadow-sm">
                                                                    <GraduationCap className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[12px] font-bold text-foreground">Phương pháp Socratic</p>
                                                                    <p className="text-[10px] text-muted-foreground font-medium">AI gợi mở thay vì trả lời ngay</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setIsSocraticMode(!isSocraticMode);
                                                                }}
                                                                className={cn(
                                                                    "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-all duration-300 focus:outline-none",
                                                                    isSocraticMode ? "bg-indigo-600 shadow-[0_0_10px_rgba(99,102,241,0.4)]" : "bg-gray-200"
                                                                )}
                                                            >
                                                                <span className={cn(
                                                                    "inline-block h-3.5 w-3.5 transform rounded-full bg-card transition-transform shadow-sm",
                                                                    isSocraticMode ? "translate-x-4.5" : "translate-x-1"
                                                                )} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Divider */}
                                        <div className="border-t border-border my-3" />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-3">
                                            {/* Assignment Selector */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => {
                                                        setShowAssignmentSelector(!showAssignmentSelector);
                                                        setShowClassSelector(false);
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center gap-2.5 p-2 rounded-xl transition-all text-left",
                                                        targetAssignmentIds.length > 0 ? "bg-blue-50/80 border border-blue-200 text-blue-700" : "bg-muted/50 border border-border hover:border-gray-300 text-foreground/80"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                                                        targetAssignmentIds.length > 0 ? "bg-card dark:bg-card shadow-sm" : "bg-card dark:bg-card border border-border"
                                                    )}>
                                                        <ListTodo className="w-3 h-3" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[11px] font-bold truncate">
                                                            {targetAssignmentIds.length > 0 ? `${targetAssignmentIds.length} bài tập` : "Chọn bài tập"}
                                                        </p>
                                                    </div>
                                                    <ChevronDown className={cn("w-3 h-3 opacity-50 transition-transform", showAssignmentSelector && "rotate-180")} />
                                                </button>

                                                <AnimatePresence>
                                                    {showAssignmentSelector && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                            className="absolute bottom-full left-0 w-full mb-2 z-[60] bg-card rounded-2xl shadow-2xl border border-border p-1.5 space-y-0.5 max-h-48 overflow-y-auto"
                                                        >
                                                            <div className="p-1 space-y-1">
                                                                {allAssignments.map(a => (
                                                                    <button
                                                                        key={a.id}
                                                                        onClick={() => toggleAssignment(a.id)}
                                                                        className={cn(
                                                                            "w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all truncate text-left",
                                                                            targetAssignmentIds.includes(a.id) ? "bg-blue-50 text-blue-700" : "hover:bg-muted text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {targetAssignmentIds.includes(a.id) ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <div className="w-3.5 h-3.5" />}
                                                                        <span className="truncate">{a.title}</span>
                                                                    </button>
                                                                ))}
                                                                {allAssignments.length === 0 && <p className="text-xs text-muted-foreground/80 text-center py-2">Không có dữ liệu</p>}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Class Selector */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => {
                                                        setShowClassSelector(!showClassSelector);
                                                        setShowAssignmentSelector(false);
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center gap-2.5 p-2 rounded-xl transition-all text-left",
                                                        targetClassIds.length > 0 ? "bg-indigo-50/80 border border-indigo-200 text-indigo-700" : "bg-muted/50 border border-border hover:border-gray-300 text-foreground/80"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                                                        targetClassIds.length > 0 ? "bg-card dark:bg-card shadow-sm" : "bg-card dark:bg-card border border-border"
                                                    )}>
                                                        <LayoutGrid className="w-3 h-3" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[11px] font-bold truncate">
                                                            {targetClassIds.length > 0 ? `${targetClassIds.length} lớp học` : "Chọn lớp học"}
                                                        </p>
                                                    </div>
                                                    <ChevronDown className={cn("w-3 h-3 opacity-50 transition-transform", showClassSelector && "rotate-180")} />
                                                </button>

                                                <AnimatePresence>
                                                    {showClassSelector && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                            className="absolute bottom-full left-0 w-full mb-2 z-[60] bg-card rounded-2xl shadow-2xl border border-border p-1.5 space-y-0.5 max-h-48 overflow-y-auto"
                                                        >
                                                            <div className="p-1 space-y-1">
                                                                {allClasses.map(c => (
                                                                    <button
                                                                        key={c.id}
                                                                        onClick={() => toggleClass(c.id)}
                                                                        className={cn(
                                                                            "w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all truncate text-left",
                                                                            targetClassIds.includes(c.id) ? "bg-indigo-50 text-indigo-700" : "hover:bg-muted text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {targetClassIds.includes(c.id) ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <div className="w-3.5 h-3.5" />}
                                                                        <span className="truncate">{c.name}</span>
                                                                    </button>
                                                                ))}
                                                                {allClasses.length === 0 && <p className="text-xs text-muted-foreground/80 text-center py-2">Không có dữ liệu</p>}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className="border-t border-border my-3" />

                                        {/* Canvas Toggle */}
                                        <button
                                            onClick={() => setIsCanvasMode(!isCanvasMode)}
                                            className={cn(
                                                "w-full flex items-center gap-2.5 p-2 rounded-xl transition-all text-left mt-2.5 group",
                                                isCanvasMode
                                                    ? "bg-purple-50 border border-purple-200 text-purple-700"
                                                    : "bg-muted/50 hover:bg-purple-50/50 border border-border hover:border-purple-200 text-muted-foreground hover:text-purple-700"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                                                isCanvasMode ? "bg-purple-500 text-white shadow-sm" : "bg-card dark:bg-card border border-border text-muted-foreground/80 group-hover:text-purple-500"
                                            )}>
                                                <Sparkles className="w-3 h-3" />
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-[11px] font-bold leading-none block mb-0.5">Canvas Mode</span>
                                                <p className="text-[9px] opacity-60 font-medium">
                                                    {isCanvasMode ? "AI sẽ hiển thị nội dung ra vùng làm việc Canvas" : "Kết quả AI sẽ chỉ hiển thị trong ô chat"}
                                                </p>
                                            </div>
                                            <div className={cn(
                                                "w-7 h-4 rounded-full transition-all flex items-center px-0.5",
                                                isCanvasMode ? "bg-purple-500" : "bg-gray-300"
                                            )}>
                                                <div className={cn(
                                                    "w-3 h-3 bg-card rounded-full shadow-sm transition-transform",
                                                    isCanvasMode && "translate-x-3"
                                                )} />
                                            </div>
                                        </button>
                                    </div>
                                )}
                                <textarea
                                    ref={textareaRef}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder={currentModeInfo.prompt || "Nhập tin nhắn..."}
                                    className="flex-1 max-h-[200px] min-h-[44px] py-3 bg-transparent border-none text-foreground placeholder-gray-400 focus:ring-0 focus:outline-none outline-none resize-none font-medium text-[15px] thin-scrollbar transition-[height] duration-200"
                                    rows={1}
                                />

                                <button
                                    onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all shrink-0",
                                        isThinkingEnabled ? "bg-purple-100 text-purple-600" : "hover:bg-muted text-muted-foreground/80"
                                    )}
                                    title="Chế độ suy nghĩ sâu"
                                >
                                    <BrainCircuit className="w-5 h-5" />
                                    {isThinkingEnabled && <span className="text-xs font-semibold">Thinking</span>}
                                </button>

                                <button
                                    onClick={() => handleSend()}
                                    disabled={!inputValue.trim() || isLoading}
                                    className={cn(
                                        "p-3 rounded-full transition-all shadow-md",
                                        !inputValue.trim() || isLoading
                                            ? "bg-gray-100 text-muted-foreground/80 cursor-not-allowed"
                                            : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-blue-200"
                                    )}
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT CANVAS AREA */}
                {
                    isCanvasOpen && (
                        <div className="w-1/2 bg-muted/50 border-l border-border flex flex-col h-full animate-in slide-in-from-right duration-500 shadow-2xl z-10">
                            {/* Canvas Header */}
                            <div className="h-16 px-6 border-b border-border flex items-center justify-between bg-card shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 rounded-xl">
                                        <Sparkles className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-foreground leading-tight">Canvas thông minh</h2>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                            {canvasViewMode === 'dashboard' ? 'Tổng quan' : canvasViewMode === 'flashcards' ? 'Flashcards' : 'Nội dung'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors">
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setIsCanvasOpen(false)}
                                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Canvas Content */}
                            <div className="flex-1 overflow-y-auto p-8 relative" id="canvas-content">
                                {canvasContent && canvasContent.type === 'structured_content' ? (
                                    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {canvasContent.sections?.map((section: any, idx: number) => (
                                            <div key={idx} className="bg-card dark:bg-card p-6 rounded-2xl shadow-sm border border-border group hover:shadow-md transition-shadow">
                                                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                                                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                                                    {section.heading}
                                                </h3>
                                                <div className="prose prose-sm text-muted-foreground leading-relaxed">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkMath]}
                                                        rehypePlugins={[rehypeKatex]}
                                                    >
                                                        {section.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : canvasContent && canvasContent.type === 'flashcards' ? (
                                    <FlashcardCanvas data={canvasContent.data} />
                                ) : canvasContent && canvasContent.type === 'quiz' ? (
                                    <QuizCanvas data={canvasContent.data} title={canvasContent.title} />
                                ) : canvasContent && canvasContent.type === 'mindmap' ? (
                                    <MindMapCanvas data={canvasContent.data} />
                                ) : canvasContent && canvasContent.type === 'text' ? (
                                    <CanvasContentRenderer content={canvasContent.content} />
                                ) : canvasViewMode === 'socratic' ? (
                                    <div className="h-full">
                                        <SocraticCanvas
                                            currentStep={socraticCurrentStep}
                                            history={socraticHistory}
                                            isLoading={isSocraticLoading || isLoading}
                                            onSendAnswer={(ans) => {
                                                setIsSocraticLoading(true);
                                                handleSend(ans);
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center">
                                        <div className="p-4 bg-indigo-50 rounded-2xl mb-4">
                                            <Sparkles className="w-12 h-12 text-indigo-500" />
                                        </div>
                                        <h3 className="text-lg font-bold text-foreground mb-2">Canvas sẵn sàng</h3>
                                        <p className="text-muted-foreground max-w-sm">
                                            Nội dung AI tạo ra sẽ hiển thị ở đây. Bật Canvas Mode và gửi tin nhắn để bắt đầu!
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }
            </div >

            {/* Widget Store Modal */}
            < WidgetStore
                isOpen={isWidgetStoreOpen}
                onClose={() => setIsWidgetStoreOpen(false)
                }
                onAddWidget={handleAddWidget}
                userRole={user.role as any}
                currentWidgets={activeWidgetColumn ? widgetsConfig[activeWidgetColumn] : []}
            />
        </div >
    );
}
