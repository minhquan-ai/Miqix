"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Plus, Trash2, Check, Square, Loader2 } from "lucide-react";
import { DataService } from "@/lib/data";
import { Todo } from "@/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function TodoListWidget() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [newItem, setNewItem] = useState("");
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        const fetchTodos = async () => {
            try {
                // In a real app, we'd get the user ID from context
                const data = await DataService.getTodos();
                setTodos(data);
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

        // Optimistic update
        const tempId = Math.random().toString();
        const newTodo: Todo = {
            id: tempId,
            userId: "current-user",
            content: newItem,
            completed: false,
            createdAt: new Date().toISOString(),
            priority: 'medium'
        };

        setTodos([newTodo, ...todos]);
        setNewItem("");

        try {
            await DataService.createTodo({ userId: "current-user", content: newTodo.content });
            // In real app, we'd replace the temp item with the real one from response
        } catch (error) {
            setTodos(previousTodos); // Revert on error
            console.error("Failed to add todo");
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
            const todo = todos.find(t => t.id === id);
            if (todo) {
                await DataService.updateTodo(id, { completed: !todo.completed });
            }
        } catch (error) {
            setTodos(previousTodos);
        }
    };

    const handleDelete = async (id: string) => {
        const previousTodos = [...todos];

        setTodos(todos.filter(t => t.id !== id));

        try {
            await DataService.deleteTodo(id);
        } catch (error) {
            setTodos(previousTodos);
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                        <CheckSquare className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-800">Việc cần làm</h3>
                </div>
                <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">
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
                    className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-300 transition-all"
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
            <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px] pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                    </div>
                ) : todos.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
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
                                        ? "bg-gray-50/50 border-gray-100 opacity-60"
                                        : "bg-white border-gray-100 hover:border-pink-200"
                                )}
                            >
                                <button
                                    onClick={() => handleToggle(todo.id)}
                                    className={cn(
                                        "flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                                        todo.completed
                                            ? "bg-pink-500 border-pink-500 text-white"
                                            : "border-gray-300 hover:border-pink-400 text-transparent"
                                    )}
                                >
                                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                </button>

                                <span className={cn(
                                    "flex-1 text-sm font-medium transition-all select-none",
                                    todo.completed ? "text-gray-400 line-through" : "text-gray-700"
                                )}>
                                    {todo.content}
                                </span>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(todo.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
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
