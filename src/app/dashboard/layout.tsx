"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";


import { getUserEnrollmentsAction, getCurrentUserAction, getDashboardCountsAction } from "@/lib/actions";
import { logout } from "@/lib/auth-actions";
import { User } from "@/types";
import Sidebar from "@/components/Sidebar";
import { NavigationProvider } from "@/components/NavigationProvider";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userClasses, setUserClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [counts, setCounts] = useState({
        pendingAssignments: 0,
        unreadNotifications: 0,
        unreadMessages: 0,
        draftAssignments: 0
    });

    useEffect(() => {
        async function loadData() {
            try {
                const [user, classes, dashboardCounts] = await Promise.all([
                    getCurrentUserAction(),
                    getUserEnrollmentsAction(),
                    getDashboardCountsAction()
                ]);

                if (!user) {
                    // User session exists (middleware passed) but DB record is missing/invalid
                    // Force logout to clear the zombie session
                    console.log("No user found in DB, forcing logout...");
                    await logout();
                    return;
                }

                setCurrentUser(user);
                setUserClasses(classes);
                setCounts(dashboardCounts);
            } catch (error) {
                console.error("Failed to load classes", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    // Force light mode for dashboard
    useEffect(() => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }, []);

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Sync sidebar state with localStorage
    useEffect(() => {
        const savedState = localStorage.getItem('sidebar-collapsed');
        if (savedState !== null) {
            setIsSidebarCollapsed(savedState === 'true');
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !isSidebarCollapsed;
        setIsSidebarCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', String(newState));
    };

    return (
        <NavigationProvider>
            <div
                className="flex min-h-screen bg-background text-foreground font-sans antialiased"
                style={{ '--sidebar-width': isSidebarCollapsed ? '80px' : '256px' } as React.CSSProperties}
            >
                <aside className="fixed inset-y-0 left-0 z-[9999]">
                    <Sidebar
                        user={currentUser}
                        classes={userClasses}
                        isLoading={isLoading}
                        counts={counts}
                        isCollapsed={isSidebarCollapsed}
                        onToggle={toggleSidebar}
                    />
                </aside>
                <main
                    className={`flex-1 h-screen bg-white overflow-hidden transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
                        }`}
                >
                    {children}
                </main>
            </div>
        </NavigationProvider>
    );
}
