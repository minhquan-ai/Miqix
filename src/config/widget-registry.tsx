import React from 'react';
import {
    Calendar, Users, BookOpen, User, Bell, Activity,
    Target, Trophy, Clock, AlertCircle, GraduationCap, CheckCircle
} from 'lucide-react';

// Import all existing widget components
import { MiniScheduleWidget } from "@/components/features/dashboard/widgets/MiniScheduleWidget";
import { MiniAssignmentsWidget } from "@/components/features/dashboard/widgets/MiniAssignmentsWidget";
import { MiniStatsWidget } from "@/components/features/dashboard/widgets/MiniStatsWidget";
import { NotificationsWidget } from "@/components/features/dashboard/widgets/NotificationsWidget";
import { RecentActivityWidget } from "@/components/features/dashboard/widgets/RecentActivityWidget";
import { WeeklyGoalsWidget } from "@/components/features/dashboard/widgets/WeeklyGoalsWidget";
import { AchievementsWidget } from "@/components/features/dashboard/widgets/AchievementsWidget";
import { AssignmentsToGradeWidget } from "@/components/features/dashboard/widgets/AssignmentsToGradeWidget";
import { StudentsNeedHelpWidget } from "@/components/features/dashboard/widgets/StudentsNeedHelpWidget";
import { TeacherClassesWidget } from "@/components/features/dashboard/widgets/TeacherClassesWidget";
import { GradingProgressWidget } from "@/components/features/dashboard/widgets/GradingProgressWidget";

// Type definition for a widget
export interface WidgetDefinition {
    id: string;
    title: string;
    description: string;
    icon: any;
    component: React.ComponentType<any>;
    allowedRoles: ('student' | 'teacher')[];
    defaultProps?: any;
    color: string;
}

// The Central Registry of all available widgets
export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
    // --- COMMON WIDGETS ---
    'schedule': {
        id: 'schedule',
        title: 'Lịch học/dạy',
        description: 'Xem lịch chi tiết trong ngày',
        icon: Calendar,
        component: MiniScheduleWidget,
        allowedRoles: ['student', 'teacher'],
        color: 'bg-blue-500'
    },
    'notifications': {
        id: 'notifications',
        title: 'Thông báo',
        description: 'Cập nhật tin tức mới nhất',
        icon: Bell,
        component: NotificationsWidget,
        allowedRoles: ['student', 'teacher'],
        color: 'bg-purple-500'
    },

    // --- STUDENT WIDGETS ---
    'student_stats': {
        id: 'student_stats',
        title: 'Thành tích học tập',
        description: 'Điểm số và chuyên cần',
        icon: User,
        component: MiniStatsWidget,
        allowedRoles: ['student'],
        color: 'bg-emerald-500'
    },
    'assignments': {
        id: 'assignments',
        title: 'Bài tập về nhà',
        description: 'Danh sách bài tập sắp tới',
        icon: BookOpen,
        component: MiniAssignmentsWidget,
        allowedRoles: ['student'],
        color: 'bg-orange-500'
    },
    'recent_activity': {
        id: 'recent_activity',
        title: 'Hoạt động gần đây',
        description: 'Lịch sử nộp bài, điểm số',
        icon: Activity,
        component: RecentActivityWidget,
        allowedRoles: ['student'],
        color: 'bg-indigo-500'
    },
    'weekly_goals': {
        id: 'weekly_goals',
        title: 'Mục tiêu tuần',
        description: 'Tiến độ hoàn thành bài tập',
        icon: Target,
        component: WeeklyGoalsWidget,
        allowedRoles: ['student'],
        color: 'bg-violet-500'
    },
    'achievements': {
        id: 'achievements',
        title: 'Huy hiệu & Chuỗi',
        description: 'Bộ sưu tập thành tích',
        icon: Trophy,
        component: AchievementsWidget,
        allowedRoles: ['student'],
        color: 'bg-amber-500'
    },

    // --- TEACHER WIDGETS ---
    'grading': {
        id: 'grading',
        title: 'Cần chấm gấp',
        description: 'Bài tập quá hạn hoặc ưu tiên',
        icon: AlertCircle,
        component: AssignmentsToGradeWidget,
        allowedRoles: ['teacher'],
        color: 'bg-red-500'
    },
    'students_risk': {
        id: 'students_risk',
        title: 'Học sinh cần hỗ trợ',
        description: 'Danh sách học sinh có nguy cơ',
        icon: Users,
        component: StudentsNeedHelpWidget,
        allowedRoles: ['teacher'],
        color: 'bg-amber-600'
    },
    'teacher_classes': {
        id: 'teacher_classes',
        title: 'Lớp đang dạy',
        description: 'Danh sách các lớp phụ trách',
        icon: GraduationCap,
        component: TeacherClassesWidget,
        allowedRoles: ['teacher'],
        color: 'bg-indigo-600'
    },
    'grading_progress': {
        id: 'grading_progress',
        title: 'Tiến độ chấm bài',
        description: 'Tổng quan tiến độ công việc',
        icon: CheckCircle,
        component: GradingProgressWidget,
        allowedRoles: ['teacher'],
        color: 'bg-green-600'
    }
};

// Functions to help getting widgets
export const getWidgetsByRole = (role: 'student' | 'teacher') => {
    return Object.values(WIDGET_REGISTRY).filter(w => w.allowedRoles.includes(role));
};

export const getDefaultLayout = (role: 'student' | 'teacher') => {
    if (role === 'student') {
        return {
            left: ['schedule', 'student_stats', 'notifications'],
            right: ['assignments', 'weekly_goals', 'achievements']
        };
    } else {
        return {
            left: ['schedule', 'grading', 'students_risk'],
            right: ['teacher_classes', 'grading_progress']
        };
    }
};
