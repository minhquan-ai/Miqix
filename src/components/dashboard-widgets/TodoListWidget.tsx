"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Plus, Trash2, Check, Loader2 } from "lucide-react";
import { createTodoAction, deleteTodoAction, getTodosAction, toggleTodoAction } from "@/lib/actions/todo-actions";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface TodoItem {
    id: string;
    content: string;
    completed: boolean;
    createdAt: string;
}

export default function TodoListWidget() {
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [newItem, setNewItem] = useState("");
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        const fetchTodos = async () => {
            try {
                const data = await getTodosAction();
                setTodos(data as TodoItem[]);
            } catch (error) {
                console.error("Failed to fetch todos", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTodos();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;

        const previousTodos = [...todos];
        setAdding(true);
        const content = newItem;
        setNewItem(""); // Clear immediately

        // Optimistic
        const tempId = Math.random().toString();
        const optimisticTodo: TodoItem = {
            id: tempId,
            content: content,
            completed: false,
            createdAt: new Date().toISOString(),
        };
        setTodos([optimisticTodo, ...previousTodos]);

        try {
            const res = await createTodoAction(content);
            if (res.success && res.todo) {
                // Replace temp with real
                setTodos(prev => [res.todo as TodoItem, ...prev.filter(t => t.id !== tempId)]);
            } else {
                setTodos(previousTodos);
            }
        } catch {
            setTodos(previousTodos);
        } finally {
            setAdding(false);
        }
    };

    const handleToggle = async (id: string) => {
        const previousTodos = [...todos];
        setTodos(todos.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
        ));

        try {
            await toggleTodoAction(id);
        } catch {
            setTodos(previousTodos);
        }
    };

    const handleDelete = async (id: string) => {
        const previousTodos = [...todos];
        setTodos(todos.filter(t => t.id !== id));

        try {
            await deleteTodoAction(id);
        } catch {
            setTodos(previousTodos);
        }
    };

    return (
        <div className="bg-card dark:bg-card rounded-2xl p-6 shadow-sm border border-border h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-lg">
                        <CheckSquare className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-foreground">Việc cần làm</h3>
                </div>
                <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-full">
                    {todos.filter(t => !t.completed).length} còn lại
                </span>
            </div>

            {/* Add New Input */}
            <form onSubmit={handleAdd} className="relative mb-4">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Thêm công việc mới..."
                    className="w-full pl-4 pr-10 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-900/30 focus:border-pink-300 dark:focus:border-pink-700 transition-all"
                    disabled={adding}
                />
                <button
                    type="submit"
                    disabled={!newItem.trim() || adding}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-pink-500 hover:bg-pink-600 active:scale-95 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
            </form>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px] pr-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                    </div>
                ) : todos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        <p>Đang rảnh rỗi! 🎉</p>
                        <p className="text-xs mt-1">Thêm công việc để bắt đầu</p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {todos.map(todo => (
                            <motion.div
                                key={todo.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, height: 0 }}
                                className={cn(
                                    "group flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-sm",
                                    todo.completed
                                        ? "bg-muted/50 border-border opacity-60"
                                        : "bg-card border-border hover:border-pink-200 dark:hover:border-pink-800"
                                )}
                            >
                                <button
                                    onClick={() => handleToggle(todo.id)}
                                    className={cn(
                                        "flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                                        todo.completed
                                            ? "bg-pink-500 border-pink-500 text-white"
                                            : "border-muted-foreground/30 hover:border-pink-400 dark:hover:border-pink-600 text-transparent"
                                    )}
                                >
                                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                </button>

                                <span className={cn(
                                    "flex-1 text-sm font-medium transition-all select-none truncate",
                                    todo.completed ? "text-muted-foreground line-through" : "text-foreground"
                                )}>
                                    {todo.content}
                                </span>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(todo.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

