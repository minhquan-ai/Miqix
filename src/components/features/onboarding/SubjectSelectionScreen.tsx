"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Calculator, BookOpen, Languages, Atom, FlaskConical, Dna,
    Hourglass, Globe2, Scale, Terminal, GraduationCap, Check, ArrowRight
} from 'lucide-react';
import { SubjectId, SUBJECTS_DATA, useSubject } from '@/contexts/SubjectContext';
import { useRouter } from 'next/navigation';

const SUBJECT_ICONS: Record<SubjectId, React.ReactNode> = {
    MATH: <Calculator className="w-8 h-8" />,
    LITERATURE: <BookOpen className="w-8 h-8" />,
    ENGLISH: <Languages className="w-8 h-8" />,
    PHYSICS: <Atom className="w-8 h-8" />,
    CHEMISTRY: <FlaskConical className="w-8 h-8" />,
    BIOLOGY: <Dna className="w-8 h-8" />,
    HISTORY: <Hourglass className="w-8 h-8" />,
    GEOGRAPHY: <Globe2 className="w-8 h-8" />,
    CIVIC_EDU: <Scale className="w-8 h-8" />,
    COMPUTER: <Terminal className="w-8 h-8" />,
    OTHER: <GraduationCap className="w-8 h-8" />
};

const COLOR_MAP: Record<string, { border: string, bg: string, iconBg: string, iconText: string }> = {
    blue: { border: 'border-blue-500', bg: 'bg-blue-50', iconBg: 'bg-blue-200', iconText: 'text-blue-700' },
    pink: { border: 'border-pink-500', bg: 'bg-pink-50', iconBg: 'bg-pink-200', iconText: 'text-pink-700' },
    indigo: { border: 'border-indigo-500', bg: 'bg-indigo-50', iconBg: 'bg-indigo-200', iconText: 'text-indigo-700' },
    cyan: { border: 'border-cyan-500', bg: 'bg-cyan-50', iconBg: 'bg-cyan-200', iconText: 'text-cyan-700' },
    teal: { border: 'border-teal-500', bg: 'bg-teal-50', iconBg: 'bg-teal-200', iconText: 'text-teal-700' },
    emerald: { border: 'border-emerald-500', bg: 'bg-emerald-50', iconBg: 'bg-emerald-200', iconText: 'text-emerald-700' },
    amber: { border: 'border-amber-500', bg: 'bg-amber-50', iconBg: 'bg-amber-200', iconText: 'text-amber-700' },
    green: { border: 'border-green-500', bg: 'bg-green-50', iconBg: 'bg-green-200', iconText: 'text-green-700' },
    orange: { border: 'border-orange-500', bg: 'bg-orange-50', iconBg: 'bg-orange-200', iconText: 'text-orange-700' },
    slate: { border: 'border-slate-500', bg: 'bg-slate-50', iconBg: 'bg-slate-200', iconText: 'text-slate-700' },
    gray: { border: 'border-gray-500', bg: 'bg-gray-50', iconBg: 'bg-gray-200', iconText: 'text-gray-700' },
};

export default function SubjectSelectionScreen({ onComplete }: { onComplete?: () => void }) {
    const { setTeachingSubjects } = useSubject();
    const [selected, setSelected] = useState<SubjectId[]>([]);
    const router = useRouter();

    const toggleSubject = (id: SubjectId) => {
        if (selected.includes(id)) {
            setSelected(selected.filter(s => s !== id));
        } else {
            setSelected([...selected, id]);
        }
    };

    const handleContinue = () => {
        if (selected.length === 0) return;

        setTeachingSubjects(selected);
        if (onComplete) {
            onComplete();
        } else {
            // Default behavior: Go to dashboard
            router.push('/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl w-full"
            >
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">
                        Chào mừng thầy/cô đến với Miqix! 👋
                    </h1>
                    <p className="text-xl text-slate-600">
                        Để hỗ trợ tốt nhất, thầy/cô đang giảng dạy những bộ môn nào?
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-10">
                    {(Object.values(SUBJECTS_DATA) as any[]).map((subject) => {
                        const isSelected = selected.includes(subject.id);
                        const colors = COLOR_MAP[subject.color] || COLOR_MAP.gray;
                        return (
                            <motion.button
                                key={subject.id}
                                onClick={() => toggleSubject(subject.id as SubjectId)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`
                                    relative p-6 rounded-2xl flex flex-col items-center justify-center gap-4 border-2 transition-all h-40
                                    ${isSelected
                                        ? `${colors.border} ${colors.bg} shadow-lg`
                                        : 'border-white bg-white hover:border-slate-200 hover:shadow-md'
                                    }
                                `}
                            >
                                <div className={`
                                    p-3 rounded-xl transition-colors
                                    ${isSelected ? `${colors.iconBg} ${colors.iconText}` : 'bg-slate-100 text-slate-500'}
                                `}>
                                    {SUBJECT_ICONS[subject.id as SubjectId]}
                                </div>
                                <span className={`font-semibold ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                                    {subject.name}
                                </span>

                                {isSelected && (
                                    <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                <div className="flex justify-center">
                    <motion.button
                        onClick={handleContinue}
                        disabled={selected.length === 0}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                            px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 transition-all
                            ${selected.length > 0
                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-200'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }
                        `}
                    >
                        Bắt đầu trải nghiệm
                        <ArrowRight className="w-5 h-5" />
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}
