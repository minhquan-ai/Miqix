"use client";

import React, { useRef } from "react";
import { Bold, Italic, List, Link as LinkIcon, Heading1, Heading2, Quote, Code } from "lucide-react";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    minHeight?: string;
}

export function RichTextEditor({
    value,
    onChange,
    placeholder = "Nhập nội dung...",
    disabled = false,
    minHeight = "200px"
}: RichTextEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertFormat = (startTag: string, endTag: string = "") => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);

        const newText = text.substring(0, start) + startTag + selectedText + endTag + text.substring(end);
        onChange(newText);

        // Restore focus and selection
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + startTag.length, end + startTag.length);
        }, 0);
    };

    const toolbarItems = [
        { icon: Bold, label: "In đậm", action: () => insertFormat("**", "**") },
        { icon: Italic, label: "In nghiêng", action: () => insertFormat("*", "*") },
        { icon: Heading1, label: "Tiêu đề lớn", action: () => insertFormat("# ") },
        { icon: Heading2, label: "Tiêu đề nhỏ", action: () => insertFormat("## ") },
        { icon: List, label: "Danh sách", action: () => insertFormat("- ") },
        { icon: Quote, label: "Trích dẫn", action: () => insertFormat("> ") },
        { icon: Code, label: "Mã", action: () => insertFormat("`", "`") },
    ];

    return (
        <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                {toolbarItems.map((item, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={item.action}
                        disabled={disabled}
                        className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title={item.label}
                    >
                        <item.icon className="w-4 h-4" />
                    </button>
                ))}
            </div>

            {/* Editor Area */}
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full p-4 bg-transparent border-none focus:ring-0 resize-y font-mono text-sm"
                style={{ minHeight }}
            />

            {/* Helper Text */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                <span>Hỗ trợ Markdown</span>
                <span>{value.length} ký tự</span>
            </div>
        </div>
    );
}
