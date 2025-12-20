"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface MarkdownTextProps {
    content: string;
    className?: string;
}

/**
 * A lightweight component to render basic Markdown-like elements
 * that AI often outputs (bold, bullet points, horizontal lines, emojis).
 */
export function MarkdownText({ content, className }: MarkdownTextProps) {
    if (!content) return null;

    // Split by lines and process each line
    const lines = content.split('\n');

    return (
        <div className={cn("flex flex-col gap-y-1.5", className)}>
            {lines.map((line, idx) => {
                if (!line.trim() && line.length === 0) return <div key={idx} className="h-2" />;
                let renderedLine: React.ReactNode = line;

                // 1. Handle Horizontal Dividers (---)
                if (line.trim() === '---' || line.trim() === '***') {
                    return <hr key={idx} className="my-4 border-gray-100 dark:border-gray-800" />;
                }

                // 2. Handle Bullet Points (- or •)
                const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('• ');
                const content = isBullet ? line.trim().substring(2) : line;

                // 3. Handle Bold (**text**)
                if (content.includes('**')) {
                    const parts = content.split(/(\*\*.*?\*\*)/g);
                    renderedLine = parts.map((part, pIdx) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={pIdx} className="font-bold text-gray-900 dark:text-gray-100">{part.slice(2, -2)}</strong>;
                        }
                        return part;
                    });
                } else {
                    renderedLine = content;
                }

                return (
                    <div key={idx} className={cn(
                        "min-h-[1.25rem]",
                        isBullet && "pl-5 relative flex items-start"
                    )}>
                        {isBullet && <span className="absolute left-1 text-indigo-400 font-bold">•</span>}
                        <span>{renderedLine}</span>
                    </div>
                );
            })}
        </div>
    );
}
