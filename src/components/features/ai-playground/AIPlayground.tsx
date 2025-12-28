"use client";

import { useState, useEffect, useRef } from "react";
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
    User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { User as UserType } from "@/types";
import { useAIContext } from "@/contexts/AIContext";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { format, startOfWeek, isAfter, isToday } from "date-fns";
import { getAggregatedScheduleAction, ScheduleEvent } from "@/lib/schedule-actions";
import { getAssignmentsAction, getClassesAction } from "@/lib/actions";
import { getStudentDashboardAnalyticsAction, getTeacherDashboardAnalyticsAction } from "@/lib/analytics-actions";
import { WIDGET_REGISTRY, getDefaultLayout, WidgetDefinition } from "@/config/widget-registry";
import { WidgetStore } from "@/components/features/dashboard/WidgetStore";
import { WidgetPlaceholder } from "@/components/features/dashboard/WidgetPlaceholder";
import { CanvasDashboard } from "./CanvasDashboard";

interface AIPlaygroundProps {
    user: UserType;
}

interface WidgetConfig {
    left: string[];
    right: string[];
}

interface Message {
    id: string;
    role: "user" | "ai";
    content: string;
    reasoning?: string; // For thinking mode
    timestamp: number;
}

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
    messages: Message[];
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
        label: "Góc học tập",
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
    type: 'flashcards' | 'structured_content' | 'options' | 'default';
    data?: any; // For flashcards or options
    title?: string;
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
        <div className="prose prose-sm max-w-none dark:prose-invert">
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
                        <div className="mt-2 p-3 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-700 max-h-24 overflow-y-auto font-mono">
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
                <h3 className="text-2xl font-bold text-gray-800">Flashcard Ôn Tập</h3>
                <p className="text-sm text-gray-500 font-medium">Thẻ {currentIndex + 1} / {data.length}</p>
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
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            Chạm để lật
                        </div>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-3xl p-8 flex flex-col items-center justify-center text-center border border-gray-100">
                        <span className="text-sm font-bold uppercase tracking-widest text-emerald-500 mb-4">Đáp án</span>
                        <div className="prose prose-lg text-gray-800 leading-relaxed font-medium">
                            {data[currentIndex].back}
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={handlePrev}
                    className="p-4 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-lg transition-all"
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

const LessonPlanCanvas = ({ title, sections }: { title: string; sections: any[] }) => {
    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center space-y-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 leading-tight">{title}</h1>
                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-500">
                    <span className="bg-gray-100 px-3 py-1 rounded-full">Giáo án</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-full">{sections.length} phần</span>
                </div>
            </div>

            <div className="space-y-6">
                {sections.map((section, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            {section.heading}
                        </h3>
                        <div className="prose prose-sm text-gray-600 max-w-none prose-p:leading-loose">
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{section.content}</ReactMarkdown>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-dashed border-gray-200">
                <button className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors">
                    Xuất PDF
                </button>
                <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-colors">
                    Lưu vào Thư viện
                </button>
            </div>
        </div>
    );
};

export function AIPlayground({ user }: AIPlaygroundProps) {
    // --- State ---
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [chatMode, setChatMode] = useState<ChatMode>("standard");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- Widget State ---
    const [isWidgetStoreOpen, setIsWidgetStoreOpen] = useState(false);
    const [activeWidgetColumn, setActiveWidgetColumn] = useState<'left' | 'right' | null>(null);
    const [widgetsConfig, setWidgetsConfig] = useState<WidgetConfig>({
        left: [],
        right: []
    });

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
    const [isTyping, setIsTyping] = useState(false);
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
    const [canvasViewMode, setCanvasViewMode] = useState<"dashboard" | "content" | "flashcards" | "lesson_plan">("dashboard");
    const [isEditingContent, setIsEditingContent] = useState(false); // New state for editing mode
    const [latestMessageId, setLatestMessageId] = useState<string | null>(null); // Track latest AI message for typewriter
    const [thinkingExpanded, setThinkingExpanded] = useState(true); // Thinking bar expanded by default

    // New AI Config States
    const [isThinkingEnabled, setIsThinkingEnabled] = useState(false);
    const [isCanvasMode, setIsCanvasMode] = useState(false); // Force Canvas Output
    const [targetAssignmentId, setTargetAssignmentId] = useState<string | null>(null);
    const [targetClassId, setTargetClassId] = useState<string | null>(null);
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
        setTargetAssignmentId(null);
        setTargetClassId(null);
        setShowAssignmentSelector(false);
        setShowClassSelector(false);
    }, [chatMode]);

    // Load real data for smart responses and chat history
    useEffect(() => {
        async function loadData() {
            try {
                const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
                const scheduleData = await getAggregatedScheduleAction(weekStart.toISOString());
                const now = new Date();
                const todayEvents = scheduleData.events
                    .filter(e => isToday(new Date(e.start)) && isAfter(new Date(e.end), now))
                    .slice(0, 3);
                setUpcomingEvents(todayEvents);

                const assignmentsData = await getAssignmentsAction();
                setAllAssignments(assignmentsData);

                const classesData = await getClassesAction();
                setAllClasses(classesData);

                const analyticsData = user.role === 'teacher'
                    ? await getTeacherDashboardAnalyticsAction()
                    : await getStudentDashboardAnalyticsAction();
                setAnalytics(analyticsData);

                const pending = user.role === 'teacher'
                    ? assignmentsData
                        .filter((a: any) => a.teacherId === user.id) // Only teacher's assignments
                        .slice(0, 3)
                        .map((a: any) => ({
                            id: a.id,
                            title: a.title,
                            className: a.assignmentClasses?.[0]?.class?.name || 'Lớp học',
                            dueDate: new Date(a.dueDate),
                            subjectCode: (a.subject || 'Học').substring(0, 3)
                        }))
                    : assignmentsData
                        .filter((a: any) => a.status !== 'completed')
                        .sort((a: any) => new Date(a.dueDate).getTime() - new Date().getTime()) // Sort by due date, closest first
                        .slice(0, 3)
                        .map((a: any) => ({
                            id: a.id,
                            title: a.title,
                            className: a.assignmentClasses?.[0]?.class?.name || 'Lớp học',
                            dueDate: new Date(a.dueDate),
                            subjectCode: (a.subject || 'Học').substring(0, 3)
                        }));
                setPendingAssignments(pending);

                // Load Chat History
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
    }, []);

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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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

        const aiMsg: Message = {
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

    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || inputValue;
        if (!textToSend.trim() || isTyping || sendCooldown) return;

        // Rate limit check: count messages in last minute
        const now = Date.now();
        const recentMessages = messageTimestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
        if (recentMessages.length >= RATE_LIMIT_MAX) {
            alert(`Bạn đã gửi quá ${RATE_LIMIT_MAX} tin nhắn trong 1 phút. Vui lòng đợi một chút!`);
            return;
        }

        // Add timestamp and start cooldown
        setMessageTimestamps([...recentMessages, now]);
        setSendCooldown(true);
        setTimeout(() => setSendCooldown(false), COOLDOWN_MS);

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: textToSend,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
        setIsTyping(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: textToSend,
                    mode: chatMode,
                    userRole: user.role, // Fix: Pass user role explicitly
                    includeReasoning: isThinkingEnabled,
                    forceCanvas: isCanvasMode, // Pass explicit instruction
                    targetAssignmentId: targetAssignmentId,
                    targetClassId: targetClassId,
                    previousMessages: messages.slice(-10).map(m => ({
                        role: m.role === 'ai' ? 'assistant' : 'user',
                        content: m.content
                    })),
                    // Inject context smartly
                    context: {
                        assignments: pendingAssignments.slice(0, 5).map(a => `${a.title} (${a.subjectCode}) - Due: ${format(a.dueDate, 'dd/MM')}`),
                        eventsToday: upcomingEvents.filter(e => isToday(e.start)).map(e => `${e.title} at ${format(e.start, 'HH:mm')}`),
                        analytics: analytics ? {
                            averageScore: analytics.myAverageScore,
                            submissionRate: analytics.mySubmissionRate,
                            attendance: analytics.myAttendanceRate
                        } : null
                    }
                })
            });
            const data = await res.json();

            // Check for API error
            if (data.error) {
                console.error("[AI API Error]:", data.error, data.details);
                const errorMessage: Message = {
                    id: Date.now().toString(),
                    role: "ai",
                    content: `⚠️ Lỗi AI: ${data.details || data.error}. Vui lòng thử lại.`,
                    timestamp: Date.now()
                };
                setMessages(prev => [...prev, errorMessage]);
                setIsTyping(false);
                return;
            }

            // Extract payload early for both chat display and canvas handling
            const rawReply = data.reply || "Xin lỗi, mình gặp chút trục trặc.";
            const { text: cleanText, payload: extractedPayload } = extractPayload(rawReply);

            const messageId = (Date.now() + 1).toString();
            const aiMessage: Message = {
                id: messageId,
                role: "ai",
                content: cleanText || rawReply, // Use clean text (without payload JSON) for chat
                reasoning: data.reasoning, // Include reasoning for thinking mode
                timestamp: Date.now()
            };

            // Set this as latest message for typewriter effect
            setLatestMessageId(messageId);

            setMessages(prev => {
                const newMessages = [...prev, aiMessage];

                // Update or Create Session in State & LocalStorage
                let updatedSessions = [...sessions];
                if (!currentSessionId) {
                    const newId = Date.now().toString();
                    const newSession: ChatSession = {
                        id: newId,
                        title: userMessage.content.slice(0, 40) + (userMessage.content.length > 40 ? "..." : ""),
                        messages: newMessages,
                        updatedAt: Date.now()
                    };
                    updatedSessions = [newSession, ...updatedSessions];
                    setCurrentSessionId(newId);
                } else {
                    updatedSessions = updatedSessions.map(s =>
                        s.id === currentSessionId
                            ? { ...s, messages: newMessages, updatedAt: Date.now() }
                            : s
                    ).sort((a, b) => b.updatedAt - a.updatedAt); // Sort by most recent update
                }

                setSessions(updatedSessions);
                localStorage.setItem("miqix_chat_sessions", JSON.stringify(updatedSessions));
                return newMessages;
            });

            // If Canvas Mode is ON or payload has structured content, send to Canvas
            if (isCanvasMode || extractedPayload) {
                if (extractedPayload?.type === 'structured_content') {
                    // Pass the payload object directly for Canvas to render
                    setCanvasContent(extractedPayload);
                } else if (extractedPayload?.type === 'flashcards') {
                    setCanvasContent(extractedPayload);
                    setCanvasViewMode("flashcards");
                } else {
                    // Wrap plain text in an object with type 'text'
                    setCanvasContent({
                        type: 'text',
                        content: extractMainContent(cleanText || rawReply)
                    });
                }
                setCanvasViewMode("content");
                setIsCanvasOpen(true);
            } else if (chatMode === "writing" || chatMode === "summary" || chatMode === "solver" || chatMode === "planner") {
                // Original logic for specific modes
                if (data.reply && data.reply.length > 200) {
                    setCanvasContent(extractMainContent(data.reply));
                    setCanvasViewMode("content");
                    setIsCanvasOpen(true);
                }
            }

        } catch {
            const errorMsg: Message = {
                id: Date.now().toString(),
                role: "ai",
                content: "Có lỗi xảy ra. Vui lòng thử lại sau.",
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const getDueLabel = (date: Date) => {
        const now = new Date();
        const diff = date.getTime() - now.getTime();
        const hours = diff / (1000 * 60 * 60);
        if (hours < 0) return { text: "Quá hạn", color: "text-red-600 bg-red-50" };
        if (hours < 24) return { text: "Hôm nay", color: "text-orange-500 bg-orange-50" };
        return { text: format(date, "dd/MM"), color: "text-gray-500 bg-gray-50" };
    };

    const currentModeInfo = MODES.find(m => m.id === chatMode) || MODES[0];

    return (
        <div className="flex h-screen bg-white overflow-hidden font-sans text-[#202124]">
            {/* LEFT SIDEBAR - CHAT HISTORY */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 bg-[#f8f9fa] border-r border-gray-200 transition-transform duration-300 transform md:relative md:translate-x-0 flex flex-col",
                isHistoryVisible ? "translate-x-0" : "-translate-x-full md:absolute md:w-0 md:opacity-0"
            )}>
                <div className="p-4 flex flex-col h-full">
                    <button
                        onClick={createNewChat}
                        className="flex items-center gap-3 w-full p-3 bg-white hover:bg-gray-100 border border-gray-200 rounded-2xl transition-all shadow-sm mb-6 group"
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-gray-700">Đoạn chat mới</span>
                    </button>

                    <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-3 mb-2">Gần đây</h3>
                        {sessions.length > 0 ? (
                            sessions.map(session => (
                                <div
                                    key={session.id}
                                    onClick={() => switchSession(session.id)}
                                    className={cn(
                                        "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                                        currentSessionId === session.id ? "bg-white shadow-sm border border-gray-100" : "hover:bg-gray-200/50"
                                    )}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                                        <MessageSquare className={cn("w-4 h-4 shrink-0", currentSessionId === session.id ? "text-blue-600" : "text-gray-400")} />
                                        <div className="flex flex-col flex-1 overflow-hidden">
                                            <span className={cn(
                                                "text-sm truncate",
                                                currentSessionId === session.id ? "font-bold text-gray-900" : "text-gray-600 font-medium"
                                            )}>
                                                {session.title}
                                            </span>
                                            {(session as any).source && (
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    Từ: {(session as any).source}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => deleteSession(session.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-md transition-all"
                                    >
                                        <X className="w-3.5 h-3.5 text-gray-400" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-xs text-gray-400 font-medium">Chưa có lịch sử.</div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-gray-200 mt-auto">
                        <div className="flex items-center gap-3 p-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-700">Miqix Pro</p>
                                <p className="text-[10px] text-gray-500">Mở khóa sức mạnh AI</p>
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
                    <header className="h-16 flex items-center justify-between px-6 border-b border-gray-100 shrink-0 sticky top-0 bg-white/80 backdrop-blur-md z-20">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsHistoryVisible(!isHistoryVisible)}
                                className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
                                title="Lịch sử chat"
                            >
                                <PanelLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <h1 className="font-bold text-gray-900 group flex items-center gap-1.5">
                                    {MODES.find(m => m.id === chatMode)?.label}
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-48 md:w-64 bg-gray-100/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none"
                                />
                            </div>
                            <div className="hidden sm:flex items-center bg-gray-100 rounded-full px-3 py-1 gap-2">
                                <Zap className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-[11px] font-black text-gray-600 uppercase tracking-wider">MiMo V2 Flash</span>
                            </div>
                        </div>
                    </header>

                    {/* Chat Messages */}
                    <div className="flex-1 flex overflow-hidden pt-16 pb-32 px-4">
                        <div className={cn(
                            "mx-auto transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex gap-6",
                            messages.length === 0 ? "w-full px-6 max-w-[98%]" : "w-full max-w-2xl px-4"
                        )}>
                            {/* Messages Content */}
                            {messages.length === 0 ? (
                                <div className="flex flex-col md:flex-row gap-6 w-full min-h-[75vh] items-stretch justify-between animate-in fade-in zoom-in duration-500">
                                    {/* Left Widgets */}
                                    {!isCanvasOpen && (
                                        <div className="hidden xl:flex xl:flex-col w-80 2xl:w-88 shrink-0 h-[calc(100vh-180px)]">
                                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                                                        <div key={widget.id} className="relative group/widget">
                                                            <button
                                                                onClick={() => handleRemoveWidget(widget.id, 'left')}
                                                                className="absolute -top-1 -right-1 z-10 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover/widget:opacity-100 transition-opacity shadow-md"
                                                                title="Xóa widget"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                            <WidgetComponent {...widgetProps} />
                                                        </div>
                                                    );
                                                })}
                                                <WidgetPlaceholder onClick={() => handleOpenWidgetStore('left')} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Center: Greeting */}
                                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 max-w-3xl mx-auto px-8">
                                        <div className="relative">
                                            <div className="w-20 h-20 bg-white border-2 border-gray-100 rounded-2xl flex items-center justify-center shadow-lg">
                                                <Bot className="w-10 h-10 text-teal-500" />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100">
                                                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h2 className="text-2xl font-bold text-gray-900">
                                                Chào bạn, mình là Miqix AI!
                                            </h2>
                                            <p className="text-base text-gray-500 font-medium max-w-md mx-auto">
                                                Trợ lý học tập cá nhân của bạn. Sẵn sàng hỗ trợ mọi lúc.
                                            </p>
                                        </div>

                                        {/* Suggestions Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                                            {currentModeInfo.recommendations.map((text, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSend(text)}
                                                    className="flex items-center gap-3 p-4 bg-white border border-gray-100 hover:border-teal-200 hover:bg-teal-50/30 rounded-2xl text-sm font-medium text-gray-700 hover:text-teal-700 text-left transition-all shadow-sm hover:shadow-md group"
                                                >
                                                    <Sparkles className="w-5 h-5 text-teal-400 shrink-0" />
                                                    <span>{text}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right Widgets */}
                                    {!isCanvasOpen && (
                                        <div className="hidden xl:flex xl:flex-col w-80 2xl:w-88 shrink-0 h-[calc(100vh-180px)]">
                                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                                                        <div key={widget.id} className="relative group/widget">
                                                            <button
                                                                onClick={() => handleRemoveWidget(widget.id, 'right')}
                                                                className="absolute -top-1 -right-1 z-10 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover/widget:opacity-100 transition-opacity shadow-md"
                                                                title="Xóa widget"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                            <WidgetComponent {...widgetProps} />
                                                        </div>
                                                    );
                                                })}
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
                                                className={cn(
                                                    "flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
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
                                                        "px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm",
                                                        msg.role === "user"
                                                            ? "bg-gray-900 text-white rounded-br-none"
                                                            : "bg-white border border-gray-100 text-gray-800 rounded-bl-none"
                                                    )}>
                                                        {msg.role === "ai" && msg.reasoning && (
                                                            <ThinkingBar
                                                                content={msg.reasoning}
                                                                isExpanded={thinkingExpanded && isLatest}
                                                                onToggle={() => setThinkingExpanded(prev => !prev)}
                                                            />
                                                        )}

                                                        {msg.role === "ai" && isLatest && latestMessageId === msg.id ? (
                                                            <TypewriterText text={msg.content} onComplete={() => setLatestMessageId(null)} />
                                                        ) : (
                                                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {isTyping && (
                                        <div className="flex gap-4 animate-pulse">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            </div>
                                            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
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
                        <div className="max-w-2xl mx-auto bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100 p-3 relative group focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                            {/* Selected Context Indicators */}
                            {(targetAssignmentId || targetClassId) && (
                                <div className="absolute -top-10 left-0 flex gap-2 overflow-x-auto py-2 px-1 max-w-full no-scrollbar">
                                    {targetAssignmentId && (
                                        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                            <ListTodo className="w-3.5 h-3.5" />
                                            <span className="truncate max-w-[150px]">
                                                {allAssignments.find(a => a.id === targetAssignmentId)?.title || "Bài tập"}
                                            </span>
                                            <button onClick={() => setTargetAssignmentId(null)} className="hover:bg-blue-200 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                                        </div>
                                    )}
                                    {targetClassId && (
                                        <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                            <LayoutGrid className="w-3.5 h-3.5" />
                                            <span className="truncate max-w-[150px]">
                                                {allClasses.find(c => c.id === targetClassId)?.name || "Lớp học"}
                                            </span>
                                            <button onClick={() => setTargetClassId(null)} className="hover:bg-indigo-200 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-2 relative">
                                <button
                                    onClick={() => setShowModeMenu(!showModeMenu)}
                                    className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors shrink-0"
                                >
                                    <Plus className={cn("w-5 h-5 transition-transform", showModeMenu && "rotate-45")} />
                                </button>

                                {/* Mode Menu Popup */}
                                {showModeMenu && (
                                    <div
                                        ref={menuRef}
                                        className="absolute bottom-full left-0 mb-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
                                    >
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chọn chế độ</h3>
                                            <button onClick={() => setShowModeMenu(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                                <X className="w-4 h-4 text-gray-400" />
                                            </button>
                                        </div>

                                        {/* Mode Grid */}
                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            {(user.role === 'teacher' ? TEACHER_MODES : STUDENT_MODES).map((mode) => {
                                                const IconComponent = mode.icon;
                                                const isActive = chatMode === mode.id;
                                                return (
                                                    <button
                                                        key={mode.id}
                                                        onClick={() => {
                                                            setChatMode(mode.id);
                                                            setShowModeMenu(false);
                                                        }}
                                                        className={cn(
                                                            "flex items-center gap-2 p-3 rounded-xl text-left transition-all",
                                                            isActive
                                                                ? "bg-blue-50 border-2 border-blue-200 text-blue-700"
                                                                : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent text-gray-700"
                                                        )}
                                                    >
                                                        <IconComponent className="w-4 h-4 shrink-0" />
                                                        <span className="text-xs font-semibold truncate">{mode.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Divider */}
                                        <div className="border-t border-gray-100 my-3" />

                                        {/* Context Selectors */}
                                        <div className="space-y-2">
                                            {/* Assignment Selector */}
                                            <div className="space-y-1">
                                                <button
                                                    onClick={() => setShowAssignmentSelector(!showAssignmentSelector)}
                                                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-all text-left"
                                                >
                                                    <ListTodo className="w-4 h-4" />
                                                    <div className="flex-1">
                                                        <span className="text-xs font-semibold">Chọn bài tập</span>
                                                        {targetAssignmentId && (
                                                            <p className="text-[10px] text-blue-600 truncate">
                                                                {allAssignments.find(a => a.id === targetAssignmentId)?.title}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <ChevronDown className={cn("w-4 h-4 opacity-50 transition-transform", showAssignmentSelector && "rotate-180")} />
                                                </button>
                                                {showAssignmentSelector && (
                                                    <div className="max-h-32 overflow-y-auto space-y-1 pl-4">
                                                        <button
                                                            onClick={() => { setTargetAssignmentId(null); setShowAssignmentSelector(false); }}
                                                            className={cn("w-full text-left p-2 rounded-lg text-xs", !targetAssignmentId ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100")}
                                                        >
                                                            Không chọn
                                                        </button>
                                                        {allAssignments.slice(0, 5).map(a => (
                                                            <button
                                                                key={a.id}
                                                                onClick={() => { setTargetAssignmentId(a.id); setShowAssignmentSelector(false); }}
                                                                className={cn("w-full text-left p-2 rounded-lg text-xs truncate", targetAssignmentId === a.id ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100")}
                                                            >
                                                                {a.title}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Class Selector */}
                                            <div className="space-y-1">
                                                <button
                                                    onClick={() => setShowClassSelector(!showClassSelector)}
                                                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 transition-all text-left"
                                                >
                                                    <LayoutGrid className="w-4 h-4" />
                                                    <div className="flex-1">
                                                        <span className="text-xs font-semibold">Chọn lớp học</span>
                                                        {targetClassId && (
                                                            <p className="text-[10px] text-indigo-600 truncate">
                                                                {allClasses.find(c => c.id === targetClassId)?.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <ChevronDown className={cn("w-4 h-4 opacity-50 transition-transform", showClassSelector && "rotate-180")} />
                                                </button>
                                                {showClassSelector && (
                                                    <div className="max-h-32 overflow-y-auto space-y-1 pl-4">
                                                        <button
                                                            onClick={() => { setTargetClassId(null); setShowClassSelector(false); }}
                                                            className={cn("w-full text-left p-2 rounded-lg text-xs", !targetClassId ? "bg-indigo-100 text-indigo-700" : "hover:bg-gray-100")}
                                                        >
                                                            Không chọn
                                                        </button>
                                                        {allClasses.map(c => (
                                                            <button
                                                                key={c.id}
                                                                onClick={() => { setTargetClassId(c.id); setShowClassSelector(false); }}
                                                                className={cn("w-full text-left p-2 rounded-lg text-xs truncate", targetClassId === c.id ? "bg-indigo-100 text-indigo-700" : "hover:bg-gray-100")}
                                                            >
                                                                {c.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className="border-t border-gray-100 my-3" />

                                        {/* Canvas Toggle */}
                                        <button
                                            onClick={() => setIsCanvasMode(!isCanvasMode)}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                                                isCanvasMode
                                                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                                                    : "bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-700"
                                            )}
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            <div className="flex-1">
                                                <span className="text-xs font-semibold">Canvas Mode</span>
                                                <p className="text-[10px] opacity-70">
                                                    {isCanvasMode ? "Đang bật - AI sẽ xuất nội dung ra Canvas" : "Tắt - Trả lời trong chat"}
                                                </p>
                                            </div>
                                            <div className={cn(
                                                "w-8 h-5 rounded-full transition-colors flex items-center px-0.5",
                                                isCanvasMode ? "bg-purple-500" : "bg-gray-300"
                                            )}>
                                                <div className={cn(
                                                    "w-4 h-4 bg-white rounded-full shadow transition-transform",
                                                    isCanvasMode && "translate-x-3"
                                                )} />
                                            </div>
                                        </button>
                                    </div>
                                )}
                                <textarea
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder={currentModeInfo.prompt || "Nhập tin nhắn..."}
                                    className="flex-1 max-h-32 min-h-[44px] py-3 bg-transparent border-none text-gray-800 placeholder-gray-400 focus:ring-0 focus:outline-none outline-none resize-none font-medium text-[15px]"
                                    rows={1}
                                />

                                <button
                                    onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all shrink-0",
                                        isThinkingEnabled ? "bg-purple-100 text-purple-600" : "hover:bg-gray-100 text-gray-400"
                                    )}
                                    title="Chế độ suy nghĩ sâu"
                                >
                                    <BrainCircuit className="w-5 h-5" />
                                    {isThinkingEnabled && <span className="text-xs font-semibold">Thinking</span>}
                                </button>

                                <button
                                    onClick={() => handleSend()}
                                    disabled={!inputValue.trim() || isTyping}
                                    className={cn(
                                        "p-3 rounded-full transition-all shadow-md",
                                        !inputValue.trim() || isTyping
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                            : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-blue-200"
                                    )}
                                >
                                    {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT CANVAS AREA */}
                {isCanvasOpen && (
                    <div className="w-1/2 bg-gray-50/50 border-l border-gray-200 flex flex-col h-full animate-in slide-in-from-right duration-500 shadow-2xl z-30">
                        {/* Canvas Header */}
                        <div className="h-16 px-6 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-xl">
                                    <Sparkles className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-900 leading-tight">Canvas thông minh</h2>
                                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                                        {canvasViewMode === 'dashboard' ? 'Tổng quan' : canvasViewMode === 'flashcards' ? 'Flashcards' : 'Nội dung'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                                    <Share2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setIsCanvasOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Canvas Content */}
                        <div className="flex-1 overflow-y-auto p-8 relative" id="canvas-content">
                            {(canvasContent && canvasContent.type === 'dashboard') || canvasViewMode === 'dashboard' ? (
                                <CanvasDashboard
                                    user={user}
                                    events={upcomingEvents}
                                    assignments={pendingAssignments}
                                    allAssignments={allAssignments}
                                    classes={allClasses}
                                    analytics={analytics}
                                    onAction={handleQuickAction}
                                />
                            ) : canvasContent && canvasContent.type === 'structured_content' ? (
                                <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {canvasContent.sections?.map((section: any, idx: number) => (
                                        <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
                                            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                                                <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                                                {section.heading}
                                            </h3>
                                            <div className="prose prose-sm text-gray-600 leading-relaxed">
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
                            ) : canvasContent && canvasContent.type === 'text' ? (
                                <div className="prose prose-lg max-w-none dark:prose-invert p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {canvasContent.content}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                    <LayoutGrid className="w-16 h-16 text-gray-300 mb-4" />
                                    <p className="text-gray-500">Chọn một nội dung để xem chi tiết</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Widget Store Modal */}
            <WidgetStore
                isOpen={isWidgetStoreOpen}
                onClose={() => setIsWidgetStoreOpen(false)}
                onAddWidget={handleAddWidget}
                userRole={user.role as any}
                currentWidgets={activeWidgetColumn ? widgetsConfig[activeWidgetColumn] : []}
            />
        </div>
    );
}
