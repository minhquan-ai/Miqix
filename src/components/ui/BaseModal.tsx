"use client";

import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showCloseButton?: boolean;
    className?: string;
    accentColor?: string;
}

const SIZE_CLASSES = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[90vw]'
};

export function BaseModal({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    footer,
    size = 'lg',
    showCloseButton = true,
    className = '',
    accentColor
}: BaseModalProps) {
    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className={`bg-white rounded-2xl shadow-2xl ${SIZE_CLASSES[size]} w-full max-h-[90vh] overflow-hidden flex flex-col relative ${className}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Accent Bar */}
                    {accentColor && (
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 z-10 ${accentColor}`} />
                    )}

                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-gray-900 truncate">
                                {title}
                            </h2>
                            {subtitle && (
                                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                            )}
                        </div>
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="ml-4 p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
                                aria-label="Đóng"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {children}
                    </div>

                    {/* Footer (optional) */}
                    {footer && (
                        <div className="border-t border-gray-100 p-6">
                            {footer}
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
