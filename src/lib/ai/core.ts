import { AI_CONFIG } from './config';

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
     * Generate text/response from AI
     */
    generateText: async (prompt: string, options: AIRequestOptions = {}): Promise<AIResponse> => {
        try {
            const apiKey = AI_CONFIG.apiKey;
            if (!apiKey) {
                throw new Error("Missing AI API Key (OPENROUTER_API_KEY)");
            }

            const model = options.model || AI_CONFIG.models.FAST;
            const systemPrompt = options.systemPrompt || "Bạn là trợ lý AI thông minh của MiQiX.";

            // Validate model availability (optional step in future)

            const messages = [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ];

            const body: any = {
                model: model,
                messages: messages,
                temperature: options.temperature ?? AI_CONFIG.defaultParams.temperature,
                max_tokens: options.maxTokens ?? AI_CONFIG.defaultParams.max_tokens,
            };

            // Force JSON mode if requested
            if (options.jsonMode) {
                body.response_format = { type: "json_object" };
            }

            // Include reasoning output if requested (provider dependent)
            if (options.reasoning) {
                body.include_reasoning = true;
            }

            console.log(`[AICore] Calling ${model}...`);

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://miqix.edu.vn",
                    "X-Title": "MiQiX Platform"
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("[AICore] API Error:", response.status, response.statusText, errorData);
                const errorMessage = errorData.error?.message || errorData.message || response.statusText;
                throw new Error(`AI Provider Error: ${errorMessage}`);
            }

            const data = await response.json();
            const choice = data.choices?.[0];

            if (!choice) {
                throw new Error("No response from AI Provider");
            }

            return {
                text: choice.message.content || "",
                reasoning: choice.message.reasoning || null // Some providers return this
            };

        } catch (error: any) {
            console.error("[AICore] Exception:", error);
            // Default safe fallback for UI to not crash
            return {
                text: "",
                error: error.message || "Unknown Error"
            };
        }
    },

    /**
     * Helper to generate and parse JSON
     */
    generateJSON: async <T>(prompt: string, systemPrompt: string = "Trả về JSON hợp lệ."): Promise<T | null> => {
        const result = await AICore.generateText(prompt, {
            jsonMode: true,
            systemPrompt: systemPrompt + " \nQUAN TRỌNG: Chỉ trả về chuỗi JSON thuần túy, không markdown.",
            model: AI_CONFIG.models.SMART // Use smarter model for JSON structure
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
