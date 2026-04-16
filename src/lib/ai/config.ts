export const AI_CONFIG = {
    provider: 'openrouter',
    apiKey: process.env.OPENROUTER_API_KEY,
    models: {
        // Primary models - MiMo V2 Flash as requested
        FAST: "xiaomi/mimo-v2-flash:free",      // For quick chat, UI responses
        SMART: "xiaomi/mimo-v2-flash:free",     // Same model for consistency
        REASONING: "xiaomi/mimo-v2-flash:free", // Same model for all tasks
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
