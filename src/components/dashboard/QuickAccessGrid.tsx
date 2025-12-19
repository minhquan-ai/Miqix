"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

export interface QuickAccessItem {
    id: string;
    label: string;
    icon: LucideIcon;
    href: string;
    badge?: number | string;
    color?: string; // e.g., "blue", "indigo", "purple"
    description?: string;
}

interface QuickAccessGridProps {
    items: QuickAccessItem[];
}

export default function QuickAccessGrid({ items }: QuickAccessGridProps) {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariant = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    const getColorClasses = (color: string = "indigo") => {
        const colors: Record<string, { bg: string, text: string, hover: string }> = {
            indigo: { bg: "bg-indigo-50", text: "text-indigo-600", hover: "hover:border-indigo-200 hover:shadow-indigo-100" },
            blue: { bg: "bg-blue-50", text: "text-blue-600", hover: "hover:border-blue-200 hover:shadow-blue-100" },
            purple: { bg: "bg-purple-50", text: "text-purple-600", hover: "hover:border-purple-200 hover:shadow-purple-100" },
            emerald: { bg: "bg-emerald-50", text: "text-emerald-600", hover: "hover:border-emerald-200 hover:shadow-emerald-100" },
            orange: { bg: "bg-orange-50", text: "text-orange-600", hover: "hover:border-orange-200 hover:shadow-orange-100" },
            pink: { bg: "bg-pink-50", text: "text-pink-600", hover: "hover:border-pink-200 hover:shadow-pink-100" },
        };
        return colors[color] || colors.indigo;
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
            {items.map((item) => {
                const colors = getColorClasses(item.color);

                return (
                    <Link href={item.href} key={item.id} className="block group">
                        <motion.div
                            variants={itemVariant}
                            className={`
                                h-full p-5 rounded-2xl bg-white border border-gray-100 shadow-sm 
                                transition-all duration-200 group-hover:-translate-y-1 
                                ${colors.hover} group-hover:shadow-md
                            `}
                        >
                            <div className="flex flex-col h-full justify-between gap-4">
                                <div className="flex items-start justify-between">
                                    <div className={`p-3 rounded-xl ${colors.bg} ${colors.text} transition-transform group-hover:scale-110 duration-200`}>
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    {item.badge !== undefined && (
                                        <span className="flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full shadow-sm ring-2 ring-white">
                                            {item.badge}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                        {item.label}
                                    </h3>
                                    {item.description && (
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                            {item.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </Link>
                );
            })}
        </motion.div>
    );
}
