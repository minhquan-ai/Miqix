"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import { Search, Sparkles, Bell, AlertTriangle, Calendar, Pin, Users, FileText, BookOpen } from 'lucide-react';
import AnnouncementCard from '@/components/AnnouncementCard';
import AnnouncementComposer from '@/components/AnnouncementComposer';
import { BaseModal } from '@/components/ui/BaseModal';
import { getAnnouncementStyle } from '@/utils/announcementStyle';
import { FilterState, SortOption } from '@/components/StreamFilterSidebar';
import { User, Assignment, Submission, Announcement } from '@/types';

interface StreamTabContentProps {
    classId: string;
    classData: any;
    currentUser: User | null;
    myRole: string | null;
    announcements: Announcement[];
    assignments: Assignment[];
    submissions: Submission[];
    students: any[];
    filters: FilterState;
    setFilters: (filters: FilterState) => void;
    sortBy: SortOption;
    setSortBy: (sort: SortOption) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onPostAnnouncement: () => Promise<void>;
}

export default function StreamTabContent({
    classId,
    classData,
    currentUser,
    myRole,
    announcements,
    assignments,
    submissions,
    students,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    onPostAnnouncement
}: StreamTabContentProps) {
    const [displayCount, setDisplayCount] = useState(5);
    const [localAnnouncements, setLocalAnnouncements] = useState(announcements);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    // For portal mounting
    useEffect(() => {
        setMounted(true);
    }, []);

    // Lock body scroll when popup is open
    useEffect(() => {
        if (selectedId) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [selectedId]);

    // Sync state if props change (re-fetch)
    React.useEffect(() => {
        setLocalAnnouncements(announcements);
    }, [announcements]);

    if (!currentUser) return null;

    const isTeacher = currentUser.role === 'teacher';

    // Học sinh: return null - Stream is teacher-only, Students use different Overview
    if (!isTeacher) {
        return null;
    }

    const handleTogglePin = (id: string, newStatus: boolean) => {
        setLocalAnnouncements(prev => prev.map(a =>
            a.id === id ? { ...a, isPinned: newStatus } : a
        ));
    };

    const handleDelete = (id: string) => {
        setLocalAnnouncements(prev => prev.filter(a => a.id !== id));
    };

    // Filter logic - updated to handle NORMAL type
    const filteredAnnouncements = localAnnouncements
        .filter(a => {
            if (filters.showPinnedOnly && !a.isPinned) return false;

            if (filters.type !== 'ALL') {
                const announcementType = (a.type || 'NORMAL').toUpperCase();
                if (filters.type !== announcementType) return false;
            }

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return a.content.toLowerCase().includes(query) ||
                    a.teacherName.toLowerCase().includes(query) ||
                    (a.title && a.title.toLowerCase().includes(query));
            }
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return 0;
        });

    const displayedList = filteredAnnouncements.slice(0, displayCount);
    const hasMore = displayCount < filteredAnnouncements.length;

    // Teacher stats
    const pendingGrading = submissions.filter(s => s.status === 'submitted').length;
    const draftAssignments = assignments.filter(a => a.status === 'draft').length;

    const upcomingAssignments = assignments
        .filter(a => a.status === 'open' && new Date(a.dueDate) > new Date())
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 4);

    const pinnedAnnouncements = localAnnouncements.filter(a => a.isPinned);

    // Filter type options for teacher
    const filterTypes = [
        { value: 'ALL', label: 'Tất cả', icon: null, activeColor: 'bg-blue-100 text-blue-700 ring-1 ring-blue-300' },
        { value: 'NORMAL', label: 'Thông thường', icon: Sparkles, activeColor: 'bg-blue-100 text-blue-700 ring-1 ring-blue-300' },
        { value: 'IMPORTANT', label: 'Quan trọng', icon: Bell, activeColor: 'bg-orange-100 text-orange-700 ring-1 ring-orange-300' },
        { value: 'URGENT', label: 'Khẩn cấp', icon: AlertTriangle, activeColor: 'bg-red-100 text-red-700 ring-1 ring-red-300' },
        { value: 'EVENT', label: 'Sự kiện', icon: Calendar, activeColor: 'bg-purple-100 text-purple-700 ring-1 ring-purple-300' },
    ];

    return (
        <div className="flex gap-6">
            {/* Main Content - 2 column layout */}
            <div className="flex-1 min-w-0 space-y-4">
                {/* Announcement Composer */}
                <AnnouncementComposer
                    classId={classId}
                    teacherId={currentUser.id}
                    teacherAvatar={currentUser.avatarUrl}
                    teacherName={currentUser.name}
                    onPost={onPostAnnouncement}
                />

                {/* Compact Filter Bar */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 px-4 py-2.5 flex items-center gap-3 flex-wrap">
                    {/* Search - Compact */}
                    <div className="relative flex-1 min-w-[160px] max-w-[240px]">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-gray-50/80 border-0 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all"
                        />
                    </div>

                    {/* Divider */}
                    <div className="h-5 w-px bg-gray-200" />

                    {/* Filter Pills - Compact */}
                    <div className="flex items-center gap-1">
                        {filterTypes.map((ft) => {
                            const Icon = ft.icon;
                            const isActive = filters.type === ft.value;
                            return (
                                <button
                                    key={ft.value}
                                    onClick={() => setFilters({ ...filters, type: ft.value as any })}
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${isActive
                                        ? ft.activeColor
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    {Icon && <Icon className="w-3 h-3" />}
                                    <span className="hidden sm:inline">{ft.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Divider */}
                    <div className="h-5 w-px bg-gray-200 hidden sm:block" />

                    {/* Pinned Toggle - Compact */}
                    <button
                        onClick={() => setFilters({ ...filters, showPinnedOnly: !filters.showPinnedOnly })}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${filters.showPinnedOnly
                            ? 'bg-amber-100 text-amber-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <Pin className="w-3 h-3" />
                        <span className="hidden sm:inline">Ghim</span>
                    </button>

                    {/* Sort - Minimal */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-2 py-1 bg-transparent border-0 rounded-md text-xs font-medium text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 cursor-pointer hover:bg-gray-100 transition-all"
                    >
                        <option value="newest">Mới nhất</option>
                        <option value="reactions">Nhiều ❤️</option>
                        <option value="comments">Sôi nổi</option>
                    </select>
                </div>

                {/* Announcements List */}
                <div className="space-y-4">
                    {displayedList.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-4xl">📢</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có thông báo nào</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                Hãy bắt đầu cuộc trò chuyện bằng cách tạo thông báo đầu tiên cho lớp học.
                            </p>
                        </div>
                    ) : (
                        <>
                            {displayedList.map((announcement) => (
                                <motion.div
                                    key={announcement.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    layout
                                    onClick={() => setSelectedId(announcement.id)}
                                    className="cursor-pointer"
                                >
                                    <AnnouncementCard
                                        announcement={announcement}
                                        currentUserId={currentUser.id}
                                        isTeacher={isTeacher}
                                        onTogglePin={handleTogglePin}
                                        onDelete={handleDelete}
                                    />
                                </motion.div>
                            ))}

                            {hasMore && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDisplayCount(prev => prev + 5); }}
                                    className="w-full py-3 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                                >
                                    Xem thêm thông báo cũ hơn
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Standardized Modal - Uses BaseModal for consistent design */}
                {selectedId && (() => {
                    const selectedAnnouncement = localAnnouncements.find(a => a.id === selectedId);
                    const style = getAnnouncementStyle(selectedAnnouncement?.type || 'NORMAL');

                    return (
                        <BaseModal
                            isOpen={!!selectedId && mounted}
                            onClose={() => setSelectedId(null)}
                            title="Chi tiết thông báo"
                            size="lg"
                            className={`p-0 overflow-hidden border-2 ${style.border}`}
                            accentColor={style.accentColor}
                        >
                            <div className="p-1">
                                <AnnouncementCard
                                    announcement={selectedAnnouncement!}
                                    currentUserId={currentUser.id}
                                    isTeacher={isTeacher}
                                    onTogglePin={handleTogglePin}
                                    onDelete={handleDelete}
                                    isOverlay={true}
                                    isDetail={true}
                                    onClose={() => setSelectedId(null)}
                                />
                            </div>
                        </BaseModal>
                    );
                })()}
            </div>

            {/* Right Sidebar - Teacher Widgets */}
            <div className="w-[320px] flex-shrink-0">
                <div className="sticky top-24 space-y-6">

                    {/* Stream Stats Widget */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-50 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                📊 Thống kê bảng tin
                            </h3>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-blue-50 rounded-xl text-center">
                                    <div className="text-2xl font-bold text-blue-600">{announcements.length}</div>
                                    <div className="text-xs text-blue-600/80 font-medium">Thông báo</div>
                                </div>
                                <div className="p-3 bg-yellow-50 rounded-xl text-center">
                                    <div className="text-2xl font-bold text-yellow-600">{pinnedAnnouncements.length}</div>
                                    <div className="text-xs text-yellow-600/80 font-medium">Đã ghim</div>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-xl text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {announcements.filter(a => a.type === 'important' || a.type === 'urgent').length}
                                    </div>
                                    <div className="text-xs text-purple-600/80 font-medium">Quan trọng</div>
                                </div>
                                <div className="p-3 bg-green-50 rounded-xl text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {announcements.filter(a => a.type === 'event').length}
                                    </div>
                                    <div className="text-xs text-green-600/80 font-medium">Sự kiện</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Members Widget for Stream */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                👥 Thành viên lớp học
                            </h3>
                            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                {students.length}
                            </span>
                        </div>
                        <div className="p-4">
                            {students.length === 0 ? (
                                <div className="text-center py-4">
                                    <div className="text-2xl mb-2">👋</div>
                                    <p className="text-xs text-gray-500">Chưa có học sinh nào</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {students.slice(0, 10).map((student: any) => (
                                            <div
                                                key={student.id}
                                                className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-medium"
                                                title={student.name}
                                            >
                                                {student.avatarUrl ? (
                                                    <img src={student.avatarUrl} alt={student.name} className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    student.name.charAt(0)
                                                )}
                                            </div>
                                        ))}
                                        {students.length > 10 && (
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600 font-medium">
                                                +{students.length - 10}
                                            </div>
                                        )}
                                    </div>
                                    <Link
                                        href={`/dashboard/classes/${classId}?tab=roster`}
                                        className="block text-center text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Xem tất cả thành viên →
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Pinned Posts Widget */}
                    {pinnedAnnouncements.length > 0 && (
                        <div className="bg-white rounded-2xl border border-yellow-100 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-yellow-50 bg-yellow-50/30">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    📌 Bài đăng đã ghim
                                </h3>
                            </div>
                            <div className="p-2">
                                {pinnedAnnouncements.slice(0, 3).map((post) => (
                                    <div
                                        key={post.id}
                                        className="p-3 rounded-xl hover:bg-yellow-50/50 cursor-pointer transition-colors"
                                    >
                                        <p className="text-sm text-gray-800 font-medium line-clamp-2 mb-1">
                                            {post.title || post.content}
                                        </p>
                                        <p className="text-[10px] text-gray-500">
                                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: vi })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
}

