"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

import { DataService } from "@/lib/data";
import { getUserEnrollmentsAction, getCurrentUserAction } from "@/lib/actions";
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

    useEffect(() => {
        async function loadData() {
            try {
                const user = await getCurrentUserAction();

                if (!user) {
                    // User session exists (middleware passed) but DB record is missing/invalid
                    // Force logout to clear the zombie session
                    console.log("No user found in DB, forcing logout...");
                    await logout();
                    return;
                }

                setCurrentUser(user);

                if (user) {
                    const classes = await getUserEnrollmentsAction();
                    setUserClasses(classes);
                }
            } catch (error) {
                console.error("Failed to load classes", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    // Mock counts for now - in real app these would come from server actions
    const counts = {
        pendingAssignments: 5,
        activeMissions: 2,
        unreadNotifications: 3,
        unreadMessages: 1,
        draftAssignments: 2
    };

    return (
        <NavigationProvider>
            <div className="flex min-h-screen bg-background text-foreground font-sans antialiased">
                <Sidebar
                    user={currentUser}
                    classes={userClasses}
                    isLoading={isLoading}
                    counts={counts}
                />
                <main className="flex-1 overflow-y-auto h-screen bg-muted/10 p-8">
                    {children}
                </main>
            </div>
        </NavigationProvider>
    );
}
