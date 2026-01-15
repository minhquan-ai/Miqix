import { NextResponse } from 'next/server';
import { AICore } from '@/lib/ai/core';
import { AI_CONFIG } from '@/lib/ai/config';

export async function POST(request: Request) {
    try {
        const { text } = await request.json();

        if (!text || typeof text !== 'string') {
            return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 });
        }

        const systemPrompt = `Bạn là một chuyên gia chuyển đổi ngôn ngữ tự nhiên tiếng Việt sang công thức LaTeX.

Quy tắc:
1. Chỉ trả về mã LaTeX thuần túy, KHÔNG có ký tự $ bao quanh
2. Không giải thích, chỉ trả về công thức
3. Sử dụng cú pháp LaTeX chuẩn
4. Nếu không hiểu, trả về văn bản gốc

Ví dụ:
- "x bình phương" → x^2
- "căn bậc 2 của x" → \\sqrt{x}
- "phân số a trên b" → \\frac{a}{b}
- "tích phân từ 0 đến 1 của x bình phương" → \\int_0^1 x^2 dx`;

        const response = await AICore.generateText(text, {
            systemPrompt: systemPrompt,
            model: AI_CONFIG.models.FAST,
            temperature: 0.3,
            maxTokens: 256
        });

        if (response.error) {
            throw new Error(response.error);
        }

        const latex = response.text.trim() || text;

        return NextResponse.json({ latex });
    } catch (error) {
        console.error('Math convert error:', error);

        // Fallback: Basic string replacement
        const { text } = await request.json().catch(() => ({ text: '' }));
        let result = text
            .replace(/bình phương/gi, "^2")
            .replace(/lập phương/gi, "^3")
            .replace(/mũ (\d+)/gi, "^{$1}")
            .replace(/căn( bậc 2)?( của)?/gi, "\\sqrt{")
            .replace(/phân số (\w+) trên (\w+)/gi, "\\frac{$1}{$2}")
            .replace(/pi/gi, "\\pi")
            .replace(/vô cực/gi, "\\infty")
            .replace(/tích phân/gi, "\\int")
            .replace(/đạo hàm/gi, "\\frac{d}{dx}")
            .replace(/sin/gi, "\\sin")
            .replace(/cos/gi, "\\cos")
            .replace(/tan/gi, "\\tan");

        return NextResponse.json({ latex: result });
    }
}
