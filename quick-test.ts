/**
 * Quick test với hardcoded key
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBxwZ2VvtqlnLc9_YBuiNYSSFADRRwyocs";
const genAI = new GoogleGenerativeAI(API_KEY);

async function quickTest() {
    console.log('Testing with hardcoded key...\n');

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent("Chấm điểm bài văn: 'Cây xanh rất đẹp'. Cho điểm 0-100 và giải thích ngắn.");

    console.log(result.response.text());
}

quickTest().catch(console.error);
