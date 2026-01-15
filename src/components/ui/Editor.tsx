"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    List, ListOrdered, Quote, Code, Heading1, Heading2,
    Undo, Redo, Link as LinkIcon, Sparkles
} from 'lucide-react';
import { useState } from 'react';

interface EditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    onAIRequest?: (text: string, command: 'rewrite' | 'grammar' | 'shorter' | 'longer') => Promise<string | null>;
}

const Editor = ({ value, onChange, placeholder = "Nhập nội dung...", disabled = false, onAIRequest }: EditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Placeholder.configure({
                placeholder,
            }),
            Link.configure({
                openOnClick: false,
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editable: !disabled,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none max-w-none min-h-[200px] p-4',
            },
        },
    });

    const [aiLoading, setAiLoading] = useState(false);

    const handleAICommand = async (command: 'rewrite' | 'grammar' | 'shorter' | 'longer') => {
        if (!editor || !onAIRequest) return;

        const { from, to, empty } = editor.state.selection;
        if (empty) return;

        const text = editor.state.doc.textBetween(from, to, ' ');
        setAiLoading(true);

        try {
            const result = await onAIRequest(text, command);
            if (result) {
                editor.chain().focus().setTextSelection({ from, to }).run(); // Restore selection just in case
                editor.commands.insertContent(result);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setAiLoading(false);
        }
    };

    if (!editor) {
        return null;
    }

    const ToolbarButton = ({ onClick, isActive, icon: Icon, title, disabled: btnDisabled, className = "" }: any) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || btnDisabled}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${isActive
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                } ${disabled || btnDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-95'} ${className}`}
            title={title}
        >
            <Icon className="w-4 h-4" />
        </button>
    );

    const ToolbarDivider = () => (
        <div className="w-px h-5 bg-border/70 mx-1.5" />
    );

    return (
        <div className={`rounded-xl overflow-hidden bg-background h-full flex flex-col ${disabled ? 'opacity-80' : ''}`}>

            {/* Modern Toolbar */}
            <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border/50 bg-gradient-to-r from-gray-50/50 to-white dark:from-zinc-800/30 dark:to-zinc-900/30 overflow-x-auto scrollbar-thin">

                {/* AI Actions - Enhanced */}
                {onAIRequest && (
                    <>
                        {aiLoading ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-purple-600 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg border border-purple-200 dark:border-purple-700">
                                <div className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                                Đang xử lý...
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-1 border border-purple-100 dark:border-purple-800/50">
                                <button
                                    type="button"
                                    onClick={() => handleAICommand('rewrite')}
                                    disabled={disabled || editor.state.selection.empty}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-purple-700 dark:text-purple-300 hover:bg-white dark:hover:bg-purple-800/50 rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
                                    title="AI: Viết lại đoạn đã chọn"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Viết lại</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAICommand('grammar')}
                                    disabled={disabled || editor.state.selection.empty}
                                    className="px-2.5 py-1.5 text-purple-700 dark:text-purple-300 hover:bg-white dark:hover:bg-purple-800/50 rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
                                    title="AI: Sửa lỗi ngữ pháp"
                                >
                                    Sửa lỗi
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAICommand('shorter')}
                                    disabled={disabled || editor.state.selection.empty}
                                    className="px-2.5 py-1.5 text-purple-700 dark:text-purple-300 hover:bg-white dark:hover:bg-purple-800/50 rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
                                    title="AI: Rút gọn văn bản"
                                >
                                    Ngắn gọn
                                </button>
                            </div>
                        )}
                        <ToolbarDivider />
                    </>
                )}

                {/* Text Formatting Group */}
                <div className="flex items-center gap-0.5 p-0.5 bg-muted/30 rounded-lg">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive('bold')}
                        icon={Bold}
                        title="In đậm (⌘B)"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive('italic')}
                        icon={Italic}
                        title="In nghiêng (⌘I)"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        isActive={editor.isActive('underline')}
                        icon={UnderlineIcon}
                        title="Gạch chân (⌘U)"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        isActive={editor.isActive('strike')}
                        icon={Strikethrough}
                        title="Gạch ngang"
                    />
                </div>

                <ToolbarDivider />

                {/* Headings Group */}
                <div className="flex items-center gap-0.5 p-0.5 bg-muted/30 rounded-lg">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        isActive={editor.isActive('heading', { level: 1 })}
                        icon={Heading1}
                        title="Tiêu đề 1"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        isActive={editor.isActive('heading', { level: 2 })}
                        icon={Heading2}
                        title="Tiêu đề 2"
                    />
                </div>

                <ToolbarDivider />

                {/* Lists & Blocks Group */}
                <div className="flex items-center gap-0.5 p-0.5 bg-muted/30 rounded-lg">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        isActive={editor.isActive('bulletList')}
                        icon={List}
                        title="Danh sách"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        isActive={editor.isActive('orderedList')}
                        icon={ListOrdered}
                        title="Danh sách số"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        isActive={editor.isActive('blockquote')}
                        icon={Quote}
                        title="Trích dẫn"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        isActive={editor.isActive('codeBlock')}
                        icon={Code}
                        title="Code"
                    />
                </div>

                <ToolbarDivider />

                {/* History Group */}
                <div className="flex items-center gap-0.5 p-0.5 bg-muted/30 rounded-lg">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().undo().run()}
                        isActive={false}
                        icon={Undo}
                        title="Hoàn tác (⌘Z)"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().redo().run()}
                        isActive={false}
                        icon={Redo}
                        title="Làm lại (⌘⇧Z)"
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className={`cursor-text flex-1 ${disabled ? 'cursor-not-allowed' : ''}`} onClick={() => editor.chain().focus().run()}>
                <EditorContent editor={editor} />
            </div>

            <style jsx global>{`
                .ProseMirror p.is-editor-empty:first-child::before {
                    color: #adb5bd;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
};

export default Editor;
