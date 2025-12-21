"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, MoreVertical, Trash2, UserPlus, Mail, Shield, User as UserIcon, CalendarCheck } from "lucide-react";
import { User } from "@/types";
import { fadeInUp, staggerContainer } from "@/utils/motionConfig";
import Link from "next/link";

interface PeopleTabContentProps {
    students: any[];
    pendingStudents?: any[];
    teacherName: string;
    currentUser: User;
    classId: string;
    onRemoveStudent: (studentId: string) => void;
    onApproveStudent: (enrollmentId: string) => void;
    onRejectStudent: (enrollmentId: string) => void;
    onInvite: () => void;
    onImportCSV: () => void;
}

export default function PeopleTabContent({
    students,
    pendingStudents = [],
    teacherName,
    currentUser,
    classId,
    onRemoveStudent,
    onApproveStudent,
    onRejectStudent,
    onInvite,
    onImportCSV
}: PeopleTabContentProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<'name' | 'joined'>('name');

    const filteredStudents = useMemo(() => {
        let result = [...students];

        // Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.name.toLowerCase().includes(query) ||
                s.email.toLowerCase().includes(query)
            );
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            }
            // Add other sort options if needed
            return 0;
        });

        return result;
    }, [students, searchQuery, sortBy]);

    const isTeacher = currentUser.role === 'teacher';

    return (
        <div className="w-full space-y-8">
            {/* Teacher Section */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-primary border-b border-border pb-2 flex items-center justify-between">
                    <span>Giáo viên</span>
                    <span className="text-sm font-normal text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
                        1 giáo viên
                    </span>
                </h2>

                <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {teacherName.charAt(0)}
                    </div>
                    <div>
                        <div className="font-bold text-lg flex items-center gap-2">
                            {teacherName}
                            {isTeacher && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Bạn</span>}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Quản trị viên lớp học
                        </div>
                    </div>
                    <div className="ml-auto">
                        <a
                            href={`mailto:teacher@ergonix.edu.vn`}
                            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-primary block"
                        >
                            <Mail className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Pending Requests Section (Teacher Only) */}
            {isTeacher && pendingStudents.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-amber-600 border-b border-amber-100 pb-2 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <UserPlus className="w-5 h-5" />
                            Yêu cầu tham gia
                        </span>
                        <span className="text-xs font-normal bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                            {pendingStudents.length} đang chờ
                        </span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence mode="popLayout">
                            {pendingStudents.map((enrollment) => (
                                <motion.div
                                    key={enrollment.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex items-center gap-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100 shadow-sm"
                                >
                                    <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-bold text-xl overflow-hidden">
                                        {enrollment.user.avatarUrl ? (
                                            <img src={enrollment.user.avatarUrl} alt={enrollment.user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            enrollment.user.name.charAt(0)
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-gray-900 truncate">{enrollment.user.name}</div>
                                        <div className="text-xs text-gray-500 truncate">{enrollment.user.email}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onRejectStudent(enrollment.id)}
                                            className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                                        >
                                            Từ chối
                                        </button>
                                        <button
                                            onClick={() => onApproveStudent(enrollment.id)}
                                            className="px-4 py-1.5 text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 rounded-lg transition-shadow shadow-sm shadow-amber-200"
                                        >
                                            Chấp nhận
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Students Section */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-2">
                    <h2 className="text-2xl font-bold text-primary flex items-center gap-3">
                        <span>Học sinh</span>
                        <span className="text-sm font-normal text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
                            {students.length} học sinh
                        </span>
                    </h2>

                    <div className="flex items-center gap-2">
                        {/* Search - Classes Page Vibe */}
                        <div className="relative group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm học sinh..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 placeholder:text-gray-400 transition-all font-medium w-full md:w-64 outline-none shadow-sm"
                            />
                        </div>

                        {/* Invite & Attendance Buttons (Teacher Only) */}
                        {isTeacher && (
                            <div className="flex gap-2">
                                <Link href={`/dashboard/classes/${classId}/attendance`}>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium text-sm">
                                        <CalendarCheck className="w-4 h-4" />
                                        <span className="hidden sm:inline">Điểm danh</span>
                                    </button>
                                </Link>
                                <button
                                    onClick={onImportCSV}
                                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium text-sm"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    <span className="hidden sm:inline">Nhập CSV</span>
                                </button>
                                <button
                                    onClick={onInvite}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm font-medium text-sm"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    <span className="hidden sm:inline">Mời học sinh</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <motion.div
                                    key={student.userId}
                                    variants={fadeInUp}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group flex flex-col items-center p-6 bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all text-center relative"
                                >
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <a
                                            href={`mailto:${student.email}`}
                                            className="p-1.5 hover:bg-muted rounded-full text-muted-foreground hover:text-primary transition-colors block"
                                            title="Gửi email"
                                        >
                                            <Mail className="w-4 h-4" />
                                        </a>

                                        {isTeacher && (
                                            <button
                                                onClick={() => onRemoveStudent(student.userId)}
                                                className="p-1.5 hover:bg-red-50 rounded-full text-muted-foreground hover:text-red-600 transition-colors"
                                                title="Xóa khỏi lớp"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-bold text-2xl shadow-sm overflow-hidden mx-auto">
                                            {student.avatarUrl ? (
                                                <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                                            ) : (
                                                student.name.charAt(0)
                                            )}
                                        </div>
                                    </div>

                                    <div className="w-full">
                                        <div className="font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate px-2">
                                            {student.name}
                                        </div>
                                        {student.userId === currentUser.id && (
                                            <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Bạn</span>
                                        )}
                                        <div className="text-sm text-muted-foreground mt-1 truncate px-2">{student.email}</div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-full text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border"
                            >
                                <UserIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                                <p className="text-muted-foreground font-medium">Không tìm thấy học sinh nào</p>
                                <p className="text-sm text-muted-foreground/70">Thử tìm kiếm với từ khóa khác</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
