import {
    getClassesAction,
    getAssignmentsAction,
    createAssignmentAction,
    getCurrentUserAction
} from "../actions/index";
import { getTeacherDashboardAnalyticsAction, getStudentDashboardAnalyticsAction } from "../actions/analytics-actions";
import { createPersonalEventAction } from "../actions/schedule-actions";

export const AI_TOOLS = [
    {
        type: "function",
        function: {
            name: "get_classes",
            description: "Lấy danh sách các lớp học của người dùng hiện tại.",
            parameters: {
                type: "object",
                properties: {},
                required: [],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_upcoming_assignments",
            description: "Lấy danh sách các bài tập sắp đến hạn.",
            parameters: {
                type: "object",
                properties: {
                    classId: {
                        type: "string",
                        description: "ID của lớp học cụ thể (tùy chọn).",
                    },
                },
                required: [],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_learning_analytics",
            description: "Lấy phân tích học tập hoặc báo cáo hiệu suất lớp học.",
            parameters: {
                type: "object",
                properties: {},
                required: [],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "add_personal_task",
            description: "Thêm một sự kiện hoặc nhiệm vụ cá nhân vào lịch biểu.",
            parameters: {
                type: "object",
                properties: {
                    title: { type: "string", description: "Tiêu đề nhiệm vụ" },
                    start: { type: "string", description: "Thời gian bắt đầu (ISO format)" },
                    end: { type: "string", description: "Thời gian kết thúc (ISO format)" },
                },
                required: ["title", "start", "end"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "create_assignment",
            description: "Tạo một bài tập mới cho một hoặc nhiều lớp học.",
            parameters: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    dueDate: { type: "string", description: "Ngày hạn nộp (ISO format)" },
                    subject: { type: "string" },
                    classIds: { type: "array", items: { type: "string" } },
                },
                required: ["title", "description", "dueDate", "classIds"],
            },
        },
    }
];

export async function handleToolCall(name: string, args: any) {
    console.log(`[AI TOOL CALL]: ${name}`, args);

    switch (name) {
        case "get_classes":
            return await getClassesAction();

        case "get_upcoming_assignments":
            return await getAssignmentsAction(args.classId);

        case "get_learning_analytics":
            const user = await getCurrentUserAction();
            if (user?.role === 'teacher') {
                return await getTeacherDashboardAnalyticsAction();
            } else {
                return await getStudentDashboardAnalyticsAction();
            }

        case "add_personal_task":
            return await createPersonalEventAction({
                title: args.title,
                start: args.start,
                end: args.end,
                description: args.description,
                color: 'indigo'
            });

        case "create_assignment":
            const teacher = await getCurrentUserAction();
            if (teacher?.role !== 'teacher') return { error: "Permission denied" };
            return await createAssignmentAction(args);

        default:
            throw new Error(`Tool ${name} not found`);
    }
}
