"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
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
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/types";
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

interface AIPlaygroundProps {
    user: User;
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

type ChatMode = "standard" | "solver" | "summary" | "exam" | "writing" | "planner" | "grader" | "analysis";

interface ModeInfo {
    id: ChatMode;
    label: string;
    icon: any;
    description: string;
    recommendations: string[];
    contextType?: 'assignment' | 'class' | 'schedule' | 'none';
}

const STUDENT_MODES: ModeInfo[] = [
    {
        id: "standard",
        label: "Bình thường",
        icon: MessageCircle,
        description: "Trợ lý học tập tổng quát",
        recommendations: ["Lập kế hoạch học tập tuần này", "Giải thích khái niệm Quantum Physics", "Cách học tốt môn Văn"],
        contextType: "assignment"
    },
    {
        id: "solver",
        label: "Giải bài tập",
        icon: BrainCircuit,
        description: "Hướng dẫn giải bài từng bước",
        recommendations: ["Giải bài toán tích phân này", "Giải thích hiện tượng quang điện", "Phân tích nhân vật Huấn Cao"],
        contextType: "assignment"
    },
    {
        id: "summary",
        label: "Tóm tắt",
        icon: FileText,
        description: "Tóm tắt nội dung bài học",
        recommendations: ["Tóm tắt chương 1 SGK Sử 12", "Rút gọn các ý chính bài thơ Tây Tiến", "Ý chính của thuyết tiến hóa"],
        contextType: "none"
    },
    {
        id: "exam",
        label: "Ôn thi",
        icon: Target,
        description: "Luyện tập và kiểm tra kiến thức",
        recommendations: ["Tạo 5 câu hỏi trắc nghiệm Toán", "Kiểm tra kiến thức về các triều đại", "Mẹo làm bài thi THPT Quốc gia"],
        contextType: "assignment"
    },
    {
        id: "writing",
        label: "Sáng tạo",
        icon: PenTool,
        description: "Hỗ trợ viết lách và diễn đạt",
        recommendations: ["Viết mở bài nghị luận xã hội", "Sửa lỗi diễn đạt đoạn văn này", "Gợi ý ý tưởng bài viết sáng tạo"],
        contextType: "none"
    }
];

const TEACHER_MODES: ModeInfo[] = [
    {
        id: "standard",
        label: "Chung",
        icon: MessageCircle,
        description: "Trợ lý giảng dạy tổng quát",
        recommendations: ["Soạn tin nhắn nhắc nhở lớp 12A1", "Gợi ý cách quản lý lớp học", "Tổng hợp thông báo tuần"],
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

// --- Typewriter Effect Component (word by word for better readability) ---
const TypewriterText = ({ text, speed = 30, onComplete }: { text: string; speed?: number; onComplete?: () => void }) => {
    const [displayedWords, setDisplayedWords] = useState(0);
    const words = text.split(/(\s+)/); // Split keeping whitespace

    useEffect(() => {
        if (displayedWords >= words.length) {
            onComplete?.();
            return;
        }

        const timer = setTimeout(() => {
            setDisplayedWords(prev => prev + 1);
        }, speed);

        return () => clearTimeout(timer);
    }, [displayedWords, words.length, speed, onComplete]);

    const displayed = words.slice(0, displayedWords).join('');
    const isComplete = displayedWords >= words.length;

    return (
        <span>
            {displayed}
            {!isComplete && <span className="inline-block w-1 h-4 bg-blue-500 ml-0.5 animate-pulse align-middle" />}
        </span>
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
    const MODES = user.role === 'teacher' ? TEACHER_MODES : STUDENT_MODES;
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [upcomingEvents, setUpcomingEvents] = useState<ScheduleEvent[]>([]);
    const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);
    const [chatMode, setChatMode] = useState<ChatMode>("standard");
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

    const messagesEndRef = useRef<HTMLDivElement>(null);
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
            // Optionally close history on mobile
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

    const handleQuickAction = (action: "assignments" | "grades") => {
        let content = "";
        let canvasData = null;

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
        }

        const aiMsg: Message = {
            id: Date.now().toString(),
            role: "ai",
            content: content,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, aiMsg]);

        // Demo Canvas triggering
        if (canvasData) {
            setCanvasContent(canvasData);
            setCanvasViewMode("content");
            setIsCanvasOpen(true);
        }
    };

    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || input;
        if (!textToSend.trim() || isTyping) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: textToSend,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
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

            const messageId = (Date.now() + 1).toString();
            const aiMessage: Message = {
                id: messageId,
                role: "ai",
                content: data.reply || "Xin lỗi, mình gặp chút trục trặc.",
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

            // Simulate opening Canvas for long types of content if not empty
            if (chatMode === "writing" || chatMode === "summary" || chatMode === "solver") {
                // Simple heuristic for demo: if reply is long, put it in canvas
                if (data.reply && data.reply.length > 200) {
                    // Extract main content (remove greetings) for canvas
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
                            <div className="hidden sm:flex items-center bg-gray-100 rounded-full px-3 py-1 gap-2">
                                <Zap className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-[11px] font-black text-gray-600 uppercase tracking-wider">MiMo V2 Flash</span>
                            </div>
                        </div>
                    </header>

                    {/* Scrollable Container for Messages */}
                    <div className="flex-1 overflow-y-auto pt-16 pb-32 px-4 scrollbar-hide">
                        {/* Consistent Centered Content Wrapper - Never changes max-width during transition */}
                        <div className="w-full max-w-2xl mx-auto transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]">
                            {/* Hero Section or Messages */}
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full min-h-[70vh]">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5 }}
                                        className="text-center w-full"
                                    >
                                        {/* AI Avatar */}
                                        <div className="relative mb-8 inline-block">
                                            <div className="w-32 h-32 bg-[#F7F9FB] rounded-full flex items-center justify-center relative shadow-sm mx-auto">
                                                <Bot className="w-14 h-14 text-[#00C2A0]" />
                                                <div className="absolute bottom-3 right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-50">
                                                    <Sparkles className="w-4 h-4 text-[#00C2A0]" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-8">
                                            <h1 className="text-[26px] font-bold text-[#202124] tracking-tight">
                                                Chào bạn, mình là Miqix AI!
                                            </h1>
                                            <p className="text-[16px] text-[#70757a] font-medium">
                                                Bạn cần hỗ trợ gì cho bài tập và lớp học hôm nay?
                                            </p>
                                        </div>

                                        {/* Active Mode Chips - Above Input Bar */}
                                        {(isThinkingEnabled || isCanvasMode) && (
                                            <div className="flex items-center justify-center gap-2 mb-3">
                                                {isThinkingEnabled && (
                                                    <div onClick={() => setIsThinkingEnabled(false)} className="flex items-center gap-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-xl text-[12px] font-bold cursor-pointer">
                                                        <Activity className="w-3.5 h-3.5 animate-pulse" />
                                                        <span>Thinking</span>
                                                        <X className="w-3 h-3 ml-0.5 opacity-50" />
                                                    </div>
                                                )}
                                                {isCanvasMode && (
                                                    <div onClick={() => setIsCanvasMode(false)} className="flex items-center gap-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-xl text-[12px] font-bold cursor-pointer">
                                                        <LayoutGrid className="w-3.5 h-3.5" />
                                                        <span>Canvas</span>
                                                        <X className="w-3 h-3 ml-0.5 opacity-50" />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Input Bar - Shown in Empty State */}
                                        <div className="w-full max-w-2xl mx-auto px-4">
                                            <div className="bg-[#f1f3f4] rounded-[32px] p-1.5 flex items-center gap-1 shadow-sm border border-gray-100">
                                                <button
                                                    onClick={() => setIsCanvasOpen(!isCanvasOpen)}
                                                    className={cn(
                                                        "w-10 h-10 rounded-full transition-all flex items-center justify-center shrink-0 relative group shadow-sm",
                                                        isCanvasOpen
                                                            ? "bg-[#1a73e8] text-white ring-2 ring-white shadow-md"
                                                            : "bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#1a73e8] hover:text-white"
                                                    )}
                                                >
                                                    {isCanvasOpen ? <X className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />}
                                                </button>

                                                {/* Dynamic Context Selector based on mode */}
                                                {currentModeInfo.contextType === 'assignment' && (
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setShowAssignmentSelector(!showAssignmentSelector)}
                                                            className={cn(
                                                                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                                                targetAssignmentId ? "bg-amber-100 text-amber-600" : "hover:bg-gray-200 text-gray-400"
                                                            )}
                                                        >
                                                            <BookMarked className="w-5 h-5" />
                                                        </button>

                                                        <AnimatePresence>
                                                            {showAssignmentSelector && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                    animate={{ opacity: 1, y: -8, scale: 1 }}
                                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                    className="absolute bottom-full left-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 z-50 mb-4 max-h-96 overflow-y-auto"
                                                                >
                                                                    <div className="mb-3">
                                                                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2 px-2">Chọn bài tập</p>
                                                                        <div
                                                                            onClick={() => {
                                                                                setTargetAssignmentId(null);
                                                                                setShowAssignmentSelector(false);
                                                                            }}
                                                                            className={cn(
                                                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all",
                                                                                !targetAssignmentId ? "bg-gray-100 font-bold" : "hover:bg-gray-50"
                                                                            )}
                                                                        >
                                                                            <X className="w-4 h-4 text-gray-400" />
                                                                            <span className="text-[13px] text-gray-600">Không chọn</span>
                                                                        </div>
                                                                    </div>
                                                                    {allAssignments.map((assignment) => (
                                                                        <div
                                                                            key={assignment.id}
                                                                            onClick={() => {
                                                                                setTargetAssignmentId(assignment.id);
                                                                                setShowAssignmentSelector(false);
                                                                            }}
                                                                            className={cn(
                                                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer mb-1 transition-all",
                                                                                targetAssignmentId === assignment.id ? "bg-amber-50 border border-amber-200" : "hover:bg-gray-50"
                                                                            )}
                                                                        >
                                                                            <div className={cn(
                                                                                "w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0",
                                                                                targetAssignmentId === assignment.id ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-500"
                                                                            )}>
                                                                                {(assignment.subject || "XX").substring(0, 2).toUpperCase()}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className={cn(
                                                                                    "text-[13px] font-bold truncate",
                                                                                    targetAssignmentId === assignment.id ? "text-amber-700" : "text-gray-700"
                                                                                )}>
                                                                                    {assignment.title}
                                                                                </p>
                                                                                <p className="text-[10px] text-gray-400 truncate">
                                                                                    {assignment.assignmentClasses?.[0]?.class?.name || "Lớp học"}
                                                                                </p>
                                                                            </div>
                                                                            {targetAssignmentId === assignment.id && (
                                                                                <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                )}

                                                {currentModeInfo.contextType === 'class' && (
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setShowClassSelector(!showClassSelector)}
                                                            className={cn(
                                                                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                                                targetClassId ? "bg-blue-100 text-blue-600" : "hover:bg-gray-200 text-gray-400"
                                                            )}
                                                        >
                                                            <BookOpen className="w-5 h-5" />
                                                        </button>

                                                        <AnimatePresence>
                                                            {showClassSelector && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                    animate={{ opacity: 1, y: -8, scale: 1 }}
                                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                    className="absolute bottom-full left-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 z-50 mb-4 max-h-96 overflow-y-auto"
                                                                >
                                                                    <div className="mb-3">
                                                                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2 px-2">Chọn lớp học</p>
                                                                        <div
                                                                            onClick={() => {
                                                                                setTargetClassId(null);
                                                                                setShowClassSelector(false);
                                                                            }}
                                                                            className={cn(
                                                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all",
                                                                                !targetClassId ? "bg-gray-100 font-bold" : "hover:bg-gray-50"
                                                                            )}
                                                                        >
                                                                            <X className="w-4 h-4 text-gray-400" />
                                                                            <span className="text-[13px] text-gray-600">Không chọn</span>
                                                                        </div>
                                                                    </div>
                                                                    {allClasses.map((cls) => (
                                                                        <div
                                                                            key={cls.id}
                                                                            onClick={() => {
                                                                                setTargetClassId(cls.id);
                                                                                setShowClassSelector(false);
                                                                            }}
                                                                            className={cn(
                                                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer mb-1 transition-all",
                                                                                targetClassId === cls.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                                                                            )}
                                                                        >
                                                                            <div className={cn(
                                                                                "w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0",
                                                                                targetClassId === cls.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                                                                            )}>
                                                                                {cls.name.substring(0, 2).toUpperCase()}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className={cn(
                                                                                    "text-[13px] font-bold truncate",
                                                                                    targetClassId === cls.id ? "text-blue-700" : "text-gray-700"
                                                                                )}>
                                                                                    {cls.name}
                                                                                </p>
                                                                                <p className="text-[10px] text-gray-400 truncate">
                                                                                    {cls._count?.students || 0} học sinh
                                                                                </p>
                                                                            </div>
                                                                            {targetClassId === cls.id && (
                                                                                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                )}

                                                <input
                                                    type="text"
                                                    value={input}
                                                    onChange={(e) => setInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                                                    placeholder="Nhập yêu cầu..."
                                                    className="flex-1 bg-transparent outline-none text-[#202124] placeholder-[#5f6368] px-2 font-medium text-[15px] min-w-[200px]"
                                                    autoFocus
                                                />

                                                <div className="flex items-center gap-2 pr-1">
                                                    <div className="relative" ref={menuRef}>
                                                        <div
                                                            onClick={() => setShowModeMenu(!showModeMenu)}
                                                            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors h-10"
                                                        >
                                                            <currentModeInfo.icon className="w-4 h-4 text-[#1a73e8]" />
                                                            <span className="text-[13px] font-bold text-[#5f6368] whitespace-nowrap">{currentModeInfo.label}</span>
                                                            <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", showModeMenu && "rotate-180")} />
                                                        </div>

                                                        <AnimatePresence>
                                                            {showModeMenu && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                    animate={{ opacity: 1, y: -8, scale: 1 }}
                                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                    className="absolute bottom-full right-0 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 overflow-hidden z-50 mb-4"
                                                                >
                                                                    <div className="px-3 py-2 border-b border-gray-50 mb-1">
                                                                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Cấu hình phản hồi</p>
                                                                    </div>

                                                                    {/* Toggles Section */}
                                                                    <div className="p-2 space-y-1 border-b border-gray-50 mb-1">
                                                                        <div
                                                                            onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}
                                                                            className={cn(
                                                                                "flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors",
                                                                                isThinkingEnabled ? "bg-purple-50 text-purple-700" : "hover:bg-gray-50 text-gray-600"
                                                                            )}
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                <Activity className="w-4 h-4" />
                                                                                <span className="text-[13px] font-medium">Thinking Mode</span>
                                                                            </div>
                                                                            {isThinkingEnabled && <CheckCircle className="w-3.5 h-3.5" />}
                                                                        </div>

                                                                        <div
                                                                            onClick={() => setIsCanvasMode(!isCanvasMode)}
                                                                            className={cn(
                                                                                "flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors",
                                                                                isCanvasMode ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50 text-gray-600"
                                                                            )}
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                <LayoutGrid className="w-4 h-4" />
                                                                                <span className="text-[13px] font-medium">Canvas Mode</span>
                                                                            </div>
                                                                            {isCanvasMode && <CheckCircle className="w-3.5 h-3.5" />}
                                                                        </div>
                                                                    </div>

                                                                    <div className="px-3 py-2 border-b border-gray-50 mb-1">
                                                                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Chế độ trợ lý</p>
                                                                    </div>
                                                                    {MODES.map((mode) => (
                                                                        <div
                                                                            key={mode.id}
                                                                            onClick={() => {
                                                                                setChatMode(mode.id);
                                                                                setShowModeMenu(false);
                                                                            }}
                                                                            className={cn(
                                                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors group",
                                                                                chatMode === mode.id ? "bg-[#e8f0fe]" : "hover:bg-gray-50"
                                                                            )}
                                                                        >
                                                                            <div className={cn(
                                                                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                                                                chatMode === mode.id ? "bg-white text-[#1a73e8]" : "bg-gray-100 text-gray-500 group-hover:bg-white"
                                                                            )}>
                                                                                <mode.icon className="w-4 h-4" />
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <p className={cn("text-[13px] font-bold", chatMode === mode.id ? "text-[#1a73e8]" : "text-gray-700")}>{mode.label}</p>
                                                                                <p className="text-[10px] text-gray-400 font-medium">{mode.description}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>

                                                    <button
                                                        onClick={() => handleSend()}
                                                        disabled={!input.trim() || isTyping}
                                                        className="w-10 h-10 rounded-full bg-white text-[#5f6368] shadow-sm hover:shadow-md disabled:opacity-40 transition-all flex items-center justify-center"
                                                    >
                                                        {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 text-[#1a73e8]" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            ) : (
                                <div className="space-y-8 pb-4">
                                    <AnimatePresence mode="popLayout">
                                        {messages.map((msg) => (
                                            <motion.div
                                                key={msg.timestamp} // Using timestamp as key, assuming unique enough
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className={cn("flex gap-3 md:gap-4", msg.role === "user" ? "justify-end" : "justify-start")}
                                            >
                                                {msg.role === "ai" && (
                                                    <div className="w-8 h-8 rounded-full bg-[#f0fdfa] border border-[#ccfbf1] flex items-center justify-center shrink-0 mt-1">
                                                        <Bot className="w-4 h-4 text-[#0d9488]" />
                                                    </div>
                                                )}

                                                <div className={cn(
                                                    "max-w-[90%] px-5 py-3.5 rounded-[22px] text-[15px] shadow-sm break-words",
                                                    msg.role === "ai"
                                                        ? "bg-[#f8f9fa] text-[#3c4043] rounded-tl-none border border-gray-100 prose prose-sm prose-slate max-w-none prose-p:my-1 prose-ul:my-2 prose-li:my-0.5 prose-p:leading-loose"
                                                        : "bg-[#1a73e8] text-white rounded-tr-none"
                                                )}>
                                                    {(() => {
                                                        const { text, payload } = extractPayload(msg.content);

                                                        if (payload) {
                                                            let previewCard: React.ReactNode = null;

                                                            if (payload.type === 'options' && payload.data) {
                                                                previewCard = (
                                                                    <div className="grid grid-cols-1 gap-2 pt-2">
                                                                        {payload.data.map((opt: any, idx: number) => (
                                                                            <div
                                                                                key={idx}
                                                                                onClick={() => {
                                                                                    setCanvasContent(opt.content);
                                                                                    setCanvasViewMode("content");
                                                                                    setIsCanvasOpen(true);
                                                                                }}
                                                                                className="group border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center justify-between bg-white shadow-sm"
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 group-hover:text-blue-600 font-bold text-xs">#{idx + 1}</div>
                                                                                    <div>
                                                                                        <h4 className="text-sm font-bold text-gray-800 group-hover:text-blue-700 transition-colors">{opt.title}</h4>
                                                                                        <p className="text-[11px] text-gray-400 line-clamp-1 group-hover:text-blue-500/80">Nhấn để xem chi tiết</p>
                                                                                    </div>
                                                                                </div>
                                                                                <Maximize2 className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-600" />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            } else if (payload.type === 'flashcards') {
                                                                previewCard = (
                                                                    <div
                                                                        onClick={() => {
                                                                            setCanvasContent(payload);
                                                                            setCanvasViewMode("flashcards");
                                                                            setIsCanvasOpen(true);
                                                                        }}
                                                                        className="mt-3 cursor-pointer group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white shadow-lg transition-transform hover:scale-[1.02]"
                                                                    >
                                                                        <div className="relative z-10 flex items-center justify-between">
                                                                            <div>
                                                                                <h4 className="text-lg font-bold">Bộ Flashcard Ôn Tập</h4>
                                                                                <p className="text-xs text-indigo-100 opacity-80">{payload.data.length} thẻ ghi nhớ</p>
                                                                            </div>
                                                                            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                                                                                <Sparkles className="h-5 w-5 text-yellow-300" />
                                                                            </div>
                                                                        </div>
                                                                        <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-xl transition-all group-hover:bg-white/20" />
                                                                    </div>
                                                                );
                                                            } else if (payload.type === 'structured_content') {
                                                                previewCard = (
                                                                    <div
                                                                        onClick={() => {
                                                                            setCanvasContent(payload);
                                                                            setCanvasViewMode("lesson_plan");
                                                                            setIsCanvasOpen(true);
                                                                        }}
                                                                        className="mt-3 cursor-pointer group border border-blue-100 bg-blue-50/50 rounded-2xl p-5 hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center gap-4"
                                                                    >
                                                                        <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shadow-sm text-blue-600">
                                                                            <FileText className="h-6 w-6" />
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="font-bold text-gray-900 group-hover:text-blue-700">{payload.title || "Tài liệu học tập"}</h4>
                                                                            <p className="text-xs text-gray-500">Nhấn để mở bản xem đầy đủ</p>
                                                                        </div>
                                                                        <ArrowRight className="ml-auto w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <div className="space-y-4">
                                                                    {text && (
                                                                        <div className="prose prose-sm max-w-none text-gray-800 prose-p:leading-relaxed">
                                                                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{text}</ReactMarkdown>
                                                                        </div>
                                                                    )}
                                                                    {previewCard}
                                                                </div>
                                                            );
                                                        }

                                                        // Default Render with thinking bar and typewriter
                                                        return msg.role === 'ai' ? (
                                                            <div>
                                                                {/* Thinking Bar - collapsible */}
                                                                {msg.reasoning && (
                                                                    <ThinkingBar
                                                                        content={msg.reasoning}
                                                                        isExpanded={thinkingExpanded}
                                                                        onToggle={() => setThinkingExpanded(!thinkingExpanded)}
                                                                    />
                                                                )}
                                                                {/* Main content */}
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                    {msg.content}
                                                                </ReactMarkdown>
                                                            </div>
                                                        ) : (
                                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                                        );
                                                    })()}
                                                    <span className={cn(
                                                        "text-[10px] mt-2 block font-medium",
                                                        msg.role === "ai" ? "opacity-40" : "opacity-70"
                                                    )}>
                                                        {format(new Date(msg.timestamp), "HH:mm")}
                                                    </span>
                                                </div>

                                                {msg.role === "user" && (
                                                    <div className="w-8 h-8 rounded-full bg-[#e8f0fe] flex items-center justify-center shrink-0 text-[#1a73e8] font-bold text-[10px] uppercase mt-1">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {isTyping && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                                            <div className="w-8 h-8 rounded-full bg-[#f0fdfa] border border-[#ccfbf1] flex items-center justify-center shrink-0 mt-1">
                                                <Bot className="w-4 h-4 text-[#0d9488]" />
                                            </div>
                                            <div className="bg-[#f8f9fa] px-5 py-4 rounded-[22px] flex items-center gap-1.5 border border-gray-50">
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                            </div>
                                        </motion.div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Absolute Input Area - Only shown when there are messages */}
                    {messages.length > 0 && (
                        <div className={cn(
                            "absolute bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md pb-6 pt-2 px-4 border-t border-transparent",
                            isCanvasOpen ? "border-gray-50" : ""
                        )}>
                            <div className="relative flex flex-col gap-3 mx-auto max-w-2xl px-2 sm:px-0">
                                {/* Active Mode Chips - Above Input Bar */}
                                {(isThinkingEnabled || isCanvasMode || targetAssignmentId || targetClassId) && (
                                    <div className="flex items-center gap-2 mb-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                        {isThinkingEnabled && (
                                            <div
                                                onClick={() => setIsThinkingEnabled(false)}
                                                className="flex items-center gap-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-xl text-[12px] font-bold cursor-pointer hover:bg-purple-200 transition-colors"
                                            >
                                                <Activity className="w-3.5 h-3.5 animate-pulse" />
                                                <span>Thinking</span>
                                                <X className="w-3 h-3 ml-0.5 opacity-50" />
                                            </div>
                                        )}
                                        {isCanvasMode && (
                                            <div
                                                onClick={() => setIsCanvasMode(false)}
                                                className="flex items-center gap-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-xl text-[12px] font-bold cursor-pointer hover:bg-indigo-200 transition-colors"
                                            >
                                                <LayoutGrid className="w-3.5 h-3.5" />
                                                <span>Canvas</span>
                                                <X className="w-3 h-3 ml-0.5 opacity-50" />
                                            </div>
                                        )}
                                        {targetAssignmentId && (
                                            <div
                                                onClick={() => setTargetAssignmentId(null)}
                                                className="flex items-center gap-1 px-3 py-2 bg-amber-100 text-amber-700 rounded-xl text-[12px] font-bold cursor-pointer hover:bg-amber-200 transition-colors max-w-[200px]"
                                            >
                                                <BookMarked className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate">{allAssignments.find(a => a.id === targetAssignmentId)?.title || "Bài tập"}</span>
                                                <X className="w-3 h-3 ml-0.5 opacity-50 shrink-0" />
                                            </div>
                                        )}
                                        {targetClassId && (
                                            <div
                                                onClick={() => setTargetClassId(null)}
                                                className="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-xl text-[12px] font-bold cursor-pointer hover:bg-blue-200 transition-colors max-w-[200px]"
                                            >
                                                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate">{allClasses.find(c => c.id === targetClassId)?.name || "Lớp học"}</span>
                                                <X className="w-3 h-3 ml-0.5 opacity-50 shrink-0" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="bg-[#f1f3f4] rounded-[32px] p-1.5 flex items-center gap-1 shadow-sm border border-gray-100 relative">
                                    <button
                                        onClick={() => setIsCanvasOpen(!isCanvasOpen)}
                                        className={cn(
                                            "w-10 h-10 rounded-full transition-all flex items-center justify-center shrink-0 relative group shadow-sm",
                                            isCanvasOpen
                                                ? "bg-[#1a73e8] text-white ring-2 ring-white shadow-md"
                                                : "bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#1a73e8] hover:text-white"
                                        )}
                                        title={isCanvasOpen ? "Đóng Canvas" : "Mở Canvas"}
                                    >
                                        {isCanvasOpen ? <X className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />}

                                        {!isCanvasOpen && (
                                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-sm z-10">
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                            </div>
                                        )}
                                    </button>

                                    {/* Dynamic Context Selector based on mode */}
                                    {currentModeInfo.contextType === 'assignment' && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowAssignmentSelector(!showAssignmentSelector)}
                                                className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                                    targetAssignmentId ? "bg-amber-100 text-amber-600" : "hover:bg-gray-200 text-gray-400"
                                                )}
                                                title="Chọn bài tập"
                                            >
                                                <BookMarked className="w-5 h-5" />
                                            </button>

                                            <AnimatePresence>
                                                {showAssignmentSelector && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        className="absolute bottom-full left-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 mb-3 overflow-hidden"
                                                    >
                                                        {/* Header */}
                                                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                                            <p className="text-xs font-bold text-gray-600">Chọn bài tập ngữ cảnh</p>
                                                            {targetAssignmentId && (
                                                                <button
                                                                    onClick={() => {
                                                                        setTargetAssignmentId(null);
                                                                        setShowAssignmentSelector(false);
                                                                    }}
                                                                    className="text-[10px] text-red-500 font-bold hover:underline"
                                                                >
                                                                    Xóa chọn
                                                                </button>
                                                            )}
                                                        </div>
                                                        {/* List */}
                                                        <div className="max-h-60 overflow-y-auto p-2">
                                                            {allAssignments.length === 0 ? (
                                                                <p className="text-center text-gray-400 text-xs py-4">Không có bài tập nào</p>
                                                            ) : (
                                                                <div className="space-y-1">
                                                                    {allAssignments.map((a) => (
                                                                        <div
                                                                            key={a.id}
                                                                            onClick={() => {
                                                                                setTargetAssignmentId(targetAssignmentId === a.id ? null : a.id);
                                                                                setShowAssignmentSelector(false);
                                                                            }}
                                                                            className={cn(
                                                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all",
                                                                                targetAssignmentId === a.id
                                                                                    ? "bg-amber-50 border border-amber-200"
                                                                                    : "hover:bg-gray-50 border border-transparent"
                                                                            )}
                                                                        >
                                                                            <div className={cn(
                                                                                "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0",
                                                                                targetAssignmentId === a.id ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-500"
                                                                            )}>
                                                                                {(a.subject || "BT").substring(0, 2).toUpperCase()}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className={cn(
                                                                                    "text-[13px] font-semibold truncate",
                                                                                    targetAssignmentId === a.id ? "text-amber-700" : "text-gray-700"
                                                                                )}>
                                                                                    {a.title}
                                                                                </p>
                                                                                <p className="text-[10px] text-gray-400 truncate">
                                                                                    {a.assignmentClasses?.[0]?.class?.name || "Lớp học"}
                                                                                </p>
                                                                            </div>
                                                                            {targetAssignmentId === a.id && (
                                                                                <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}

                                    {currentModeInfo.contextType === 'class' && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowClassSelector(!showClassSelector)}
                                                className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                                    targetClassId ? "bg-blue-100 text-blue-600" : "hover:bg-gray-200 text-gray-400"
                                                )}
                                                title="Chọn lớp học"
                                            >
                                                <BookOpen className="w-5 h-5" />
                                            </button>

                                            <AnimatePresence>
                                                {showClassSelector && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        className="absolute bottom-full left-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 mb-3 overflow-hidden"
                                                    >
                                                        {/* Header */}
                                                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                                            <p className="text-xs font-bold text-gray-600">Chọn lớp học</p>
                                                            {targetClassId && (
                                                                <button
                                                                    onClick={() => {
                                                                        setTargetClassId(null);
                                                                        setShowClassSelector(false);
                                                                    }}
                                                                    className="text-[10px] text-red-500 font-bold hover:underline"
                                                                >
                                                                    Xóa chọn
                                                                </button>
                                                            )}
                                                        </div>
                                                        {/* List */}
                                                        <div className="max-h-60 overflow-y-auto p-2">
                                                            {allClasses.length === 0 ? (
                                                                <p className="text-center text-gray-400 text-xs py-4">Không có lớp học nào</p>
                                                            ) : (
                                                                <div className="space-y-1">
                                                                    {allClasses.map((cls) => (
                                                                        <div
                                                                            key={cls.id}
                                                                            onClick={() => {
                                                                                setTargetClassId(targetClassId === cls.id ? null : cls.id);
                                                                                setShowClassSelector(false);
                                                                            }}
                                                                            className={cn(
                                                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all",
                                                                                targetClassId === cls.id
                                                                                    ? "bg-blue-50 border border-blue-200"
                                                                                    : "hover:bg-gray-50 border border-transparent"
                                                                            )}
                                                                        >
                                                                            <div className={cn(
                                                                                "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0",
                                                                                targetClassId === cls.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                                                                            )}>
                                                                                {cls.name.substring(0, 2).toUpperCase()}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className={cn(
                                                                                    "text-[13px] font-semibold truncate",
                                                                                    targetClassId === cls.id ? "text-blue-700" : "text-gray-700"
                                                                                )}>
                                                                                    {cls.name}
                                                                                </p>
                                                                                <p className="text-[10px] text-gray-400">
                                                                                    {cls._count?.students || 0} học sinh
                                                                                </p>
                                                                            </div>
                                                                            {targetClassId === cls.id && (
                                                                                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}

                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                                        placeholder={targetAssignmentId ? "Hỏi về bài tập đã chọn..." : targetClassId ? "Hỏi về lớp học đã chọn..." : "Nhập yêu cầu..."}
                                        className="flex-1 bg-transparent outline-none text-[#202124] placeholder-[#5f6368] px-2 font-medium text-[15px] min-w-[200px]"
                                        autoFocus
                                    />

                                    <div className="flex items-center gap-2 pr-1">
                                        {/* Thinking Mode Toggle */}

                                        {/* Mode Selector Dropdown */}
                                        <div className="relative" ref={menuRef}>
                                            <div
                                                onClick={() => setShowModeMenu(!showModeMenu)}
                                                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors select-none h-10"
                                            >
                                                <currentModeInfo.icon className="w-4 h-4 text-[#1a73e8]" />
                                                <span className="text-[13px] font-bold text-[#5f6368] whitespace-nowrap">{currentModeInfo.label}</span>
                                                <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", showModeMenu && "rotate-180")} />
                                            </div>
                                            <AnimatePresence>
                                                {showModeMenu && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: -8, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        className="absolute bottom-full right-0 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 overflow-hidden z-50 mb-4"
                                                    >
                                                        <div className="px-3 py-2 border-b border-gray-50 mb-1">
                                                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Cấu hình phản hồi</p>
                                                        </div>

                                                        {/* Toggles Section */}
                                                        <div className="p-2 space-y-1 border-b border-gray-50 mb-1">
                                                            <div
                                                                onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}
                                                                className={cn(
                                                                    "flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors",
                                                                    isThinkingEnabled ? "bg-purple-50 text-purple-700" : "hover:bg-gray-50 text-gray-600"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <Activity className="w-4 h-4" />
                                                                    <span className="text-[13px] font-medium">Thinking Mode</span>
                                                                </div>
                                                                {isThinkingEnabled && <CheckCircle className="w-3.5 h-3.5" />}
                                                            </div>

                                                            <div
                                                                onClick={() => setIsCanvasMode(!isCanvasMode)}
                                                                className={cn(
                                                                    "flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors",
                                                                    isCanvasMode ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50 text-gray-600"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <LayoutGrid className="w-4 h-4" />
                                                                    <span className="text-[13px] font-medium">Canvas Mode</span>
                                                                </div>
                                                                {isCanvasMode && <CheckCircle className="w-3.5 h-3.5" />}
                                                            </div>
                                                        </div>

                                                        <div className="px-3 py-2 border-b border-gray-50 mb-1">
                                                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Chế độ trợ lý</p>
                                                        </div>
                                                        {MODES.map((mode) => (
                                                            <div
                                                                key={mode.id}
                                                                onClick={() => {
                                                                    setChatMode(mode.id);
                                                                    setShowModeMenu(false);
                                                                }}
                                                                className={cn(
                                                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors group",
                                                                    chatMode === mode.id ? "bg-[#e8f0fe]" : "hover:bg-gray-50"
                                                                )}
                                                            >
                                                                <div className={cn(
                                                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                                                    chatMode === mode.id ? "bg-white text-[#1a73e8]" : "bg-gray-100 text-gray-500 group-hover:bg-white"
                                                                )}>
                                                                    <mode.icon className="w-4 h-4" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className={cn("text-[13px] font-bold", chatMode === mode.id ? "text-[#1a73e8]" : "text-gray-700")}>{mode.label}</p>
                                                                    <p className="text-[10px] text-gray-400 font-medium">{mode.description}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <button
                                            onClick={() => handleSend()}
                                            disabled={!input.trim() || isTyping}
                                            className="w-10 h-10 rounded-full bg-white text-[#5f6368] shadow-sm hover:shadow-md disabled:opacity-40 transition-all flex items-center justify-center flex-shrink-0"
                                        >
                                            {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 text-[#1a73e8]" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT CANVAS AREA - Pushes the content */}
                <div className={cn(
                    "h-screen bg-[#F9FAFB] border-l border-gray-200 transition-[width] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col",
                    isCanvasOpen ? "w-1/2 opacity-100" : "w-0 opacity-0 overflow-hidden"
                )}>
                    {/* Canvas Header */}
                    <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                canvasViewMode === "dashboard" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                            )}>
                                {canvasViewMode === "dashboard" ? <LayoutGrid className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-900">
                                    {canvasViewMode === "dashboard" ? "Miqix Dashboard" : "Bản nháp thông minh"}
                                </h2>
                                <p className="text-[11px] text-gray-500">
                                    {canvasViewMode === "dashboard" ? "Quản gia thông minh của bạn" : "Được tạo bởi Miqix AI"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* View Switcher */}
                            <div className="hidden bg-gray-100 p-1 rounded-xl sm:flex items-center">
                                <button
                                    onClick={() => setCanvasViewMode("dashboard")}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                        canvasViewMode === "dashboard" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    Tổng quan
                                </button>
                                {/* Enable "Content" tab even if empty to allow playground usage */}
                                <button
                                    onClick={() => {
                                        setCanvasViewMode("content");
                                        // Ensure canvas opens when clicking Content if closed
                                        if (!isCanvasOpen) setIsCanvasOpen(true);
                                    }}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                        canvasViewMode === "content" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    Nội dung
                                </button>
                            </div>

                            <div className="flex items-center border-l border-gray-200 pl-4 ml-2 gap-2">
                                <button
                                    onClick={() => setIsCanvasOpen(false)}
                                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500" title="Đóng Canvas"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Canvas Body */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                        {canvasViewMode === "flashcards" && canvasContent?.data ? (
                            <FlashcardCanvas data={canvasContent.data} />
                        ) : canvasViewMode === "lesson_plan" && canvasContent ? (
                            <LessonPlanCanvas title={canvasContent.title} sections={canvasContent.sections} />
                        ) : canvasViewMode === "content" ? (
                            <div className="flex flex-col h-full">
                                {/* Editor Toolbar */}
                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setIsEditingContent(!isEditingContent)}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                                isEditingContent
                                                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                                                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                                            )}
                                        >
                                            {isEditingContent ? (
                                                <>
                                                    <BookOpen className="w-3.5 h-3.5" />
                                                    Xem trước
                                                </>
                                            ) : (
                                                <>
                                                    <PenTool className="w-3.5 h-3.5" />
                                                    Chỉnh sửa
                                                </>
                                            )}
                                        </button>

                                        {isEditingContent && (
                                            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mẫu:</span>
                                                <button
                                                    onClick={() => setCanvasContent(`:::payload
{
  "type": "flashcards",
  "data": [
    {"front": "Tế bào nhân sơ", "back": "Là tế bào chưa có nhân hoàn chỉnh, không có màng nhân ngăn cách chất nhân và tế bào chất."},
    {"front": "Tế bào nhân thực", "back": "Là tế bào có nhân hoàn chỉnh, vật chất di truyền được bao bọc bởi màng nhân."}
  ]
}
:::`)}
                                                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-md text-[10px] font-bold transition-colors"
                                                >
                                                    Flashcards
                                                </button>
                                                <button
                                                    onClick={() => setCanvasContent(`:::payload
{
  "type": "structured_content",
  "title": "Giáo án Ngữ Văn 12: Vợ Chồng A Phủ",
  "sections": [
    {"heading": "1. Mục tiêu bài học", "content": "- Hiểu được giá trị hiện thực và nhân đạo của tác phẩm.\\n- Phân tích được sức sống tiềm tàng của nhân vật Mị."},
    {"heading": "2. Hoạt động khởi động", "content": "Chiếu video clip về cuộc sống người dân Tây Bắc."}
  ]
}
:::`)}
                                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-md text-[10px] font-bold transition-colors"
                                                >
                                                    Giáo án
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {isEditingContent && (
                                        <button
                                            onClick={() => setCanvasContent("")}
                                            className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 hover:bg-red-50 rounded-md transition-colors"
                                        >
                                            Xóa trắng
                                        </button>
                                    )}
                                </div>

                                {/* Content Area */}
                                <div className="flex-1 overflow-y-auto min-h-0 relative">
                                    {isEditingContent ? (
                                        <textarea
                                            value={typeof canvasContent === 'string' ? canvasContent : JSON.stringify(canvasContent, null, 2)}
                                            onChange={(e) => setCanvasContent(e.target.value)}
                                            className="w-full h-full resize-none p-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-mono text-sm leading-relaxed"
                                            placeholder="Nhập nội dung markdown hoặc payload JSON..."
                                        />
                                    ) : (
                                        <div className="prose prose-sm md:prose-base max-w-none text-gray-800 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-p:leading-relaxed">
                                            {typeof canvasContent === 'string' ? (
                                                (() => {
                                                    const { text, payload } = extractPayload(canvasContent || "");
                                                    if (payload) {
                                                        if (payload.type === 'flashcards') return <FlashcardCanvas data={payload.data} />;
                                                        if (payload.type === 'structured_content') return <LessonPlanCanvas title={payload.title || "Tài liệu không tên"} sections={payload.sections || []} />;
                                                    }
                                                    return <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{text || "_Chưa có nội dung_"}</ReactMarkdown>;
                                                })()
                                            ) : (
                                                <div className="text-gray-400 italic">Dữ liệu dạng Object (Chuyển sang chế độ chỉnh sửa để xem JSON)</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <CanvasDashboard
                                user={user}
                                events={upcomingEvents}
                                assignments={pendingAssignments}
                                allAssignments={allAssignments}
                                classes={allClasses}
                                analytics={analytics}
                                onAction={(act: any) => {
                                    const prompts: Record<string, string> = user.role === 'teacher' ? {
                                        assignments: "Liệt kê các bài tập cần chấm điểm ngay.",
                                        flashcards: "Gợi ý bộ câu hỏi kiểm tra cho học sinh.",
                                        history: "Xem lại các báo cáo phân tích lớp học cũ.",
                                        grades: "Hiển thị bảng điểm tổng quát của các lớp."
                                    } : {
                                        assignments: "Lập kế hoạch học tập cho các bài tập sắp tới của tôi.",
                                        flashcards: "Hãy tạo flashcard ôn tập cho nội dung học tập gần đây.",
                                        history: "Cho mình xem lại nhật ký học tập và các bản tóm tắt cũ.",
                                        grades: "Cho tôi xem điểm số gần đây của tôi."
                                    };
                                    handleSend(prompts[act] || "Hướng dẫn mình cách dùng Miqix.");
                                }}
                            />
                        )}
                    </div>
                </div>
            </div >
        </div >
    );
}

function CanvasDashboard({ user, events, assignments, allAssignments, classes, analytics, onAction }: {
    user: User,
    events: ScheduleEvent[],
    assignments: PendingAssignment[],
    allAssignments: any[],
    classes: any[],
    analytics: any,
    onAction: (action: "assignments" | "grades" | "flashcards" | "history" | "classes") => void
}) {
    // 1. Calculate stats
    const isTeacher = user.role === 'teacher';
    const totalAssignments = allAssignments.length;
    const pendingCount = isTeacher ? analytics?.ungradedCount || 0 : assignments.length;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* 1. Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-2 mb-2">
                        <ListTodo className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                            {isTeacher ? "Cần chấm bài" : "Bài tập"}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-gray-900">{pendingCount}</span>
                        <span className="text-[10px] font-medium text-gray-400">/ {totalAssignments}</span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-3.5 h-3.5 text-rose-500" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                            {isTeacher ? "ĐTB Lớp" : "Điểm TB"}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-gray-900">{analytics?.averageScore?.toFixed(1) || analytics?.myAverageScore?.toFixed(1) || "0.0"}</span>
                        <span className="text-[10px] font-medium text-emerald-500">/ 10</span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                            {isTeacher ? "Sĩ số" : "Nộp bài"}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-gray-900">
                            {isTeacher ? analytics?.activeStudents || 0 : analytics?.mySubmissionRate || "0"}
                        </span>
                        <span className="text-[10px] font-medium text-gray-400">{isTeacher ? "bạn" : "%"}</span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Chuyên cần</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-gray-900">{analytics?.attendanceRate || analytics?.myAttendanceRate || "100"}</span>
                        <span className="text-[10px] font-medium text-gray-400">%</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 2. Priority Tasks Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <ListTodo className="w-3.5 h-3.5" /> {isTeacher ? "Bài tập cần chấm" : "Nhiệm vụ ưu tiên"}
                        </h3>
                        <button onClick={() => onAction("assignments")} className="text-[10px] font-bold text-blue-600 hover:underline">Xem tất cả</button>
                    </div>

                    <div className="space-y-2">
                        {assignments.length > 0 ? (
                            assignments.slice(0, 3).map((a, i) => (
                                <div key={i} className="group flex items-center gap-4 bg-white p-4 rounded-3xl border border-gray-50 hover:border-blue-100 hover:shadow-sm transition-all">
                                    <div className="w-10 h-10 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center font-black text-xs group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        {a.subjectCode?.substring(0, 1) || "B"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[13px] font-bold text-gray-900 truncate">{a.title}</h4>
                                        <p className="text-[10px] text-gray-500 flex items-center gap-2">
                                            <span>{a.className}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                            <span className="font-bold text-amber-600">Hạn: {format(new Date(a.dueDate), "dd/MM")}</span>
                                        </p>
                                    </div>
                                    {isTeacher && (
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                                                Cần chấm
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="bg-gray-50/50 rounded-[2rem] p-8 text-center border border-dashed border-gray-200">
                                <p className="text-sm text-gray-400 font-medium">Bạn đã hoàn thành mọi {isTeacher ? "chấm điểm" : "nhiệm vụ"}! 🥳</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Recent Classes Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <LayoutGrid className="w-3.5 h-3.5" /> {isTeacher ? "Lớp học đang dạy" : "Lớp học gần đây"}
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {classes.slice(0, 4).map((c, i) => (
                            <div key={i} className="group bg-white p-3 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer text-center">
                                <div className="w-10 h-10 mx-auto bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 font-bold text-xs mb-2 group-hover:bg-white transition-colors">
                                    {c.name.substring(0, 2).toUpperCase()}
                                </div>
                                <p className="text-[11px] font-bold text-gray-900 truncate">{c.name}</p>
                                <p className="text-[9px] text-gray-400">{c.code}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 4. Butler Insights */}
            <div className="bg-gradient-to-br from-[#1a1c23] to-[#2d313e] p-6 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl border border-white/5">
                <div className="absolute -top-4 -right-4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400/80">Miqix Intelligence</span>
                    </div>
                    <p className="text-[14px] font-medium leading-[1.6] text-gray-100">
                        {isTeacher ? (
                            <>
                                Kính chào Thầy/Cô {user.name.split(' ').pop()}, hiện tại đang có <b>{analytics?.ungradedCount || 0}</b> bài làm cần được chấm điểm. Thầy/Cô có muốn mình hỗ trợ phân tích và gợi ý chấm điểm nhanh không?
                            </>
                        ) : assignments.length > 0 ? (
                            <>
                                Chào {user.name.split(' ')[0]}, dựa trên dữ liệu hiện tại, bài <b>{assignments[0].title}</b> cần được hoàn thành sớm nhất. Bạn có muốn mình phân tích đề bài và gợi ý hướng làm không?
                            </>
                        ) : (
                            <>
                                Tuyệt vời {user.name.split(' ')[0]}! Bạn đang giữ tỷ lệ nộp bài <b>{analytics?.mySubmissionRate}%</b>. Hôm nay chưa có bài tập mới, bạn có muốn mình tóm tắt lại kiến thức cũ không?
                            </>
                        )}
                    </p>
                    <div className="mt-5 flex gap-2">
                        <button
                            onClick={() => onAction("assignments")}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-[11px] font-bold transition-colors border border-white/10"
                        >
                            Chấp nhận
                        </button>
                        <button
                            onClick={() => onAction("flashcards")}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[11px] font-bold transition-colors"
                        >
                            Để sau
                        </button>
                    </div>
                </div>
            </div>

            {/* 5. Quick Tools Hub */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <button onClick={() => onAction("flashcards")} className="flex items-center gap-3 p-4 bg-purple-50/50 hover:bg-purple-50 rounded-2xl border border-purple-100/50 transition-all text-left">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-[11px] font-bold text-gray-700">{isTeacher ? "Tạo câu hỏi" : "Tạo Flashcard"}</span>
                </button>
                <button onClick={() => onAction("history")} className="flex items-center gap-3 p-4 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl border border-emerald-100/50 transition-all text-left">
                    <History className="w-4 h-4 text-emerald-600" />
                    <span className="text-[11px] font-bold text-gray-700">{isTeacher ? "Lịch sử dạy" : "Lịch sử AI"}</span>
                </button>
                <button onClick={() => onAction("grades")} className="flex items-center gap-3 p-4 bg-blue-50/50 hover:bg-blue-50 rounded-2xl border border-blue-100/50 transition-all text-left">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="text-[11px] font-bold text-gray-700">{isTeacher ? "Kết quả học" : "Bảng điểm"}</span>
                </button>
                <button onClick={() => onAction("assignments")} className="flex items-center gap-3 p-4 bg-orange-50/50 hover:bg-orange-50 rounded-2xl border border-orange-100/50 transition-all text-left">
                    <ListTodo className="w-4 h-4 text-orange-600" />
                    <span className="text-[11px] font-bold text-gray-700">{isTeacher ? "Sổ chấm điểm" : "Việc cần làm"}</span>
                </button>
            </div>
        </div>
    );
}
