import { AI_CONFIG } from './config';
import { OpenRouter } from "@openrouter/sdk";

interface AIRequestOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    systemPrompt?: string;
    reasoning?: boolean; // Experimental flag for models that support viewing reasoning
}

interface AIResponse {
    text: string;
    reasoning?: string | null;
    error?: string;
}

export const AICore = {
    /**
     * Generate text/response from AI using OpenRouter SDK
     */
    generateText: async (prompt: string, options: AIRequestOptions = {}): Promise<AIResponse> => {
        try {
            const apiKey = AI_CONFIG.apiKey;
            if (!apiKey) {
                throw new Error("Missing AI API Key (OPENROUTER_API_KEY)");
            }

            const openrouter = new OpenRouter({ apiKey: apiKey });
            
            // Use Gemma by default for all tasks now based on request
            const model = options.model || "nvidia/nemotron-3-super-120b-a12b:free";
            const systemPrompt = options.systemPrompt || "Bạn là trợ lý AI thông minh của MiQiX.";

            const messages: any[] = [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ];

            const sendOptions: any = {
                model: model,
                messages: messages,
                stream: true,
                temperature: options.temperature ?? AI_CONFIG.defaultParams.temperature,
                max_tokens: options.maxTokens ?? AI_CONFIG.defaultParams.max_tokens,
            };

            // Force JSON mode if requested
            if (options.jsonMode) {
                sendOptions.response_format = { type: "json_object" };
            }

            console.log(`[AICore] Calling ${model} via OpenRouter SDK...`);

            // Stream the response to get reasoning tokens in usage
            const stream = (await openrouter.chat.send({
                chatRequest: sendOptions
            })) as any;

            let responseText = "";
            let reasoningTokens = 0;

            for await (const chunk of stream) {
                const content = chunk.choices?.[0]?.delta?.content;
                if (content) {
                    responseText += content;
                }

                // Usage information comes in the final chunk
                if (chunk.usage && chunk.usage.reasoningTokens) {
                    reasoningTokens = chunk.usage.reasoningTokens;
                    console.log("\n[AICore] Reasoning tokens used:", reasoningTokens);
                }
            }

            if (!responseText) {
                throw new Error("No response from AI Provider");
            }

            return {
                text: responseText,
                reasoning: reasoningTokens > 0 ? `Tokens: ${reasoningTokens}` : null
            };

        } catch (error: any) {
            console.error("[AICore] Exception:", error);
            return {
                text: "",
                error: error.message || "Unknown Error"
            };
        }
    },

    /**
     * Generate a ReadableStream for continuous UI streaming
     */
    generateStream: async (prompt: string, options: AIRequestOptions = {}): Promise<ReadableStream> => {
        const apiKey = AI_CONFIG.apiKey;
        if (!apiKey) throw new Error("Missing AI API Key (OPENROUTER_API_KEY)");

        const openrouter = new OpenRouter({ apiKey });
        const model = options.model || "nvidia/nemotron-3-super-120b-a12b:free";
        const systemPrompt = options.systemPrompt || "Bạn là trợ lý AI thông minh của MiQiX. Hãy giao tiếp bằng tiếng Việt.";

        const messages: any[] = [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
        ];

        const sendOptions: any = {
            model: model,
            messages: messages,
            stream: true,
            temperature: options.temperature ?? AI_CONFIG.defaultParams.temperature,
            max_tokens: options.maxTokens ?? AI_CONFIG.defaultParams.max_tokens,
        };

        const stream = (await openrouter.chat.send({
            chatRequest: sendOptions
        })) as any;

        return new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const content = chunk.choices?.[0]?.delta?.content;
                        if (content) {
                            controller.enqueue(new TextEncoder().encode(content));
                        }
                    }
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            }
        });
    },

    /**
     * Helper to generate and parse JSON
     */
    generateJSON: async <T>(prompt: string, systemPrompt: string = "Trả về JSON hợp lệ."): Promise<T | null> => {
        const result = await AICore.generateText(prompt, {
            jsonMode: true,
            systemPrompt: systemPrompt + " \nQUAN TRỌNG: Chỉ trả về chuỗi JSON thuần túy, không markdown.",
            model: "nvidia/nemotron-3-super-120b-a12b:free"
        });

        if (result.error || !result.text) return null;

        try {
            // Remove markdown code blocks if any (fallback cleanup)
            const cleanJson = result.text.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleanJson) as T;
        } catch (e) {
            console.error("[AICore] JSON Parse Error:", e, result.text);
            return null;
        }
    }
};
