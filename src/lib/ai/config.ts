export const AI_CONFIG = {
    provider: 'openrouter',
    apiKey: process.env.OPENROUTER_API_KEY,
    models: {
        // Primary models - Nvidia Nemotron 120B as requested
        FAST: "nvidia/nemotron-3-super-120b-a12b:free",
        SMART: "nvidia/nemotron-3-super-120b-a12b:free",
        REASONING: "nvidia/nemotron-3-super-120b-a12b:free",
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
