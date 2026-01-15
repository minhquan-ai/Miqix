export const AI_CONFIG = {
    provider: 'openrouter',
    apiKey: process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY, // Fallback for backward compat
    models: {
        FAST: "xiaomi/mimo-v2-flash:free",      // For quick chat, UI responses
        SMART: "meta-llama/llama-3.3-70b-instruct:free", // For complex logic, math
        REASONING: "deepseek/deepseek-r1-distill-llama-70b:free", // For heavy reasoning
    },
    defaultParams: {
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 1,
    }
};

export const AI_ROLES = {
    TEACHER: "Giáo viên hỗ trợ giảng dạy",
    STUDENT: "Trợ lý học tập",
    SOCRATIC: "Gia sư Socratic (Gợi mở)"
};
