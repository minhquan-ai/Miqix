"use client";

import { Sparkles, ArrowRight, Loader2, AlertCircle, Plus, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface JoinClassWidgetProps {
    onJoin: (code: string) => Promise<void>;
}

export function JoinClassWidget({ onJoin }: JoinClassWidgetProps) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;

        setLoading(true);
        setError("");

        try {
            await onJoin(code);
            setCode("");
            setIsExpanded(false);
        } catch (err: any) {
            setError(err.message || "Không thể tham gia lớp học");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            {/* Trigger Button */}
            <motion.button
                onClick={() => setIsExpanded(!isExpanded)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2.5 px-5 py-3.5 rounded-2xl font-bold transition-all shadow-sm ${isExpanded
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30'
                    }`}
            >
                {isExpanded ? (
                    <>
                        <X className="w-4 h-4" />
                        <span>Đóng</span>
                    </>
                ) : (
                    <>
                        <Plus className="w-4 h-4" />
                        <span>Tham gia lớp</span>
                    </>
                )}
            </motion.button>

            {/* Expanded Input Form */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 400 }}
                        className="absolute right-0 top-full mt-2 z-50 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-purple-100 rounded-xl">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-gray-900">Tham gia lớp học</h4>
                                <p className="text-xs text-gray-500">Nhập mã lớp từ giáo viên</p>
                            </div>
                        </div>

                        <form onSubmit={handleJoin} className="space-y-3">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value.toUpperCase());
                                    setError("");
                                }}
                                placeholder="VD: MATH10A1"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-center font-mono font-bold tracking-wider placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all uppercase text-sm"
                                maxLength={10}
                                autoFocus
                            />

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center justify-center gap-1.5 text-xs text-red-600 font-medium bg-red-50 py-2 px-3 rounded-lg"
                                >
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {error}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={!code || loading}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-2.5 rounded-xl shadow-md shadow-purple-500/15 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        Tham gia
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

