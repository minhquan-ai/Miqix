"use client";

import { X } from "lucide-react";
import { DragControls } from "framer-motion";

interface ModalHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    onClose: () => void;
    dragControls?: DragControls;
    onPointerDown?: (e: React.PointerEvent) => void;
    className?: string;
    closeButtonClassName?: string;
    gradientFrom?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray' | 'indigo';
}

const GRADIENT_CLASSES = {
    blue: 'from-blue-600 to-indigo-600',
    green: 'from-green-500 to-emerald-600',
    purple: 'from-purple-500 to-violet-600',
    orange: 'from-orange-500 to-amber-600',
    red: 'from-red-500 to-rose-600',
    gray: 'from-gray-600 to-slate-700',
    indigo: 'from-indigo-500 to-purple-600',
};

export function ModalHeader({
    title,
    subtitle,
    icon,
    onClose,
    dragControls,
    onPointerDown,
    className = "",
    closeButtonClassName = "",
    gradientFrom = 'blue'
}: ModalHeaderProps) {
    const handlePointerDown = (e: React.PointerEvent) => {
        if (onPointerDown) {
            onPointerDown(e);
        } else if (dragControls) {
            dragControls.start(e);
        }
    };

    const gradientClass = GRADIENT_CLASSES[gradientFrom] || GRADIENT_CLASSES.blue;

    return (
        <div
            className={`relative bg-gradient-to-r ${gradientClass} px-6 py-4 text-white overflow-hidden cursor-move select-none flex items-center justify-between shrink-0 ${className}`}
            onPointerDown={handlePointerDown}
        >
            <div className="flex items-center gap-3 overflow-hidden">
                {icon && (
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm shrink-0">
                        {icon}
                    </div>
                )}
                <div className="min-w-0">
                    <h2 className="text-lg font-bold truncate">{title}</h2>
                    {subtitle && <p className="text-sm text-white/80 truncate">{subtitle}</p>}
                </div>
            </div>
            <button
                onClick={onClose}
                className={`p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white cursor-pointer ml-4 shrink-0 ${closeButtonClassName}`}
                onPointerDown={(e) => e.stopPropagation()}
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
}
