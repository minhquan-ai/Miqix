"use client";

import { createContext, useContext, useState, useEffect, useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface NavigationContextType {
    isNavigating: boolean;
    startNavigation: () => void;
    endNavigation: () => void;
    navigateTo: (url: string) => void;
}

const NavigationContext = createContext<NavigationContextType>({
    isNavigating: false,
    startNavigation: () => { },
    endNavigation: () => { },
    navigateTo: () => { },
});

export function useNavigation() {
    return useContext(NavigationContext);
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
    const [isNavigating, setIsNavigating] = useState(false);
    const [progress, setProgress] = useState(0);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Reset when pathname changes
    useEffect(() => {
        // eslint-disable-next-line
        setIsNavigating(false);
        // eslint-disable-next-line
        setProgress(0);
    }, [pathname, searchParams]);

    // Sync with transition state
    useEffect(() => {
        if (isPending) {
            setIsNavigating(true);
        } else if (!isPending && isNavigating) {
            // Only reset if we were navigating and transition is done
            // Next.js transition might end before the pathname actually changes in some cases, 
            // but the pathname/searchParams effect will also handle the final reset.
            const timeout = setTimeout(() => {
                setIsNavigating(false);
            }, 100);
            return () => clearTimeout(timeout);
        }
    }, [isPending, isNavigating]);

    // Animate progress bar
    useEffect(() => {
        if (isNavigating) {
            setProgress(0);
            const timer1 = setTimeout(() => setProgress(30), 50);
            const timer2 = setTimeout(() => setProgress(60), 200);
            const timer3 = setTimeout(() => setProgress(80), 400);

            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
                clearTimeout(timer3);
            };
        } else {
            setProgress(100);
            const timer = setTimeout(() => setProgress(0), 300);
            return () => clearTimeout(timer);
        }
    }, [isNavigating]);

    const startNavigation = useCallback(() => {
        setIsNavigating(true);
    }, []);

    const endNavigation = useCallback(() => {
        setIsNavigating(false);
    }, []);

    const navigateTo = useCallback((url: string) => {
        startNavigation();
        startTransition(() => {
            router.push(url);
        });
    }, [router, startNavigation]);

    return (
        <NavigationContext.Provider value={{ isNavigating, startNavigation, endNavigation, navigateTo }}>
            {/* Top Progress Bar */}
            <AnimatePresence>
                {(isNavigating || progress > 0) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
                    >
                        <motion.div
                            className="h-full bg-gradient-to-r from-primary via-purple-500 to-primary rounded-r-full shadow-lg shadow-primary/50"
                            initial={{ width: "0%" }}
                            animate={{ width: `${progress}%` }}
                            transition={{
                                duration: isNavigating ? 0.3 : 0.2,
                                ease: "easeOut"
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Page Overlay for smooth feel */}
            <AnimatePresence>
                {isNavigating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[9998] bg-background/5 pointer-events-none backdrop-blur-[1px]"
                    />
                )}
            </AnimatePresence>

            {children}
        </NavigationContext.Provider>
    );
}

// Custom Link component with smooth navigation
interface SmoothLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
}

export function SmoothLink({ href, children, className, onClick, ...props }: SmoothLinkProps) {
    const { navigateTo } = useNavigation();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        onClick?.(e);
        navigateTo(href);
    };

    return (
        <a href={href} onClick={handleClick} className={className} {...props}>
            {children}
        </a>
    );
}
