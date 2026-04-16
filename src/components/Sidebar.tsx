"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth-actions";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Bell,
    User,
    Settings,
    HelpCircle,
    LogOut,
    GraduationCap,
    Menu,
    X,
    Sparkles,
    Calendar,
    ChevronDown,
    ChevronRight,
    FileEdit,
    Clock,
} from "lucide-react";
import { User as AppUser, Class } from "@/types";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useNavigation } from "@/components/NavigationProvider";

const menuListVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const menuItemVariants: Variants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
};

interface SidebarProps {
    user: AppUser | null;
    classes: Class[];
    isLoading: boolean;
    counts?: {
        pendingAssignments: number;
        unreadNotifications: number;
        unreadMessages: number;
        draftAssignments: number;
    };
    isCollapsed?: boolean;
    onToggle?: () => void;
}

type SidebarItemType = {
    id: string;
    label: string;
    icon: any;
    href?: string;
    badge?: number;
    badgeColor?: string;
    role?: 'teacher' | 'student' | 'all';
};

export default function Sidebar({ user, classes, isLoading, counts, isCollapsed: isCollapsedProp, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const { navigateTo } = useNavigation();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showQuickClasses, setShowQuickClasses] = useState(true);
    const [isCollapsedInternal, setIsCollapsedInternal] = useState(false);

    const isCollapsed = isCollapsedProp !== undefined ? isCollapsedProp : isCollapsedInternal;
    const showExpanded = !isCollapsed;

    const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        e.stopPropagation();
        setIsMobileOpen(false);
        navigateTo(href);
    }, [navigateTo]);

    useEffect(() => {
        if (isCollapsedProp === undefined) {
            const savedState = localStorage.getItem('sidebar-collapsed');
            if (savedState !== null) {
                setIsCollapsedInternal(savedState === 'true');
            }
        }
    }, [isCollapsedProp]);

    useEffect(() => {
        if (isCollapsed) {
            setShowProfileMenu(false);
        }
    }, [isCollapsed]);

    const toggleCollapse = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (onToggle) {
            onToggle();
        } else {
            const newState = !isCollapsedInternal;
            setIsCollapsedInternal(newState);
            localStorage.setItem('sidebar-collapsed', String(newState));
        }
    };

    const handleSidebarClick = () => {
        if (isCollapsed) {
            toggleCollapse();
        }
    };

    const safeCounts = counts || {
        pendingAssignments: 0,
        unreadNotifications: 0,
        unreadMessages: 0,
        draftAssignments: 0
    };

    const isActive = (href?: string) => {
        if (!href || !pathname) return false;
        if (href === '/dashboard' && pathname === '/dashboard') return true;
        if (href !== '/dashboard' && pathname.startsWith(href)) return true;
        return false;
    };

    const menuItems: SidebarItemType[] = [
        {
            id: 'dashboard',
            label: 'MiQiX AI',
            icon: Sparkles,
            href: '/dashboard',
            role: 'all'
        },
        {
            id: 'schedule',
            label: 'Lịch biểu',
            icon: Calendar,
            href: '/dashboard/schedule',
            role: 'all'
        },
        {
            id: 'classes',
            label: 'Lớp học',
            icon: Users,
            badge: classes.length,
            badgeColor: 'blue',
            role: 'all',
            href: '/dashboard/classes'
        },
        {
            id: 'assignments',
            label: 'Bài tập',
            icon: BookOpen,
            badge: safeCounts.pendingAssignments,
            badgeColor: 'orange',
            role: 'all',
            href: '/dashboard/assignments',
        },
    ];

    // Get recent classes (max 3)
    const recentClasses = classes.slice(0, 3);

    const renderMenuItem = (item: SidebarItemType) => {
        if (item.role !== 'all' && user?.role !== item.role) return null;

        const active = isActive(item.href);

        // Collapsed view
        if (!showExpanded) {
            return (
                <motion.div key={item.id} variants={menuItemVariants} className="mb-1">
                    <Link
                        href={item.href!}
                        onClick={() => setIsMobileOpen(false)}
                        className="block"
                    >
                        <div className={`relative flex items-center justify-center p-3 rounded-xl transition-all duration-200 group
                            ${active
                                ? 'bg-primary/10 text-primary shadow-sm'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            }
                        `}>
                            {/* Active indicator */}
                            {active && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                            )}
                            <item.icon className={`w-5 h-5 ${active ? 'text-primary' : ''}`} />
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white dark:ring-zinc-900" />
                            )}
                            {/* Tooltip */}
                            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all duration-200 shadow-lg">
                                {item.label}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-zinc-900 rotate-45" />
                            </div>
                        </div>
                    </Link>
                </motion.div>
            );
        }

        // Expanded view
        return (
            <motion.div key={item.id} variants={menuItemVariants} className="mb-1">
                <Link
                    href={item.href!}
                    onClick={() => setIsMobileOpen(false)}
                    className="block"
                >
                    <div className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium group
                        ${active
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }
                    `}>
                        {/* Active indicator line */}
                        {active && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                        )}
                        <div className="flex items-center gap-3 pl-1">
                            <item.icon className={`w-5 h-5 transition-colors ${active ? 'text-primary' : 'group-hover:text-foreground'}`} />
                            <span className="whitespace-nowrap">{item.label}</span>
                        </div>
                        {item.badge !== undefined && item.badge > 0 && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
                                ${item.badgeColor === 'orange' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : ''}
                                ${item.badgeColor === 'blue' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                                ${item.badgeColor === 'red' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : ''}
                                ${!item.badgeColor ? 'bg-gray-100 text-gray-600' : ''}
                            `}>
                                {item.badge}
                            </span>
                        )}
                    </div>
                </Link>
            </motion.div>
        );
    };

    if (isLoading) {
        return (
            <div className="w-20 h-screen bg-card border-r border-border p-4 hidden md:flex flex-col items-center gap-4">
                <div className="h-10 w-10 bg-muted rounded-xl animate-pulse mt-2" />
                <div className="flex-1 space-y-4 mt-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-10 w-10 bg-muted rounded-xl animate-pulse" />
                    ))}
                </div>
                <div className="h-10 w-10 bg-muted rounded-full animate-pulse mb-2" />
            </div>
        );
    }

    return (
        <>
            {/* Mobile Toggle */}
            <button
                className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-white dark:bg-zinc-900 border border-border rounded-xl shadow-lg"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Sidebar Container */}
            <aside
                onClick={handleSidebarClick}
                className={`
                    fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-out
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
                    ${!showExpanded ? 'w-20' : 'w-64'}
                    md:translate-x-0 md:static md:z-0 h-screen
                    bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl
                    border-r border-border/50
                    ${isCollapsed ? 'cursor-pointer hover:bg-white/90 dark:hover:bg-zinc-900/90' : ''}
                `}
            >
                {/* Header - Glass effect */}
                <div className="relative p-4 border-b border-border/50 flex items-center gap-3 shrink-0 bg-gradient-to-b from-primary/5 to-transparent">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25">
                        <GraduationCap className="w-5 h-5" />
                    </div>
                    {showExpanded && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="font-bold text-xl tracking-tight"
                        >
                            MiQiX
                        </motion.span>
                    )}
                </div>

                {/* Main Content - Scrollable */}
                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 min-h-0 custom-scrollbar">
                    {/* Main Menu */}
                    <motion.div
                        className="space-y-1"
                        variants={menuListVariants}
                        initial="hidden"
                        animate="show"
                        key={showExpanded ? 'expanded' : 'collapsed'}
                    >
                        {menuItems.map(renderMenuItem)}
                    </motion.div>

                    {/* Quick Classes Section - Only in expanded mode */}
                    {showExpanded && recentClasses.length > 0 && (
                        <div className="pt-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowQuickClasses(!showQuickClasses); }}
                                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                            >
                                <span>Lớp gần đây</span>
                                {showQuickClasses ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                            <AnimatePresence>
                                {showQuickClasses && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="space-y-1 mt-1">
                                            {recentClasses.map((cls: any) => (
                                                <Link
                                                    key={cls.classId || cls.id}
                                                    href={`/dashboard/classes/${cls.classId || cls.id}`}
                                                    onClick={() => setIsMobileOpen(false)}
                                                >
                                                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors group">
                                                        <div
                                                            className="w-2 h-2 rounded-full shrink-0"
                                                            style={{ backgroundColor: cls.color || '#6366f1' }}
                                                        />
                                                        <span className="truncate group-hover:text-foreground transition-colors">
                                                            {cls.name || cls.className}
                                                        </span>
                                                    </div>
                                                </Link>
                                            ))}
                                            <Link
                                                href="/dashboard/classes"
                                                onClick={() => setIsMobileOpen(false)}
                                            >
                                                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-primary hover:bg-primary/5 transition-colors font-medium">
                                                    <span>Xem tất cả lớp học →</span>
                                                </div>
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Stats Widget - Teacher only, expanded mode */}
                    {showExpanded && user?.role === 'teacher' && (safeCounts.pendingAssignments > 0 || safeCounts.draftAssignments > 0) && (
                        <div className="mx-1 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-800/30">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Cần chú ý</span>
                            </div>
                            <div className="space-y-1.5 text-xs">
                                {safeCounts.pendingAssignments > 0 && (
                                    <Link
                                        href="/dashboard/assignments?filter=needs-grading"
                                        onClick={() => setIsMobileOpen(false)}
                                    >
                                        <div className="flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors py-1">
                                            <span>Bài cần chấm</span>
                                            <span className="font-bold text-amber-600 dark:text-amber-400">{safeCounts.pendingAssignments}</span>
                                        </div>
                                    </Link>
                                )}
                                {safeCounts.draftAssignments > 0 && (
                                    <Link
                                        href="/dashboard/assignments?filter=drafts"
                                        onClick={() => setIsMobileOpen(false)}
                                    >
                                        <div className="flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors py-1">
                                            <span>Bản nháp</span>
                                            <span className="font-bold text-orange-600 dark:text-orange-400">{safeCounts.draftAssignments}</span>
                                        </div>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer - Glass effect */}
                <div className="p-3 border-t border-border/50 bg-gradient-to-t from-muted/30 to-transparent shrink-0 relative">
                    {/* Profile Popover */}
                    <AnimatePresence>
                        {showProfileMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowProfileMenu(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute bottom-full left-3 right-3 mb-2 bg-white dark:bg-zinc-900 border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
                                >
                                    <div className="p-2 space-y-0.5">
                                        <Link href="/dashboard/profile" onClick={() => { setIsMobileOpen(false); setShowProfileMenu(false); }}>
                                            <div className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium hover:bg-muted rounded-lg transition-colors">
                                                <User className="w-4 h-4 text-primary" />
                                                <span>Hồ sơ của tôi</span>
                                            </div>
                                        </Link>
                                        <Link href="/dashboard/settings" onClick={() => { setIsMobileOpen(false); setShowProfileMenu(false); }}>
                                            <div className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium hover:bg-muted rounded-lg transition-colors">
                                                <Settings className="w-4 h-4 text-muted-foreground" />
                                                <span>Cài đặt</span>
                                            </div>
                                        </Link>
                                        <div className="h-px bg-border my-1.5" />
                                        <button
                                            onClick={async () => { await logout(); }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Đăng xuất</span>
                                        </button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* User Profile Trigger */}
                    {user && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                showExpanded && setShowProfileMenu(!showProfileMenu);
                            }}
                            className={`flex items-center ${!showExpanded ? 'justify-center' : 'gap-3'} p-2.5 rounded-xl transition-all cursor-pointer group
                                ${showProfileMenu
                                    ? 'bg-muted shadow-sm'
                                    : 'hover:bg-muted/50'
                                }
                            `}
                        >
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0 border-2 border-border group-hover:border-primary/50 transition-colors">
                                    <img
                                        src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* Online indicator */}
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900" />

                                {!showExpanded && (
                                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all shadow-lg">
                                        {user.name}
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-zinc-900 rotate-45" />
                                    </div>
                                )}
                            </div>
                            {showExpanded && (
                                <>
                                    <div className="overflow-hidden flex-1 min-w-0">
                                        <div className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{user.name}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                            {user.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                                            <span className="text-green-500">•</span>
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showProfileMenu ? 'rotate-90' : ''}`} />
                                </>
                            )}
                        </div>
                    )}
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
        </>
    );
}
