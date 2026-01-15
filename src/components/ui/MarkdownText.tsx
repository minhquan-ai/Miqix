"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownTextProps {
    content: string;
    className?: string;
}

export function MarkdownText({ content, className }: MarkdownTextProps) {
    if (!content) return null;

    return (
        <div className={cn("leading-relaxed text-sm whitespace-pre-wrap", className)}>
            <ReactMarkdown
                components={{
                    // Paragraph
                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,

                    // Bold
                    strong: ({ node, ...props }) => <span className="font-bold text-[inherit]" {...props} />,

                    // Italic
                    em: ({ node, ...props }) => <span className="italic opacity-90" {...props} />,

                    // Lists
                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                    li: ({ node, ...props }) => <li className="pl-1" {...props} />,

                    // Headings
                    h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-2 mt-4 text-[inherit]" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-base font-bold mb-2 mt-3 text-[inherit]" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-sm font-bold mb-1 mt-2 text-[inherit]" {...props} />,

                    // Links
                    a: ({ node, ...props }) => <a className="underline decoration-indigo-400 font-medium" target="_blank" rel="noopener noreferrer" {...props} />,

                    // Blockquote
                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-current/20 pl-4 py-1 italic opacity-80 bg-black/5 rounded-r my-2" {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
