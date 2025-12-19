"use client";

import { Copy, Check, Share2, QrCode } from "lucide-react";
import { useState } from "react";

interface ClassCodeCardProps {
    code: string;
    className: string;
    onCopy?: () => void;
}

export default function ClassCodeCard({ code, className, onCopy }: ClassCodeCardProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            onCopy?.();
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <QrCode className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-lg">Mã lớp học</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                        Chia sẻ mã này với học sinh để họ tham gia lớp <span className="font-medium">{className}</span>
                    </p>

                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="bg-white dark:bg-gray-900 border-2 border-blue-300 dark:border-blue-700 rounded-lg px-6 py-3 font-mono text-3xl font-bold text-blue-600 dark:text-blue-400 tracking-wider shadow-inner">
                            {code}
                        </div>

                        <button
                            onClick={handleCopy}
                            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all shadow-sm ${copied
                                    ? 'bg-green-600 text-white'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            title="Copy mã lớp"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-5 h-5" />
                                    <span>Đã copy!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-5 h-5" />
                                    <span className="hidden sm:inline">Copy mã</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                    💡 <span>Mẹo: Học sinh có thể tham gia bằng cách nhập mã này tại trang Lớp học → Tham gia lớp</span>
                </p>
            </div>
        </div>
    );
}
