"use client";

import {
    Users,
    CalendarCheck,
    FileSpreadsheet,
    Settings,
    ArrowRight,
    UserCheck,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
    Palette,
    Bell,
    Shield
} from "lucide-react";
import { DraggableModal } from "@/components/ui/DraggableModal";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { useNavigation } from "@/components/NavigationProvider";

// Types for preview data
interface AttendancePreview {
    totalSessions: number;
    presentRate: number;
    recentSession?: { date: string; present: number; absent: number };
}

interface GradesPreview {
    totalAssignments: number;
    gradedCount: number;
    averageScore: number;
    pendingCount: number;
}

interface ClassSettingsPreview {
    name: string;
    subject: string;
    code: string;
    studentCount: number;
}

interface QuickActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'invite' | 'attendance' | 'grades' | 'settings';
    classId: string;
    className?: string;
    // Preview data props
    attendanceData?: AttendancePreview;
    gradesData?: GradesPreview;
    settingsData?: ClassSettingsPreview;
    // Invite specific
    onInviteClick?: () => void;
}

const MODAL_CONFIG = {
    invite: {
        title: "Mời học sinh",
        icon: Users,
        gradient: "from-blue-500 to-indigo-600",
        description: "Thêm học sinh mới vào lớp học của bạn",
    },
    attendance: {
        title: "Điểm danh",
        icon: CalendarCheck,
        gradient: "from-green-500 to-emerald-600",
        description: "Theo dõi và quản lý điểm danh học sinh",
    },
    grades: {
        title: "Sổ điểm",
        icon: FileSpreadsheet,
        gradient: "from-purple-500 to-violet-600",
        description: "Quản lý và theo dõi điểm số học sinh",
    },
    settings: {
        title: "Cài đặt lớp học",
        icon: Settings,
        gradient: "from-gray-600 to-slate-700",
        description: "Tùy chỉnh thông tin và cài đặt lớp học",
    }
};

export default function QuickActionModal({
    isOpen,
    onClose,
    type,
    classId,
    className,
    attendanceData,
    gradesData,
    settingsData,
    onInviteClick
}: QuickActionModalProps) {
    const config = MODAL_CONFIG[type];
    const { navigateTo } = useNavigation();

    const getActionUrl = () => {
        switch (type) {
            case 'attendance': return `/dashboard/classes/${classId}/attendance`;
            case 'grades': return `/dashboard/classes/${classId}/grades`;
            case 'settings': return `/dashboard/classes/${classId}/settings`;
            default: return '#';
        }
    };

    const handleNavigate = () => {
        onClose();
        navigateTo(getActionUrl());
    };

    const renderPreviewContent = () => {
        switch (type) {
            case 'invite':
                return (
                    <div className="space-y-4">
                        {/* Quick invite options */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => {
                                    onClose();
                                    onInviteClick?.();
                                }}
                                className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-100 transition-all group"
                            >
                                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <p className="text-sm font-medium text-gray-900">Mời qua email</p>
                                <p className="text-xs text-gray-500 mt-0.5">Gửi lời mời trực tiếp</p>
                            </button>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center mb-2">
                                    <Shield className="w-5 h-5 text-white" />
                                </div>
                                <p className="text-sm font-medium text-gray-900">Mã lớp học</p>
                                <p className="text-xs text-gray-500 mt-0.5 font-mono">{settingsData?.code || 'ABC123'}</p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100/50">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <UserCheck className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{settingsData?.studentCount || 0}</p>
                                    <p className="text-sm text-gray-500">Học sinh hiện tại</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'attendance':
                return (
                    <div className="space-y-4">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                <div className="flex items-center justify-between mb-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-xs text-green-600 font-medium">Tỷ lệ có mặt</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {attendanceData?.presentRate || 95}%
                                </p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="flex items-center justify-between mb-2">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                    <span className="text-xs text-blue-600 font-medium">Buổi học</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {attendanceData?.totalSessions || 12}
                                </p>
                            </div>
                        </div>

                        {/* Recent Session */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100/50">
                            <p className="text-xs text-gray-500 mb-2">Buổi học gần nhất</p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    <span className="text-sm font-medium">
                                        {attendanceData?.recentSession?.date || 'Hôm nay'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="text-green-600">✓ {attendanceData?.recentSession?.present || 28}</span>
                                    <span className="text-red-600">✗ {attendanceData?.recentSession?.absent || 2}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'grades':
                return (
                    <div className="space-y-4">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-center">
                                <p className="text-xl font-bold text-gray-900">{gradesData?.totalAssignments || 8}</p>
                                <p className="text-xs text-gray-500">Bài tập</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-xl border border-green-100 text-center">
                                <p className="text-xl font-bold text-gray-900">{gradesData?.gradedCount || 6}</p>
                                <p className="text-xs text-gray-500">Đã chấm</p>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 text-center">
                                <p className="text-xl font-bold text-gray-900">{gradesData?.pendingCount || 2}</p>
                                <p className="text-xs text-gray-500">Chờ chấm</p>
                            </div>
                        </div>

                        {/* Average Score */}
                        <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100/50">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <TrendingUp className="w-7 h-7 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Điểm trung bình lớp</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {gradesData?.averageScore?.toFixed(1) || '8.2'}<span className="text-lg text-gray-400">/10</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'settings':
                return (
                    <div className="space-y-4">
                        {/* Class Info Preview */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                    {settingsData?.name?.charAt(0) || 'L'}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{settingsData?.name || className}</p>
                                    <p className="text-sm text-gray-500">{settingsData?.subject || 'Môn học'}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Mã lớp</span>
                                <span className="font-mono font-semibold text-indigo-600">{settingsData?.code || 'ABC123'}</span>
                            </div>
                        </div>

                        {/* Quick Settings */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-2">
                                <Palette className="w-4 h-4 text-blue-600" />
                                <span className="text-xs text-gray-600">Giao diện</span>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 flex items-center gap-2">
                                <Bell className="w-4 h-4 text-orange-600" />
                                <span className="text-xs text-gray-600">Thông báo</span>
                            </div>
                        </div>

                        {/* Danger Zone Preview */}
                        <div className="bg-red-50/50 rounded-xl p-3 border border-red-100/50">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <span className="text-xs text-red-600">Vùng nguy hiểm: Xóa lớp, lưu trữ...</span>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <DraggableModal isOpen={isOpen} onClose={onClose} className="max-w-md">
            {(dragControls) => (
                <>
                    <ModalHeader
                        title={config.title}
                        onClose={onClose}
                        dragControls={dragControls}
                        gradientFrom={config.gradient.includes('blue') ? 'blue' :
                            config.gradient.includes('green') ? 'green' :
                                config.gradient.includes('purple') ? 'purple' : 'gray'}
                    />

                    <div className="p-6">
                        <p className="text-gray-500 mb-6">{config.description}</p>

                        {/* Preview Content */}
                        {renderPreviewContent()}

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Đóng
                            </button>
                            {type !== 'invite' && (
                                <button
                                    onClick={handleNavigate}
                                    className={`px-5 py-2.5 bg-gradient-to-r ${config.gradient} text-white font-medium rounded-xl hover:opacity-90 transition-all shadow-lg flex items-center gap-2`}
                                >
                                    Xem chi tiết
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </DraggableModal>
    );
}
