import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize Groq Client
// Note: SDK automatically searches for GROQ_API_KEY in process.env
// Initialize Groq Client
// Note: SDK automatically searches for GROQ_API_KEY in process.env

// Update to active model (Llama 3.3 70B Versatile is the current standard)
// Update to active model as requested
const MODEL_ID = "openai/gpt-oss-20b";

export async function POST(request: Request) {
    try {
        // 1. Validate API Key Existence
        if (!process.env.GROQ_API_KEY) {
            console.error("Missing GROQ_API_KEY environment variable.");
            return NextResponse.json(
                { error: "Server Configuration Error: Missing API Key" },
                { status: 500 }
            );
        }

        // 2. Parse & Validate Request Body
        const body = await request.json().catch(() => null);

        if (!body || typeof body.message !== 'string' || !body.message.trim()) {
            return NextResponse.json(
                { error: "Invalid input: 'message' field is required and must be a non-empty string." },
                { status: 400 }
            );
        }

        const { message } = body;

        // 3. Call Groq API
        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Bạn là trợ lý học tập cho học sinh. Hãy trả lời ngắn gọn, dễ hiểu và khuyến khích tư duy."
                },
                {
                    role: "user",
                    content: message
                }
            ],
            model: MODEL_ID,
            temperature: 0.7,
            max_tokens: 2048, // Adjusted for typical chat feature needs
        });

        // 4. Extract Reply
        const reply = completion.choices[0]?.message?.content || "";

        if (!reply) {
            throw new Error("Empty response from AI Provider");
        }

        // 5. Return Success Response
        return NextResponse.json({ reply });

    } catch (error: any) {
        console.error("[Groq API Error]:", error);

        // Handle specific Groq errors if possible, otherwise generic 500
        if (error?.status === 429) {
            return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
        }

        if (error?.status === 401) {
            return NextResponse.json({ error: "Unauthorized. Invalid API Key." }, { status: 401 });
        }

        return NextResponse.json(
            { error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
