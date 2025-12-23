import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

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
- "tích phân từ 0 đến 1 của x bình phương" → \\int_0^1 x^2 dx
- "đạo hàm của x lập phương" → \\frac{d}{dx}(x^3)
- "sin của 30 độ" → \\sin(30^\\circ)`;

        const userPrompt = `Chuyển đổi sang LaTeX: "${text}"`;

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 256,
        });

        const latex = completion.choices[0]?.message?.content?.trim() || text;

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
