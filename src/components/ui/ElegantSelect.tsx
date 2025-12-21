"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface ElegantSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    className?: string;
}

export function ElegantSelect({ value, onChange, options, className = "" }: ElegantSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value) || options[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full gap-2 px-4 py-3.5 bg-white hover:bg-gray-50 rounded-2xl text-sm font-bold text-gray-900 transition-all shadow-sm hover:shadow active:scale-95 group outline-none"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {selectedOption?.icon && <span className="text-sm shrink-0">{selectedOption.icon}</span>}
                    <span className="truncate">{selectedOption?.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-600 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence mode="wait">
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.1, ease: "easeOut" }}
                        className="absolute right-0 mt-2 min-w-[200px] bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] border-2 border-gray-200 p-2 z-[9999]"
                    >
                        <div className="flex flex-col gap-1">
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all w-full text-left
                                        ${value === option.value
                                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                            : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                                        }`}
                                >
                                    {option.icon && <span className="text-base">{option.icon}</span>}
                                    <span className="flex-1">{option.label}</span>
                                    {value === option.value && (
                                        <motion.div
                                            layoutId="active-tick"
                                            className="w-2 h-2 rounded-full bg-white shadow-sm"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
