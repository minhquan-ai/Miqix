"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth-actions";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Target,
    Trophy,
    Bell,
    MessageSquare,
    User,
    Settings,
    HelpCircle,
    LogOut,
    ChevronDown,
    ChevronRight,
    Plus,
    Menu,
    X,
    ChevronLeft,
    Calendar,
    TrendingUp
} from "lucide-react";
import { User as AppUser, Class } from "@/types";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useNavigation } from "@/components/NavigationProvider";

const menuListVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            delayChildren: 0.1
        }
    }
};

const menuItemTextVariants: Variants = {
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
    badgeColor?: string; // 'red', 'orange', 'blue', 'gray'
    subItems?: SidebarItemType[];
    role?: 'teacher' | 'student' | 'all';
};

export default function Sidebar({ user, classes, isLoading, counts, isCollapsed: isCollapsedProp, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const { navigateTo } = useNavigation();
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        'assignments': true,
    });
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isCollapsedInternal, setIsCollapsedInternal] = useState(false);

    // Determine effective state
    const isCollapsed = isCollapsedProp !== undefined ? isCollapsedProp : isCollapsedInternal;
    const showExpanded = !isCollapsed;

    // Smooth navigation handler
    const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        e.stopPropagation();
        setIsMobileOpen(false);
        navigateTo(href);
    }, [navigateTo]);

    // Internal state management only if prop not provided
    useEffect(() => {
        if (isCollapsedProp === undefined) {
            const savedState = localStorage.getItem('sidebar-collapsed');
            if (savedState !== null) {
                setIsCollapsedInternal(savedState === 'true');
            }
        }
    }, [isCollapsedProp]);

    // Auto-reset state when collapsed
    useEffect(() => {
        if (isCollapsed) {
            setExpandedSections({});
            setShowProfileMenu(false);
        }
    }, [isCollapsed]);

    // Toggle collapse and save to localStorage
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
        if (onToggle) {
            onToggle();
        } else {
            const newState = !isCollapsedInternal;
            setIsCollapsedInternal(newState);
            localStorage.setItem('sidebar-collapsed', String(newState));
        }
    };

    // Use zeros as fallback if counts not provided
    // The parent component should pass real counts from the database
    const safeCounts = counts || {
        pendingAssignments: 0,
        unreadNotifications: 0,
        unreadMessages: 0,
        draftAssignments: 0
    };

    const toggleSection = (id: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
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
            label: 'Miqix AI',
            icon: LayoutDashboard,
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
            // subItems removed as requested
        },
    ];

    const quickActions: SidebarItemType[] = [
        /* 
        // Temporarily hidden for demo
        {
            id: 'notifications',
            label: 'Thông báo',
            icon: Bell,
            href: '/dashboard/notifications',
            badge: safeCounts.unreadNotifications,
            badgeColor: 'red',
            role: 'all'
        },
        {
            id: 'messages',
            label: 'Tin nhắn',
            icon: MessageSquare,
            href: '/dashboard/messages',
            badge: safeCounts.unreadMessages,
            badgeColor: 'blue',
            role: 'all'
        }
        */
    ];

    const personalItems: SidebarItemType[] = [
        {
            id: 'profile',
            label: 'Hồ sơ',
            icon: User,
            href: '/dashboard/profile',
            role: 'all'
        },
        {
            id: 'settings',
            label: 'Cài đặt',
            icon: Settings,
            href: '/dashboard/settings',
            role: 'all'
        }
    ];

    const renderMenuItem = (item: SidebarItemType) => {
        if (item.role !== 'all' && user?.role !== item.role) return null;

        const active = isActive(item.href);
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isExpanded = expandedSections[item.id];

        // Collapsed view - icon only with tooltip
        if (!showExpanded) {
            return (
                <div key={item.id} className="mb-2">
                    {hasSubItems ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isCollapsed) {
                                    setIsCollapsed(false);
                                    localStorage.setItem('sidebar-collapsed', 'false');
                                }
                                toggleSection(item.id);
                            }}
                            className={`w-full flex items-center justify-center px-3 py-2.5 rounded-lg transition-colors relative group
                            ${active || isExpanded ? 'text-foreground bg-muted/50' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'}
                        `}
                            title={item.label}
                        >
                            <item.icon className={`w-5 h-5 ${active ? 'text-primary' : ''}`} />
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                            )}
                            {/* Tooltip */}
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                                {item.label}
                            </div>
                        </button>
                    ) : (
                        <a href={item.href!} onClick={(e) => handleNavClick(e, item.href!)}>
                            <div className={`flex items-center justify-center px-3 py-2.5 rounded-lg transition-colors relative group
                                ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'}
                            `}>
                                <item.icon className={`w-5 h-5 ${active ? 'text-primary' : ''}`} />
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                                )}
                                {/* Tooltip */}
                                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                                    {item.label}
                                </div>
                            </div>
                        </a>
                    )}
                </div>
            );
        }

        // Expanded view - full with labels
        return (
            <div key={item.id} className="mb-3">
                {hasSubItems ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleSection(item.id);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-sm font-medium
                            ${active || isExpanded ? 'text-foreground bg-muted/50' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'}
                        `}
                    >
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <item.icon className={`w-5 h-5 shrink-0 ${active ? 'text-primary' : ''}`} />
                            <motion.span
                                variants={menuItemTextVariants}
                                className="whitespace-nowrap"
                            >
                                {item.label}
                            </motion.span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                                    ${item.badgeColor === 'red' ? 'bg-red-100 text-red-600' : ''}
                                    ${item.badgeColor === 'orange' ? 'bg-orange-100 text-orange-600' : ''}
                                    ${item.badgeColor === 'blue' ? 'bg-blue-100 text-blue-600' : ''}
                                    ${item.badgeColor === 'purple' ? 'bg-purple-100 text-purple-600' : ''}
                                    ${!item.badgeColor ? 'bg-gray-100 text-gray-600' : ''}
                                `}>
                                    {item.badge}
                                </span>
                            )}
                            {isExpanded ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
                        </div>
                    </button>
                ) : (
                    <a href={item.href!} onClick={(e) => handleNavClick(e, item.href!)}>
                        <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-sm font-medium
                            ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'}
                        `}>
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <item.icon className={`w-5 h-5 shrink-0 ${active ? 'text-primary' : ''}`} />
                                <motion.span
                                    variants={menuItemTextVariants}
                                    className="whitespace-nowrap"
                                >
                                    {item.label}
                                </motion.span>
                            </div>
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                                    ${item.badgeColor === 'red' ? 'bg-red-100 text-red-600' : ''}
                                    ${item.badgeColor === 'orange' ? 'bg-orange-100 text-orange-600' : ''}
                                    ${item.badgeColor === 'blue' ? 'bg-blue-100 text-blue-600' : ''}
                                    ${item.badgeColor === 'purple' ? 'bg-purple-100 text-purple-600' : ''}
                                    ${!item.badgeColor ? 'bg-gray-100 text-gray-600' : ''}
                                `}>
                                    {item.badge}
                                </span>
                            )}
                        </div>
                    </a>
                )}

                <AnimatePresence initial={false}>
                    {hasSubItems && isExpanded && showExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-2 ml-4 pl-4 border-l border-border space-y-2">
                                {item.subItems!.map(subItem => {
                                    if (subItem.role !== 'all' && user?.role !== subItem.role) return null;
                                    const subActive = isActive(subItem.href);
                                    return (
                                        <a key={subItem.id} href={subItem.href!} onClick={(e) => handleNavClick(e, subItem.href!)}>
                                            <div className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap
                                                ${subActive ? 'text-primary font-medium bg-primary/5' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}
                                            `}>
                                                <span>{subItem.label}</span>
                                                {subItem.badge !== undefined && subItem.badge > 0 && (
                                                    <span className="text-[10px] bg-muted px-1.5 rounded-full">{subItem.badge}</span>
                                                )}
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="w-64 h-screen bg-card border-r border-border p-4 hidden md:flex flex-col gap-4">
                <div className="h-8 w-32 bg-muted rounded animate-pulse" />
                <div className="space-y-2 mt-8">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-10 w-full bg-muted rounded animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    // ... (keep existing helper functions)

    return (
        <>
            {/* Mobile Toggle */}
            <button
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg shadow-sm"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Sidebar Container */}
            <aside
                onClick={handleSidebarClick}
                className={`
                fixed inset-y-0 left-0 z-40 bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
                ${!showExpanded ? 'w-20 cursor-pointer hover:bg-muted/5' : 'w-64'}
                md:translate-x-0 md:static md:z-0 h-screen
            `}>
                {/* Header - Fixed Top */}
                <div
                    className="relative p-6 border-b border-border flex items-center gap-3 shrink-0"
                >


                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl shadow-sm">
                        E
                    </div>
                    {showExpanded && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: 0.05 }}
                            className="font-bold text-xl tracking-tight whitespace-nowrap"
                        >
                            ERGONIX
                        </motion.span>
                    )}
                </div>

                {/* Scrollable Main Content - Middle Layer */}
                <div
                    className="flex-1 overflow-y-auto py-6 px-3 space-y-8 min-h-0 overflow-x-hidden"
                >
                    {/* Main Menu */}
                    <div>
                        <motion.div
                            className="space-y-1"
                            variants={menuListVariants}
                            initial="hidden"
                            animate="show"
                            key={showExpanded ? 'expanded' : 'collapsed'}
                        >
                            {menuItems.map(renderMenuItem)}
                        </motion.div>

                    </div>

                    {/* Quick Actions */}
                    {quickActions.length > 0 && (
                        <div>
                            <motion.div
                                className="space-y-1"
                                variants={menuListVariants}
                                initial="hidden"
                                animate="show"
                                key={showExpanded ? 'expanded' : 'collapsed'}
                            >
                                {quickActions.map(renderMenuItem)}
                            </motion.div>
                        </div>
                    )}

                </div>

                {/* Footer Section - Fixed Bottom Layer */}
                <div
                    className="p-4 border-t border-border bg-muted/10 shrink-0 relative"
                >
                    {/* Profile Popover */}
                    {showProfileMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowProfileMenu(false)}
                            />
                            <div className="absolute bottom-full left-4 right-4 mb-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
                                <div className="p-2 space-y-1">
                                    <a href="/dashboard/profile" onClick={(e) => { handleNavClick(e, '/dashboard/profile'); setShowProfileMenu(false); }}>
                                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors text-left">
                                            <User className="w-4 h-4 text-primary" />
                                            <span>Hồ sơ của tôi</span>
                                        </button>
                                    </a>
                                    <a href="/dashboard/settings" onClick={(e) => { handleNavClick(e, '/dashboard/settings'); setShowProfileMenu(false); }}>
                                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors text-left">
                                            <Settings className="w-4 h-4 text-muted-foreground" />
                                            <span>Cài đặt</span>
                                        </button>
                                    </a>
                                    <a href="/help" onClick={(e) => { handleNavClick(e, '/help'); setShowProfileMenu(false); }}>
                                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors text-left">
                                            <HelpCircle className="w-4 h-4 text-muted-foreground" />
                                            <span>Trợ giúp</span>
                                        </button>
                                    </a>
                                    <div className="h-px bg-border my-1" />
                                    <button
                                        onClick={async () => {
                                            await logout();
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Đăng xuất</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* User Profile Trigger */}
                    {user && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                showExpanded && setShowProfileMenu(!showProfileMenu);
                            }}
                            className={`flex items-center ${!showExpanded ? 'justify-center' : 'gap-3'} p-3 rounded-xl transition-all cursor-pointer border group select-none
                                ${showProfileMenu ? 'bg-card border-primary/20 shadow-sm' : 'hover:bg-card border-transparent hover:border-border/50 hover:shadow-sm'}
                            `}
                        >
                            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0 border border-border group-hover:border-primary/50 transition-colors relative">
                                <img
                                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                />
                                {!showExpanded && (
                                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                                        {user.name}
                                    </div>
                                )}
                            </div>
                            {showExpanded && (
                                <>
                                    <div className="overflow-hidden flex-1">
                                        <div className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{user.name}</div>
                                        <div className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                                            {user.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block ml-1"></span>
                                        </div>
                                    </div>
                                    {showProfileMenu ? (
                                        <ChevronDown className="w-4 h-4 text-primary" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </aside >

            {/* Mobile Overlay */}
            {
                isMobileOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMobileOpen(false)}
                    />
                )
            }
        </>
    );
}
