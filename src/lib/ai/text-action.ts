'use server';

export async function processTextWithAIAction(text: string, command: 'rewrite' | 'grammar' | 'shorter' | 'longer'): Promise<{ success: boolean; result?: string; message?: string }> {
    // Simulator delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock AI Logic
    try {
        if (!text || text.trim().length === 0) {
            return { success: false, message: "Vui lòng chọn văn bản." };
        }

        let result = text;

        switch (command) {
            case 'rewrite':
                result = `[Viết lại]: ${text} (Đã được trau chuốt hơn)`;
                break;
            case 'grammar':
                result = text; // Assume correct if mocking
                break;
            case 'shorter':
                result = text.substring(0, Math.floor(text.length * 0.7)) + "...";
                break;
            case 'longer':
                result = text + " (Bổ sung thêm chi tiết để làm rõ ý nghĩa hơn...)";
                break;
        }

        return { success: true, result };
    } catch (error) {
        console.error("AI Process Error:", error);
        return { success: false, message: "Lỗi xử lý AI." };
    }
}
