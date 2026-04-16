import { useState, useCallback, useRef } from 'react';

interface UseAIChatOptions {
    initialContext?: string;
    apiEndpoint?: string; // Default to /api/chat
    onSuccess?: (response: any) => void;
    systemPrompt?: string; // Optional fixed system role
    fetcher?: (message: string, context: string, history: ChatMessage[]) => Promise<any>;
}

export interface ChatMessage {
    id?: string;
    role: 'user' | 'assistant' | 'system' | 'ai'; // Added 'ai' for compatibility
    content: string;
    timestamp?: number;
    reasoning?: string;
    hasCanvasContent?: boolean;
    [key: string]: any;
}

export function useAIChat(options: UseAIChatOptions = {}) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const apiEndpoint = options.apiEndpoint || '/api/chat';

    const sendMessage = useCallback(async (content: string, contextOverride?: string) => {
        if (!content.trim()) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: Date.now()
        };

        // Optimistic update
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);
        setError(null);

        try {
            let data;
            const context = contextOverride || options.initialContext || "";

            if (options.fetcher) {
                data = await options.fetcher(content, context, messages);
            } else {
                // Build payload
                const payload = {
                    message: content,
                    context: context,
                    previousMessages: messages.slice(-10), // Keep history manageable
                    // If systemPrompt is provided, it might be handled by the specialized specific API route or added to messages here
                };

                const response = await fetch(apiEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || "Failed to fetch response");
                }
            }

            const { reply, message, text, ...rest } = data;
            const assistantMsg: ChatMessage = {
                id: (Date.now() + 1).toString(), // Ensure ID exists
                role: 'assistant',
                content: reply || message || text || "...", // Fallback structure
                timestamp: Date.now(),
                ...rest
            };

            setMessages(prev => {
                // Remove the temporary stream message if it exists (assuming it was pushed with the same ID or we just replace the last message if it was streaming)
                const isStreamed = rest._streamed;
                if (isStreamed) {
                    // Update the last message to the final structured message instead of appending duplicate
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1] = assistantMsg;
                    return newMsgs;
                }
                return [...prev, assistantMsg];
            });

            if (options.onSuccess) {
                options.onSuccess(data);
            }

            return assistantMsg;

        } catch (err: any) {
            console.error("AI Chat Error:", err);
            setError(err.message || "Something went wrong");
            // Add error message to chat
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Xin lỗi, đã có lỗi xảy ra. Bạn vui lòng thử lại sau.",
                timestamp: Date.now()
            }]);
        } finally {
            setLoading(false);
        }
    }, [apiEndpoint, options.initialContext, messages, options, options.fetcher]);

    return {
        messages,
        input,
        setInput,
        loading,
        setLoading, // Export this
        error,
        sendMessage,
        setMessages
    };
}

