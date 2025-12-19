"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, Info, AlertTriangle, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const toaster = (
        <div className="fixed bottom-6 right-6 z-[999999] flex flex-col gap-2.5 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, x: 20 }}
                        transition={{ type: "spring", damping: 20, stiffness: 350 }}
                        layout
                        className={`
                            pointer-events-auto relative flex items-center gap-3 px-4 py-3 min-w-[280px] max-w-sm
                            rounded-xl border shadow-[0_15px_30px_-5px_rgba(0,0,0,0.2)] 
                            backdrop-blur-xl transition-all
                            ${toast.type === 'success' ? 'bg-white/95 border-emerald-500/20 text-emerald-900' : ''}
                            ${toast.type === 'error' ? 'bg-red-50/95 border-red-500/30 text-red-900 shadow-red-500/10' : ''}
                            ${toast.type === 'info' ? 'bg-white/95 border-sky-500/20 text-sky-900' : ''}
                            ${toast.type === 'warning' ? 'bg-amber-50/95 border-amber-500/30 text-amber-900' : ''}
                        `}
                    >
                        {/* Status Icon - Smaller */}
                        <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                            ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : ''}
                            ${toast.type === 'error' ? 'bg-red-100 text-red-600' : ''}
                            ${toast.type === 'info' ? 'bg-sky-100 text-sky-600' : ''}
                            ${toast.type === 'warning' ? 'bg-amber-100 text-amber-600' : ''}
                        `}>
                            {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
                            {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
                            {toast.type === 'info' && <Info className="w-5 h-5" />}
                            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                        </div>

                        <div className="flex-1 min-w-0 pr-2">
                            <p className="text-xs font-bold leading-tight">{toast.message}</p>
                        </div>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 hover:bg-black/5 rounded-md transition-colors"
                        >
                            <X className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                        </button>

                        {/* Animated background bar - Thinner */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 overflow-hidden rounded-l-xl">
                            <div className={`w-full h-full ${toast.type === 'success' ? 'bg-emerald-500' :
                                    toast.type === 'error' ? 'bg-red-500' :
                                        toast.type === 'info' ? 'bg-sky-500' : 'bg-amber-500'
                                }`} />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {mounted && createPortal(toaster, document.body)}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
