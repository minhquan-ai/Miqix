"use server";

import { db } from "@/lib/db";
import { getCurrentUserAction } from "@/lib/actions";
import { revalidatePath } from "next/cache";

export async function getTodosAction() {
    const user = await getCurrentUserAction();
    if (!user) return [];

    try {
        const todos = await db.todo.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        });

        // Convert dates to strings for serialization if needed, 
        // but for server components passing to client, simple Date objects usually need serialization.
        return todos.map(t => ({
            ...t,
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
        }));
    } catch (error) {
        console.error("Error fetching todos:", error);
        return [];
    }
}

export async function createTodoAction(content: string) {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, message: "Unauthorized" };

    try {
        const todo = await db.todo.create({
            data: {
                userId: user.id,
                content,
                priority: 'medium'
            }
        });
        revalidatePath('/dashboard');
        return { success: true, todo: { ...todo, createdAt: todo.createdAt.toISOString(), updatedAt: todo.updatedAt.toISOString() } };
    } catch {
        return { success: false, message: "Failed to create todo" };
    }
}

export async function toggleTodoAction(id: string) {
    const user = await getCurrentUserAction();
    if (!user) return { success: false };

    try {
        const existing = await db.todo.findUnique({ where: { id } });
        if (!existing || existing.userId !== user.id) return { success: false };

        await db.todo.update({
            where: { id },
            data: { completed: !existing.completed }
        });
        revalidatePath('/dashboard');
        return { success: true };
    } catch {
        return { success: false };
    }
}

export async function deleteTodoAction(id: string) {
    const user = await getCurrentUserAction();
    if (!user) return { success: false };

    try {
        await db.todo.deleteMany({
            where: { id, userId: user.id }
        });
        revalidatePath('/dashboard');
        return { success: true };
    } catch {
        return { success: false };
    }
}
