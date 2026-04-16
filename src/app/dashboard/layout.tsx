"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";


import { getUserEnrollmentsAction, getCurrentUserAction, getDashboardCountsAction } from "@/lib/actions";
import { logout } from "@/lib/actions/auth-actions";
import { User } from "@/types";
import Sidebar from "@/components/Sidebar";
import BottomNavigation from "@/components/BottomNavigation";
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

    // Prefetch data for common pages in the background
    const prefetchCommonData = async (user: User) => {
        // Don't await - let these run in background
        import("@/lib/actions").then(({ getAssignmentsAction, getUserSubmissionsAction, getSubmissionsForTeacherAction }) => {
            // Prefetch assignments
            getAssignmentsAction(user.role === 'student' ? (user as any).classId : undefined);
            // Prefetch submissions
            if (user.role === 'teacher') {
                getSubmissionsForTeacherAction(user.id);
            } else {
                getUserSubmissionsAction(user.id);
            }
        });
    };

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

                // Prefetch data for common pages in background
                prefetchCommonData(user);
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
                {/* Sidebar - hidden on mobile */}
                <aside className="fixed inset-y-0 left-0 z-[9999] hidden md:block">
                    <Sidebar
                        user={currentUser}
                        classes={userClasses}
                        isLoading={isLoading}
                        counts={counts}
                        isCollapsed={isSidebarCollapsed}
                        onToggle={toggleSidebar}
                    />
                </aside>

                {/* Main content - add bottom padding on mobile for BottomNav */}
                <main
                    className={`flex-1 h-screen bg-white overflow-hidden transition-all duration-300 ease-in-out pb-16 md:pb-0 ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
                        }`}
                >
                    {children}
                </main>

                {/* Bottom Navigation - only on mobile */}
                <BottomNavigation
                    pendingAssignments={counts.pendingAssignments}
                />
            </div>
        </NavigationProvider>
    );
}

