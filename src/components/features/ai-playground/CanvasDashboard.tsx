import { User } from "@/types";
import { ScheduleEvent } from "@/lib/schedule-actions";
import { ListTodo, Activity, Zap, Target, LayoutGrid, Sparkles, History } from "lucide-react";
import { format } from "date-fns";

export interface PendingAssignment {
    id: string;
    title: string;
    className: string;
    dueDate: Date;
    subjectCode: string;
}

interface CanvasDashboardProps {
    user: User;
    events: ScheduleEvent[];
    assignments: PendingAssignment[];
    allAssignments: any[];
    classes: any[];
    analytics: any;
    onAction: (action: "assignments" | "grades" | "flashcards" | "history" | "classes") => void;
}

export function CanvasDashboard({
    user,
    events,
    assignments,
    allAssignments,
    classes,
    analytics,
    onAction
}: CanvasDashboardProps) {
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
                            assignments.slice(0, 3).map((a: any, i: number) => (
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
                        {classes.slice(0, 4).map((c: any, i: number) => (
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
