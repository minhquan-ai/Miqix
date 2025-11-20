import { useState } from "react";
import { AIService, QuizQuestion } from "@/lib/ai-service";
import { Sparkles, Loader2, Check, RefreshCw, X } from "lucide-react";

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
            <div className="bg-card border border-border rounded-xl p-6 shadow-lg max-w-md mx-auto animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        AI Quiz Generator
                    </h3>
                    <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Chủ đề / Nội dung</label>
                        <input
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="VD: Đạo hàm, Chiến tranh thế giới thứ 2..."
                            className="w-full p-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Số lượng câu</label>
                            <select
                                value={questionCount}
                                onChange={(e) => setQuestionCount(Number(e.target.value))}
                                className="w-full p-2 rounded-md border border-input bg-background"
                            >
                                <option value={3}>3 câu</option>
                                <option value={5}>5 câu</option>
                                <option value={10}>10 câu</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Độ khó</label>
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                                className="w-full p-2 rounded-md border border-input bg-background"
                            >
                                <option value="easy">Cơ bản</option>
                                <option value="medium">Trung bình</option>
                                <option value="hard">Nâng cao</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={!topic.trim() || isGenerating}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                AI đang suy nghĩ...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Tạo câu hỏi ngay
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-500" />
                        Kết quả từ AI
                    </h3>
                    <p className="text-sm text-muted-foreground">Đã tạo {generatedQuestions.length} câu hỏi về "{topic}"</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setStep('input')}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                        title="Tạo lại"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 mb-6">
                {generatedQuestions.map((q, idx) => (
                    <div key={q.id} className="p-4 bg-muted/30 rounded-lg border border-border">
                        <div className="font-medium mb-2 flex gap-2">
                            <span className="text-primary">Câu {idx + 1}:</span>
                            {q.question}
                        </div>
                        <div className="grid grid-cols-2 gap-2 pl-4">
                            {q.options.map((opt, i) => (
                                <div key={i} className={`text-sm p-2 rounded ${i === q.correctAnswer ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-background border border-border'}`}>
                                    {String.fromCharCode(65 + i)}. {opt}
                                </div>
                            ))}
                        </div>
                        {q.explanation && (
                            <div className="mt-2 text-xs text-muted-foreground italic bg-yellow-50 p-2 rounded border border-yellow-100">
                                💡 Giải thích: {q.explanation}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                    Hủy bỏ
                </button>
                <button
                    onClick={() => onAccept(generatedQuestions)}
                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                    Sử dụng {generatedQuestions.length} câu hỏi này
                </button>
            </div>
        </div>
    );
}
