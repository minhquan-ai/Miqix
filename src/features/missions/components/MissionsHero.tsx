"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Sparkles } from 'lucide-react';

interface MissionsHeroProps {
    title: string;
    subtitle: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: React.ReactNode;
}

export const MissionsHero: React.FC<MissionsHeroProps> = ({
    title,
    subtitle,
    actionLabel,
    onAction,
    icon = <BookOpen size={24} />
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20 mb-6"
        >
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl" />

            <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            {icon}
                        </div>
                        <span className="text-sm font-medium text-white/80">Hệ thống Nhiệm vụ</span>
                    </div>

                    <h1 className="text-3xl font-bold mb-2">
                        {title}
                    </h1>
                    <p className="text-white/80 text-sm max-w-md">
                        {subtitle}
                    </p>
                </div>

                {actionLabel && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onAction}
                        className="hidden md:flex bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all items-center gap-2"
                    >
                        {actionLabel.includes('AI') ? <Sparkles size={18} /> : <Plus size={18} />}
                        {actionLabel}
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
};
