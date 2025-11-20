"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Settings, User, Users, Target, Home, FileText, Menu, X } from "lucide-react";
import { DataService } from "@/lib/data";


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [currentUser, setCurrentUser] = useState<{ role: 'teacher' | 'student' } | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        async function loadUser() {
            const user = await DataService.getCurrentUser();
            setCurrentUser(user);
        }
        loadUser();
    }, []);

    // Close mobile menu when path changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const SidebarContent = () => (
        <>
            <div className="h-16 flex items-center px-6 border-b border-border">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
                    <GraduationCap className="w-6 h-6" />
                    <span>Ergonix</span>
                </Link>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <NavItem href="/dashboard" icon={<Home className="w-5 h-5" />} label="Tổng quan" />

                {/* Conditional Mission Link based on role */}
                {currentUser && (
                    currentUser.role === 'teacher' ? (
                        <NavItem href="/dashboard/teacher-missions" icon={<Target className="w-5 h-5" />} label="Nhiệm vụ" />
                    ) : (
                        <NavItem href="/dashboard/missions" icon={<Target className="w-5 h-5" />} label="Nhiệm vụ" />
                    )
                )}

                <NavItem href="/dashboard/assignments" icon={<FileText className="w-5 h-5" />} label="Bài tập" />
                <NavItem href="/dashboard/classes" icon={<Users className="w-5 h-5" />} label="Lớp học" />
                <NavItem href="/dashboard/profile" icon={<User className="w-5 h-5" />} label="Hồ sơ" />
                <NavItem href="/dashboard/settings" icon={<Settings className="w-5 h-5" />} label="Cài đặt" />
            </nav>

            <div className="p-4 border-t border-border">
                <Link
                    href="/"
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Đăng xuất
                </Link>
            </div>
        </>
    );

    return (
        <div className="min-h-screen flex bg-muted/20">
            {/* Desktop Sidebar */}
            <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col fixed inset-y-0 left-0 z-20">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                    <aside className="absolute top-0 left-0 bottom-0 w-64 bg-card border-r border-border flex flex-col shadow-xl animate-in slide-in-from-left-full duration-300">
                        <div className="absolute top-4 right-4">
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-muted rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
                <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button
                            className="md:hidden p-2 -ml-2 hover:bg-muted rounded-full"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="font-semibold text-lg">Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            A
                        </div>
                    </div>
                </header>
                <main className="flex-1 p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

function NavItem({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
    const pathname = usePathname();

    // Special handling for exact matches to avoid conflicts
    const isActive = (() => {
        if (href === "/dashboard") {
            return pathname === "/dashboard";
        }
        if (href === "/dashboard/missions") {
            return pathname === "/dashboard/missions";
        }
        if (href === "/dashboard/teacher-missions") {
            return pathname === "/dashboard/teacher-missions";
        }
        // For other routes, use startsWith
        return pathname.startsWith(href);
    })();

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
        >
            {icon}
            {label}
        </Link>
    );
}
