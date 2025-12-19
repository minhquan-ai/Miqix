import { useState } from "react";
import { AIService, QuizQuestion } from "@/lib/ai-service";
import { Sparkles, Loader2, Check, RefreshCw, X, Zap, Target, BrainCircuit, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AIQuizGeneratorProps {
    onAccept: (questions: QuizQuestion[]) => void;
    onCancel: () => void;
}

export function AIQuizGenerator({ onAccept, onCancel }: AIQuizGeneratorProps) {
    const [topic, setTopic] = useState("");
    const [questionCount, setQuestionCount] = useState(5);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>([]);
    const [step, setStep] = useState<'input' | 'review'>('input');

    const handleGenerate = async () => {
        if (!topic.trim()) return;

        setIsGenerating(true);
        try {
            const questions = await AIService.generateQuiz({
                topic,
                difficulty,
                questionCount
            });
            setGeneratedQuestions(questions);
            setStep('review');
        } catch (error) {
            console.error("AI Error:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    if (step === 'input') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white border border-gray-200 rounded-2xl shadow-lg max-w-lg mx-auto mt-4"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Groq AI Quiz Generator</h3>
                            <p className="text-xs text-gray-500">Tạo câu hỏi trắc nghiệm tự động</p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-5 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                            <Target className="w-4 h-4" />
                            Chủ đề
                        </label>
                        <input
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="VD: Đạo hàm, Chiến tranh thế giới thứ 2..."
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                <Zap className="w-4 h-4" />
                                Số lượng
                            </label>
                            <select
                                value={questionCount}
                                onChange={(e) => setQuestionCount(Number(e.target.value))}
                                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white cursor-pointer"
                            >
                                <option value={3}>3 câu</option>
                                <option value={5}>5 câu</option>
                                <option value={10}>10 câu</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                <BrainCircuit className="w-4 h-4" />
                                Độ khó
                            </label>
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white cursor-pointer"
                            >
                                <option value="easy">Dễ</option>
                                <option value="medium">Trung bình</option>
                                <option value="hard">Khó</option>
                            </select>
                        </div>
                    </div>

                    <motion.button
                        onClick={handleGenerate}
                        disabled={!topic.trim() || isGenerating}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full h-11 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Đang tạo...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                <span>Tạo câu hỏi</span>
                            </>
                        )}
                    </motion.button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-2xl shadow-lg max-w-3xl mx-auto mt-4"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Kết quả từ AI</h3>
                        <p className="text-sm text-gray-500">
                            {generatedQuestions.length} câu hỏi về <span className="font-medium">"{topic}"</span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setStep('input')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Tạo lại"
                    >
                        <RefreshCw className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Questions List */}
            <div className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
                {generatedQuestions.map((q, idx) => (
                    <motion.div
                        key={q.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
                    >
                        <div className="font-medium text-gray-900 mb-3 flex gap-2">
                            <span className="text-indigo-600 font-bold">#{idx + 1}</span>
                            <span>{q.question}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-6">
                            {q.options.map((opt, i) => (
                                <div
                                    key={i}
                                    className={`px-3 py-2 rounded-lg text-sm transition-all ${i === q.correctAnswer
                                            ? 'bg-green-50 border border-green-200 text-green-800 font-medium'
                                            : 'bg-gray-50 border border-gray-200 text-gray-700'
                                        }`}
                                >
                                    <span className="text-xs opacity-60 mr-1.5">{String.fromCharCode(65 + i)}.</span>
                                    {opt}
                                </div>
                            ))}
                        </div>

                        {q.explanation && (
                            <div className="mt-3 ml-6 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-900">
                                <div className="flex gap-2">
                                    <span>💡</span>
                                    <div>
                                        <div className="font-medium text-xs text-blue-700 mb-0.5">Giải thích</div>
                                        <div className="text-blue-800">{q.explanation}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 border-t border-gray-100">
                <button
                    onClick={onCancel}
                    className="flex-1 h-10 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                    Hủy
                </button>
                <button
                    onClick={() => onAccept(generatedQuestions)}
                    className="flex-[2] h-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                    <span>Sử dụng {generatedQuestions.length} câu hỏi này</span>
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}
