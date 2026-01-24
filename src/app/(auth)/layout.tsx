"use client";

import { motion } from "framer-motion";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
            {/* Animated gradient orbs */}
            <motion.div
                className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-200/40 via-purple-200/30 to-pink-200/20 blur-3xl"
                animate={{
                    x: [0, 50, 0],
                    y: [0, 30, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            <motion.div
                className="absolute top-[30%] right-[-15%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-200/40 via-cyan-200/30 to-teal-200/20 blur-3xl"
                animate={{
                    x: [0, -40, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.15, 1],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2,
                }}
            />

            <motion.div
                className="absolute bottom-[-10%] left-[20%] w-[450px] h-[450px] rounded-full bg-gradient-to-br from-violet-200/30 via-fuchsia-200/20 to-rose-200/30 blur-3xl"
                animate={{
                    x: [0, 60, 0],
                    y: [0, -40, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 22,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 4,
                }}
            />

            {/* Decorative geometric shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Top right decorative circle */}
                <motion.div
                    className="absolute top-20 right-20 w-24 h-24 rounded-full border-2 border-indigo-200/50"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                />

                {/* Bottom left decorative square */}
                <motion.div
                    className="absolute bottom-32 left-16 w-16 h-16 rounded-xl border-2 border-purple-200/50"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                />

                {/* Floating dots pattern */}
                <div className="absolute top-1/4 left-1/4 grid grid-cols-4 gap-4 opacity-20">
                    {[...Array(16)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-indigo-400"
                            animate={{
                                opacity: [0.3, 0.8, 0.3],
                                scale: [1, 1.2, 1],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                delay: i * 0.2,
                            }}
                        />
                    ))}
                </div>

                {/* Gradient lines */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-300/30 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-300/30 to-transparent" />

                {/* Side accent lines */}
                <motion.div
                    className="absolute left-8 top-1/3 w-1 h-32 bg-gradient-to-b from-indigo-300/40 to-transparent rounded-full"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity }}
                />
                <motion.div
                    className="absolute right-8 bottom-1/3 w-1 h-32 bg-gradient-to-t from-purple-300/40 to-transparent rounded-full"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 2 }}
                />
            </div>

            {/* Subtle grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `
            linear-gradient(to right, #6366f1 1px, transparent 1px),
            linear-gradient(to bottom, #6366f1 1px, transparent 1px)
          `,
                    backgroundSize: '60px 60px',
                }}
            />

            {/* Main content */}
            <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
                <div className="w-full">
                    {children}
                </div>
            </div>

            {/* Bottom decorative wave */}
            <svg
                className="absolute bottom-0 left-0 w-full h-24 text-indigo-100/50"
                viewBox="0 0 1440 100"
                preserveAspectRatio="none"
            >
                <motion.path
                    d="M0,50 C360,100 1080,0 1440,50 L1440,100 L0,100 Z"
                    fill="currentColor"
                    animate={{
                        d: [
                            "M0,50 C360,100 1080,0 1440,50 L1440,100 L0,100 Z",
                            "M0,50 C360,0 1080,100 1440,50 L1440,100 L0,100 Z",
                            "M0,50 C360,100 1080,0 1440,50 L1440,100 L0,100 Z",
                        ]
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </svg>
        </div>
    );
}
