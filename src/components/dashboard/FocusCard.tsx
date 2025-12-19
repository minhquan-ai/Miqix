"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, AlertCircle, BookOpen, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export type FocusType = 'assignment' | 'class' | 'event';

export interface FocusItem {
    id: string;
    type: FocusType;
    title: string;
    subtitle?: string; // e.g. "Lớp 12A1 - Toán"
    deadline: Date;
    href: string;
    priority: 'high' | 'medium' | 'normal';
    aiInsight?: string; // The "Invisible AI" micro-insight
}

interface FocusCardProps {
    item?: FocusItem; // Can be undefined (empty state)
}

export default function FocusCard({ item }: FocusCardProps) {
    if (!item) {
        return (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-gray-400">
                    <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900">Không có việc gì gấp!</h3>
                <p className="text-sm text-gray-500">Bạn đã hoàn thành hết nhiệm vụ quan trọng.</p>
            </div>
        );
    }

    const isUrgent = item.priority === 'high';
    const relativeTime = formatDistanceToNow(item.deadline, { addSuffix: true, locale: vi });

    return (
        <div className="group relative">
            {/* Glow Effect for High Priority */}
            {isUrgent && (
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
            )}

            <div className="relative bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300">
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                        ${item.type === 'assignment' ? 'bg-indigo-50 text-indigo-700' :
                            item.type === 'class' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'}
                    `}>
                        {item.type === 'assignment' && <BookOpen className="w-3 h-3" />}
                        {item.type === 'class' && <Clock className="w-3 h-3" />}
                        <span>{item.type === 'assignment' ? 'Bài tập' : item.type === 'class' ? 'Tiết học' : 'Sự kiện'}</span>
                    </div>

                    <div className={`flex items-center gap-1.5 text-xs font-bold ${isUrgent ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{relativeTime}</span>
                    </div>
                </div>

                {/* Main Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-1 leading-snug group-hover:text-indigo-600 transition-colors">
                    {item.title}
                </h3>
                <p className="text-sm text-gray-500 font-medium mb-4">{item.subtitle}</p>

                {/* Invisible AI Micro-Insight */}
                {item.aiInsight && (
                    <div className="mb-5 flex items-start gap-3 p-3 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100/50 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1 opacity-20">
                            <BrainCircuit className="w-12 h-12 text-indigo-500" />
                        </div>
                        <div className="mt-0.5 min-w-[20px] text-indigo-500">
                            <BrainCircuit className="w-4 h-4" />
                        </div>
                        <p className="text-xs text-indigo-800 italic relative z-10">
                            "{item.aiInsight}"
                        </p>
                    </div>
                )}

                {/* Action Button */}
                <Link href={item.href} className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-all group-hover:scale-[1.02] active:scale-[0.98]">
                    <span>{item.type === 'assignment' ? 'Làm bài ngay' : 'Vào lớp'}</span>
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}

// Fallback icon import if needed
import { CheckCircle } from 'lucide-react';
