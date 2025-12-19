/**
 * Test Gemini API - Real AI Grading Demo
 * Run: npx tsx test-gemini.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' }); // Load env vars FIRST

import { gradeWithGemini, generateQuestionsWithGemini } from './src/lib/gemini-grading';

async function testGrading() {
    console.log('🤖 Testing Gemini 2.0 Flash AI Grading...\n');

    // Test Case 1: Grading a good answer
    console.log('📝 Test 1: Chấm bài Toán (Good Answer)');
    const mathResult = await gradeWithGemini(
        "Tính đạo hàm của hàm số f(x) = x³ + 2x² - 5x + 3",
        "f'(x) = 3x² + 4x - 5\n\nGiải thích:\n- Đạo hàm của x³ là 3x²\n- Đạo hàm của 2x² là 4x\n- Đạo hàm của -5x là -5\n- Đạo hàm của hằng số 3 là 0\n\nVậy f'(x) = 3x² + 4x - 5",
        "Rubric: Đáp án đúng (50%), Giải thích chi tiết (30%), Trình bày rõ ràng (20%)",
        100
    );

    console.log(`Score: ${mathResult.score}/100`);
    console.log(`Feedback: ${mathResult.feedback}`);
    console.log(`Strengths: ${mathResult.strengths.join(', ')}`);
    console.log(`Improvements: ${mathResult.improvements.join(', ')}\n`);

    // Test Case 2: Grading a poor answer
    console.log('📝 Test 2: Chấm bài Văn (Weak Answer)');
    const literatureResult = await gradeWithGemini(
        "Phân tích hình ảnh người lái đò trong bài thơ 'Đò lèn' của Trần Tế Xương",
        "Người lái đò rất nghèo. Anh ta làm việc cực khổ.",
        "Rubric: Phân tích hình ảnh (40%), Nghệ thuật miêu tả (30%), Ý nghĩa (30%)",
        100
    );

    console.log(`Score: ${literatureResult.score}/100`);
    console.log(`Feedback: ${literatureResult.feedback}`);
    console.log(`Improvements: ${literatureResult.improvements.join(', ')}\n`);

    // Test Case 3: Generate Questions
    console.log('🎯 Test 3: Tạo câu hỏi về Lịch sử');
    const questions = await generateQuestionsWithGemini(
        "Chiến tranh Việt Nam",
        "Lớp 12",
        3,
        'medium'
    );

    questions.forEach((q, i) => {
        console.log(`\nCâu ${i + 1}: ${q.question}`);
        console.log(`Rubric: ${q.rubric}`);
        console.log(`Max Score: ${q.maxScore}`);
    });

    console.log('\n✅ All tests completed!');
}

testGrading().catch(console.error);
