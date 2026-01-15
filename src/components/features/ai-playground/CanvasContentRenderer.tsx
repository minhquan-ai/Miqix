"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { ChevronRight, BookOpen, Lightbulb, Calculator, CheckCircle, Target, FileText } from "lucide-react";

interface ContentSection {
    type: 'heading' | 'step' | 'formula' | 'note' | 'content' | 'answer';
    title?: string;
    content: string;
    stepNumber?: number;
}

interface CanvasContentRendererProps {
    content: string;
    className?: string;
}

// Parse content into structured sections
function parseContentIntoSections(content: string): ContentSection[] {
    const sections: ContentSection[] = [];
    const lines = content.split('\n');

    let currentSection: ContentSection | null = null;
    let buffer: string[] = [];

    const flushBuffer = () => {
        if (currentSection && buffer.length > 0) {
            currentSection.content = buffer.join('\n').trim();
            if (currentSection.content) {
                sections.push(currentSection);
            }
        }
        buffer = [];
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Detect main headings (I., II., III., etc. or #, ##)
        const romanMatch = trimmedLine.match(/^([IVX]+)\.\s+(.+)/i);
        const hashMatch = trimmedLine.match(/^#{1,2}\s+(.+)/);

        // Detect steps (Bước 1:, Bước 2:, Step 1:, etc.)
        const stepMatch = trimmedLine.match(/^(?:Bước|Step)\s*(\d+)[:\.]?\s*(.*)/i);

        // Detect formulas/equations (lines with $$ or significant math)
        const isFormula = trimmedLine.includes('$$') ||
            (trimmedLine.includes('$') && (trimmedLine.includes('=') || trimmedLine.includes('\\frac')));

        // Detect notes/tips (Lưu ý, Ghi chú, Tip, Note)
        const noteMatch = trimmedLine.match(/^(?:Lưu ý|Ghi chú|Tip|Note|Chú ý)[:\s]*(.*)/i);

        // Detect answer sections
        const answerMatch = trimmedLine.match(/^(?:Đáp án|Kết luận|Answer|Conclusion|Kết quả)[:\s]*(.*)/i);

        if (romanMatch || hashMatch) {
            flushBuffer();
            currentSection = {
                type: 'heading',
                title: romanMatch ? romanMatch[2] : hashMatch![1],
                content: '',
            };
            buffer = [];
        } else if (stepMatch) {
            flushBuffer();
            currentSection = {
                type: 'step',
                title: stepMatch[2] || `Bước ${stepMatch[1]}`,
                stepNumber: parseInt(stepMatch[1]),
                content: '',
            };
            buffer = [];
        } else if (noteMatch) {
            flushBuffer();
            currentSection = {
                type: 'note',
                title: 'Lưu ý',
                content: noteMatch[1] || '',
            };
            if (noteMatch[1]) {
                buffer = [noteMatch[1]];
            }
        } else if (answerMatch) {
            flushBuffer();
            currentSection = {
                type: 'answer',
                title: 'Đáp án',
                content: answerMatch[1] || '',
            };
            if (answerMatch[1]) {
                buffer = [answerMatch[1]];
            }
        } else {
            // Regular content
            if (!currentSection) {
                currentSection = {
                    type: 'content',
                    content: '',
                };
            }
            buffer.push(line);
        }
    }

    // Flush remaining buffer
    flushBuffer();

    // If no sections found, return the whole content as one section
    if (sections.length === 0) {
        return [{
            type: 'content',
            content: content,
        }];
    }

    return sections;
}

// Section Card Component
function SectionCard({ section }: { section: ContentSection }) {
    const getIcon = () => {
        switch (section.type) {
            case 'heading':
                return <BookOpen className="w-5 h-5" />;
            case 'step':
                return <Target className="w-5 h-5" />;
            case 'formula':
                return <Calculator className="w-5 h-5" />;
            case 'note':
                return <Lightbulb className="w-5 h-5" />;
            case 'answer':
                return <CheckCircle className="w-5 h-5" />;
            default:
                return <FileText className="w-5 h-5" />;
        }
    };

    const getStyles = () => {
        switch (section.type) {
            case 'heading':
                return {
                    card: 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100',
                    icon: 'bg-indigo-100 text-indigo-600',
                    title: 'text-indigo-900',
                    bar: 'bg-indigo-500',
                };
            case 'step':
                return {
                    card: 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-md',
                    icon: 'bg-blue-100 text-blue-600',
                    title: 'text-gray-900',
                    bar: 'bg-blue-500',
                };
            case 'note':
                return {
                    card: 'bg-amber-50 border-amber-200',
                    icon: 'bg-amber-100 text-amber-600',
                    title: 'text-amber-900',
                    bar: 'bg-amber-500',
                };
            case 'answer':
                return {
                    card: 'bg-emerald-50 border-emerald-200',
                    icon: 'bg-emerald-100 text-emerald-600',
                    title: 'text-emerald-900',
                    bar: 'bg-emerald-500',
                };
            default:
                return {
                    card: 'bg-white border-gray-100',
                    icon: 'bg-gray-100 text-gray-600',
                    title: 'text-gray-900',
                    bar: 'bg-gray-400',
                };
        }
    };

    const styles = getStyles();

    return (
        <div className={cn(
            "rounded-2xl border p-6 transition-all duration-300",
            styles.card
        )}>
            {/* Header */}
            {(section.title || section.stepNumber) && (
                <div className="flex items-center gap-3 mb-4">
                    <div className={cn("w-2 h-8 rounded-full shrink-0", styles.bar)} />
                    <div className={cn("p-2 rounded-xl shrink-0", styles.icon)}>
                        {getIcon()}
                    </div>
                    <h3 className={cn("text-lg font-bold leading-tight", styles.title)}>
                        {section.stepNumber ? `Bước ${section.stepNumber}: ` : ''}
                        {section.title}
                    </h3>
                </div>
            )}

            {/* Content */}
            <div className={cn(
                "prose prose-sm max-w-none",
                "prose-headings:font-bold prose-headings:text-gray-800",
                "prose-p:text-gray-600 prose-p:leading-relaxed",
                "prose-li:text-gray-600",
                "prose-strong:text-gray-800",
                "[&_.katex]:text-gray-800 [&_.katex]:text-base",
                section.title && "pl-5 border-l-2 border-gray-100"
            )}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                >
                    {section.content}
                </ReactMarkdown>
            </div>
        </div>
    );
}

export function CanvasContentRenderer({ content, className }: CanvasContentRendererProps) {
    const sections = useMemo(() => parseContentIntoSections(content), [content]);

    // If content is simple (1 section with type 'content'), render normally
    if (sections.length === 1 && sections[0].type === 'content') {
        return (
            <div className={cn(
                "prose prose-lg max-w-none dark:prose-invert p-6 bg-white rounded-2xl border border-gray-100 shadow-sm",
                "[&_.katex]:text-base",
                className
            )}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                >
                    {content}
                </ReactMarkdown>
            </div>
        );
    }

    // Render structured sections
    return (
        <div className={cn("space-y-4", className)}>
            {sections.map((section, idx) => (
                <SectionCard key={idx} section={section} />
            ))}
        </div>
    );
}
