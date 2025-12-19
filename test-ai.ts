/**
 * Test Gemini AI Integration
 * Run: npx tsx test-ai.ts
 */

async function testGeminiAI() {
    try {
        console.log('🤖 Testing Gemini AI...\n');

        // Import the Gemini AI service
        const { geminiAI } = await import('./src/lib/gemini-ai');

        // Test 1: Simple text generation
        console.log('Test 1: Simple Text Generation');
        console.log('--------------------------------');
        const response = await geminiAI.generateText('Chào bạn! Hãy giới thiệu bản thân bằng 1-2 câu.');
        console.log('Response:', response);
        console.log('\n');

        // Test 2: Analyze class performance
        console.log('Test 2: Analyze Class Performance');
        console.log('-----------------------------------');
        const analysis = await geminiAI.analyzeClassPerformance({
            className: '10A2',
            averageScore: 7.35,
            submissionRate: 85,
            atRiskStudents: 5,
            recentAssignments: [
                { title: 'Đạo hàm cơ bản', avgScore: 8.2 },
                { title: 'Tích phân', avgScore: 5.2 },
                { title: 'Ứng dụng đạo hàm', avgScore: 7.8 }
            ]
        });
        console.log('Analysis:', JSON.stringify(analysis, null, 2));
        console.log('\n');

        // Test 3: Socratic tutoring
        console.log('Test 3: Socratic Tutoring');
        console.log('-------------------------');
        const tutorResponse = await geminiAI.tutorStudent({
            question: 'Tính đạo hàm của y = x^2 + 3x',
            topic: 'Đạo hàm',
            studentMessage: 'Em không biết làm câu này'
        });
        console.log('Tutor Response:', tutorResponse);
        console.log('\n');

        // Test 4: Predict performance
        console.log('Test 4: Predict Student Performance');
        console.log('------------------------------------');
        const prediction = await geminiAI.predictPerformance({
            studentName: 'Nguyễn Văn A',
            currentAvg: 7.5,
            submissionRate: 90,
            attendanceRate: 95,
            recentScores: [8.0, 7.5, 8.5, 7.0, 8.0]
        });
        console.log('Prediction:', JSON.stringify(prediction, null, 2));
        console.log('\n');

        console.log('✅ All tests completed successfully!');
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testGeminiAI();
