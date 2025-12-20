"use server";

import { db } from "@/lib/db";
import { getCurrentUserAction } from "@/lib/actions";
import { addDays, startOfWeek, parseISO, setHours, setMinutes, format, isSameDay, getHours } from "date-fns";
import { vi } from "date-fns/locale";
import { GroqService } from "./groq-service";

export type ScheduleEventType = 'class' | 'assignment' | 'exam' | 'event' | 'personal';

export interface ScheduleEvent {
    id: string;
    title: string;
    description?: string;
    type: ScheduleEventType;
    start: Date;
    end: Date;
    color?: string;
    location?: string;
    classId?: string;
    className?: string;
    url?: string;
    isRecurring?: boolean; // True for class schedule
    status?: 'upcoming' | 'ongoing' | 'completed' | 'late';
}

const parseRecurringSchedule = (cls: any, weekStart: Date): ScheduleEvent[] => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const events: ScheduleEvent[] = [];
    if (!cls.schedule) return events;

    const dayMap: Record<string, number> = {
        '2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6,
        'mon': 0, 'tue': 1, 'wed': 2, 'thu': 3, 'fri': 4, 'sat': 5, 'sun': 6
    };

    try {
        if (cls.schedule.startsWith('{')) {
            const jsonSchedule = JSON.parse(cls.schedule);
            for (const [key, slot] of Object.entries(jsonSchedule)) {
                const s = slot as any; // eslint-disable-line @typescript-eslint/no-explicit-any
                if (s.dayId && s.startTime && s.endTime) {
                    const dayId = s.dayId.toLowerCase().slice(0, 3);
                    const offset = dayMap[dayId];
                    if (offset === undefined) continue;

                    const [startH, startM] = s.startTime.split(':').map(Number);
                    const [endH, endM] = s.endTime.split(':').map(Number);

                    const eventDate = addDays(weekStart, offset);
                    const startDate = setMinutes(setHours(eventDate, startH), startM || 0);
                    const endDate = setMinutes(setHours(eventDate, endH), endM || 0);

                    events.push({
                        id: `${cls.id}_${key}`,
                        title: cls.name,
                        description: s.subject || cls.subject,
                        type: 'class',
                        start: startDate,
                        end: endDate,
                        color: cls.color || 'purple',
                        location: s.room || 'Phòng học',
                        classId: cls.id,
                        className: cls.name,
                        isRecurring: true,
                        status: 'upcoming'
                    });
                }
            }
            return events;
        }
    } catch { }

    const daysMatch = cls.schedule.match(/Thứ\s*([\d,\s]+)/i);
    const timeMatch = cls.schedule.match(/\((\d{1,2}):?(\d{2})?\s*[-–]\s*(\d{1,2}):?(\d{2})?\)/);

    if (daysMatch && timeMatch) {
        const days = daysMatch[1].split(',').map((d: string) => d.trim());
        const startH = parseInt(timeMatch[1]);
        const startM = parseInt(timeMatch[2] || '0');
        const endH = parseInt(timeMatch[3]);
        const endM = parseInt(timeMatch[4] || '0');

        days.forEach((dayNum: string) => {
            const offset = dayMap[dayNum];
            if (offset === undefined) return;

            const eventDate = addDays(weekStart, offset);
            const startDate = setMinutes(setHours(eventDate, startH), startM);
            const endDate = setMinutes(setHours(eventDate, endH), endM);

            events.push({
                id: `${cls.id}_day${dayNum}_${startH}`,
                title: cls.name,
                description: cls.subject,
                type: 'class',
                start: startDate,
                end: endDate,
                color: cls.color || 'blue',
                location: 'Phòng học',
                classId: cls.id,
                className: cls.name,
                isRecurring: true,
                status: 'upcoming'
            });
        });
    }

    return events;
};

export async function createPersonalEventAction(data: { title: string, description?: string, start: string, end: string, color?: string, location?: string }) {
    const user = await getCurrentUserAction();
    if (!user) throw new Error("Unauthorized");

    await db.personalEvent.create({
        data: {
            userId: user.id,
            title: data.title,
            description: data.description,
            startTime: parseISO(data.start),
            endTime: parseISO(data.end),
            color: data.color || 'green',
            location: data.location
        }
    });
    return { success: true };
}

export async function deletePersonalEventAction(eventId: string) {
    const user = await getCurrentUserAction();
    if (!user) throw new Error("Unauthorized");

    const result = await db.personalEvent.deleteMany({
        where: { id: eventId, userId: user.id }
    });

    return { success: true, count: result.count };
}

export async function getAggregatedScheduleAction(weekStartStr?: string) {
    const user = await getCurrentUserAction();
    if (!user) return { events: [], todo: [] };

    const weekStart = weekStartStr ? parseISO(weekStartStr) : startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 7);

    try {
        let classes = [];
        if (user.role === 'teacher') {
            classes = await db.class.findMany({
                where: { teacherId: user.id },
            });
        } else {
            const enrollments = await db.classEnrollment.findMany({
                where: { userId: user.id, status: 'active' },
                include: { class: true }
            });
            classes = enrollments.map((e: any) => e.class);
        }

        const classIds = classes.map((c: any) => c.id);
        const assignments = await db.assignment.findMany({
            where: {
                OR: [
                    { teacherId: user.id },
                    { assignmentClasses: { some: { classId: { in: classIds } } } }
                ],
                dueDate: { gte: weekStart, lte: weekEnd }
            },
            include: { assignmentClasses: { include: { class: true } } }
        });

        // Fetch Personal Events
        const personalEvents = await db.personalEvent.findMany({
            where: {
                userId: user.id,
                startTime: { gte: weekStart, lte: weekEnd }
            }
        });

        let allEvents: ScheduleEvent[] = [];

        classes.forEach((cls: any) => {
            const classEvents = parseRecurringSchedule(cls, weekStart);
            allEvents = [...allEvents, ...classEvents];
        });

        assignments.forEach((submission: any) => {
            const due = new Date(submission.dueDate);
            const start = setMinutes(due, due.getMinutes() - 30);
            allEvents.push({
                id: `assign_${submission.id}`,
                title: submission.title,
                description: "Hạn nộp bài tập",
                type: 'assignment',
                start: start,
                end: due,
                color: 'orange',
                location: 'Online',
                status: 'upcoming',
                url: `/dashboard/assignments/${submission.id}`
            });
        });

        // Add Personal Events to the list
        personalEvents.forEach((evt: any) => {
            allEvents.push({
                id: evt.id,
                title: evt.title,
                description: evt.description || "",
                type: 'personal',
                start: evt.startTime,
                end: evt.endTime,
                color: evt.color,
                location: evt.location || "Không xác định",
                status: 'upcoming'
            });
        });

        const todoList = assignments.map((a: any) => ({
            id: a.id,
            title: a.title,
            deadline: a.dueDate,
            class: 'Lớp học',
            type: 'assignment'
        }));

        return { events: allEvents, todo: todoList };

    } catch (error) {
        console.error("Error fetching aggregated schedule:", error);
        return { events: [], todo: [] };
    }
}

// AI Analysis Action
export async function analyzeScheduleAIAction(weekStartStr: string, query?: string, history: any[] = []) {
    const user = await getCurrentUserAction();
    const scheduleData = await getAggregatedScheduleAction(weekStartStr);
    const events = scheduleData.events;

    // Algorithmic Pre-processing
    const dayDensity: Record<string, number> = {};
    const freeSlots: string[] = [];
    const busyDays: string[] = [];
    let weekStart = new Date();

    try {
        weekStart = parseISO(weekStartStr);
        if (isNaN(weekStart.getTime())) {
            weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        }

        events.forEach(e => {
            if (!e.start || !e.end) return;
            const dayKey = format(e.start, 'EEEE (dd/MM)', { locale: vi });
            const duration = (e.end.getTime() - e.start.getTime()) / (1000 * 60 * 60); // hours
            dayDensity[dayKey] = (dayDensity[dayKey] || 0) + duration;
        });

        Object.entries(dayDensity).forEach(([day, hours]) => {
            if (hours > 6) busyDays.push(day);
        });

        const days = [0, 1, 2, 3, 4, 5, 6].map(i => addDays(weekStart, i));
        days.forEach(day => {
            const dayEvents = events.filter(e => isSameDay(e.start, day)).sort((a, b) => a.start.getTime() - b.start.getTime());

            // Check Morning gap (8:00 - 11:00)
            let morningFree = true;
            dayEvents.forEach(e => {
                const h = getHours(e.start);
                if (h >= 7 && h <= 11) morningFree = false;
            });
            if (morningFree) freeSlots.push(`${format(day, 'EEEE', { locale: vi })} sáng (8h-11h)`);

            // Check Afternoon gap (13:00 - 17:00)
            let afternoonFree = true;
            dayEvents.forEach(e => {
                const h = getHours(e.start);
                if (h >= 13 && h <= 17) afternoonFree = false;
            });
            if (afternoonFree) freeSlots.push(`${format(day, 'EEEE', { locale: vi })} chiều (13h-17h)`);
        });
    } catch (preprocessingError) {
        console.error("Error in schedule pre-processing:", preprocessingError);
    }

    // 3. Optimize event list for AI (limit tokens)
    const sortedEvents = [...events].sort((a, b) =>
        Math.abs(new Date(a.start).getTime() - new Date().getTime()) -
        Math.abs(new Date(b.start).getTime() - new Date().getTime())
    );
    const relevantEvents = sortedEvents.slice(0, 40);

    // Prompt Construction
    const contextLines = [
        `HÔM NAY LÀ: ${format(new Date(), 'EEEE, dd/MM/yyyy', { locale: vi })} (Giờ hiện tại: ${format(new Date(), 'HH:mm')})`,
        `THÔNG TIN NGƯỜI DÙNG:`,
        `- Tên: ${user?.name || "Người dùng"}`,
        `- Vai trò: ${user?.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}`,
        ``,
        `Dữ liệu lịch trình (từ ngày ${format(weekStart, 'dd/MM/yyyy')}):`,
        `- Các ngày bận rộn: ${busyDays.join(", ") || "Không có đặc biệt"}`,
        `- Các khoảng trống gợi ý: ${freeSlots.slice(0, 5).join(", ")}...`,
        `- Tổng số sự kiện: ${events.length} ${events.length > 40 ? "(Hiển thị 40 sự kiện quan trọng nhất)" : ""}`,
        `- DANH SÁCH CHI TIẾT SỰ KIỆN:`,
        relevantEvents.length === 0 ? "Chưa có sự kiện nào." : relevantEvents.map(e => {
            const typeStr = e.type === 'class' ? '[CLASS]' : e.type === 'assignment' ? '[TODO]' : '[PERS]';
            try {
                const dayName = format(new Date(e.start), 'EEEE', { locale: vi });
                return `- ${typeStr} ${e.title} [ID: ${e.id}]: ${dayName} (${format(new Date(e.start), 'dd/MM')}), ${format(new Date(e.start), 'HH:mm')}-${format(new Date(e.end), 'HH:mm')}`;
            } catch {
                return `- [!] Sự kiện lỗi ID: ${e.id}`;
            }
        }).join("\n")
    ].join("\n");

    const historyText = history.length > 0
        ? `LỊCH SỬ TRÒ CHUYỆN:\n${history.map(m => `${m.role === 'user' ? 'Người dùng' : 'AI'}: ${m.content}`).join("\n")}`
        : "";

    const systemPrompt = `Bạn là Trợ lý Lịch biểu Ergonix (Ergonix AI).
Nhiệm vụ: Trả lời câu hỏi về lịch trình dựa trên dữ liệu sự kiện và lịch sử trò chuyện.

QUY TẮC BẮT BUỘC:
1. LUÔN trả về một đối tượng JSON duy nhất. KHÔNG kèm theo lời giải thích bên ngoài JSON.
2. Định dạng JSON:
{
    "options": [
        {
            "label": "Tên khung giờ (VD: Thứ 2 Chiều)",
            "description": "Mô tả hành động",
            "events": [{ "title": "...", "start": "...", "end": "..." }]
        }
    ],
    "message": "Lời giải đáp thân thiện bằng Markdown.",
    "actions": [
        {
            "type": "delete_personal",
            "eventId": "UUID",
            "title": "Tên sự kiện"
        }
    ]
}
3. JSON FORMAT (NGHIÊM NGẶT): 
   - KHÔNG được có dấu phẩy (trailing comma) ở cuối danh sách/đối tượng.
   - KHÔNG chứa comment.
   - Chuỗi văn bản phải thoát ký tự đặc biệt đúng chuẩn JSON (VD: "dòng 1\\ndòng 2").
4. QUY TẮC ACTIONS:
   - CHỈ dùng 'delete_personal' cho sự kiện [PERS].
   - Dùng chính xác ID từ danh sách trên.
5. KIỂM TRA DỮ LIỆU: Chỉ dựa vào dữ liệu được cung cấp.
6. DUY TRÌ NGỮ CẢNH: Đọc kỹ "LỊCH SỬ TRÒ CHUYỆN".
7. 'options': Chỉ dùng khi người dùng muốn THÊM lịch. Phải có ít nhất 1 event.
8. 'actions': Mảng các hành động xóa.`;

    const fullPrompt = `
DỮ LIỆU LỊCH TRÌNH HIỆN TẠI:
${contextLines}

${historyText}

CÂU HỎI HIỆN TẠI CỦA NGƯỜI DÙNG:
"${query || "Phân tích tổng quan"}"

Hãy phản hồi bằng JSON theo quy tắc đã nêu.`;

    try {
        const result = await GroqService.generateText(fullPrompt, systemPrompt);

        // More robust JSON extraction
        let jsonStr = result.trim();
        const jsonBlockMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/```\s*([\s\S]*?)\s*```/);

        if (jsonBlockMatch) {
            jsonStr = jsonBlockMatch[1];
        } else {
            const firstBrace = result.indexOf('{');
            const lastBrace = result.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                jsonStr = result.substring(firstBrace, lastBrace + 1);
            }
        }

        let parsed: any;
        try {
            const cleanedJson = jsonStr
                .replace(/,\s*}/g, '}')
                .replace(/,\s*]/g, ']');

            parsed = JSON.parse(cleanedJson);
        } catch (parseError) {
            console.warn("Failed to parse AI JSON. Falling back.", result);
            const cleanText = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const looksLikeJSON = cleanText.startsWith('{') || cleanText.startsWith('[');

            if (!looksLikeJSON && cleanText.length > 0) {
                parsed = { message: cleanText, actions: [], options: [] };
            } else {
                const messageMatch = jsonStr.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                let msg = "Xin lỗi, mình đang gặp chút khó khăn khi đọc dữ liệu. Bạn thử nhắn lại nhé! 😓";
                if (messageMatch && messageMatch[1]) {
                    try { msg = JSON.parse(`"${messageMatch[1]}"`); } catch { msg = messageMatch[1]; }
                }
                parsed = { message: msg, actions: [], options: [] };
            }
        }

        return {
            message: parsed.message || (typeof parsed === 'string' ? parsed : "Mình đã xử lý xong yêu cầu của bạn."),
            actions: Array.isArray(parsed.actions) ? parsed.actions : [],
            options: Array.isArray(parsed.options) ? parsed.options : []
        };
    } catch (e) {
        console.error("AI Analysis failed:", e);
        return {
            message: "Xin lỗi, mình đang gặp chút khó khăn khi xử lý lịch trình. Bạn vui lòng thử lại nhé! 🔄",
            options: [],
            actions: []
        };
    }
}
