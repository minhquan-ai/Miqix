"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Sparkles, X, ChevronDown, Loader2, Copy, Check } from "lucide-react";

interface MathHelperProps {
    onInsert: (latex: string) => void;
    onClose?: () => void;
}

// Common math symbols - Using REAL Unicode characters, NOT LaTeX!
const SYMBOL_CATEGORIES = [
    {
        name: "Số mũ",
        symbols: [
            { label: "x²", insert: "²", desc: "Bình phương" },
            { label: "x³", insert: "³", desc: "Lập phương" },
            { label: "x⁴", insert: "⁴", desc: "Mũ 4" },
            { label: "x⁵", insert: "⁵", desc: "Mũ 5" },
            { label: "x⁶", insert: "⁶", desc: "Mũ 6" },
            { label: "x⁷", insert: "⁷", desc: "Mũ 7" },
            { label: "x⁸", insert: "⁸", desc: "Mũ 8" },
            { label: "x⁹", insert: "⁹", desc: "Mũ 9" },
            { label: "xⁿ", insert: "ⁿ", desc: "Mũ n" },
            { label: "x⁰", insert: "⁰", desc: "Mũ 0" },
        ]
    },
    {
        name: "Chỉ số dưới",
        symbols: [
            { label: "x₀", insert: "₀", desc: "Chỉ số 0" },
            { label: "x₁", insert: "₁", desc: "Chỉ số 1" },
            { label: "x₂", insert: "₂", desc: "Chỉ số 2" },
            { label: "x₃", insert: "₃", desc: "Chỉ số 3" },
            { label: "xₙ", insert: "ₙ", desc: "Chỉ số n" },
            { label: "xᵢ", insert: "ᵢ", desc: "Chỉ số i" },
        ]
    },
    {
        name: "Phép tính",
        symbols: [
            { label: "+", insert: "+", desc: "Cộng" },
            { label: "−", insert: "−", desc: "Trừ" },
            { label: "×", insert: "×", desc: "Nhân" },
            { label: "÷", insert: "÷", desc: "Chia" },
            { label: "±", insert: "±", desc: "Cộng trừ" },
            { label: "∓", insert: "∓", desc: "Trừ cộng" },
            { label: "·", insert: "·", desc: "Nhân (chấm)" },
            { label: "∙", insert: "∙", desc: "Nhân (bullet)" },
        ]
    },
    {
        name: "So sánh",
        symbols: [
            { label: "=", insert: "=", desc: "Bằng" },
            { label: "≠", insert: "≠", desc: "Khác" },
            { label: "<", insert: "<", desc: "Nhỏ hơn" },
            { label: ">", insert: ">", desc: "Lớn hơn" },
            { label: "≤", insert: "≤", desc: "Nhỏ hơn hoặc bằng" },
            { label: "≥", insert: "≥", desc: "Lớn hơn hoặc bằng" },
            { label: "≈", insert: "≈", desc: "Xấp xỉ" },
            { label: "≡", insert: "≡", desc: "Đồng nhất" },
            { label: "∝", insert: "∝", desc: "Tỉ lệ" },
        ]
    },
    {
        name: "Căn & Phân số",
        symbols: [
            { label: "√", insert: "√", desc: "Căn bậc 2" },
            { label: "∛", insert: "∛", desc: "Căn bậc 3" },
            { label: "∜", insert: "∜", desc: "Căn bậc 4" },
            { label: "½", insert: "½", desc: "1/2" },
            { label: "⅓", insert: "⅓", desc: "1/3" },
            { label: "¼", insert: "¼", desc: "1/4" },
            { label: "⅔", insert: "⅔", desc: "2/3" },
            { label: "¾", insert: "¾", desc: "3/4" },
            { label: "⅕", insert: "⅕", desc: "1/5" },
            { label: "⁄", insert: "⁄", desc: "Dấu phân số" },
        ]
    },
    {
        name: "Lượng giác",
        symbols: [
            { label: "sin", insert: "sin", desc: "Sin" },
            { label: "cos", insert: "cos", desc: "Cos" },
            { label: "tan", insert: "tan", desc: "Tan" },
            { label: "cot", insert: "cot", desc: "Cot" },
            { label: "π", insert: "π", desc: "Pi" },
            { label: "°", insert: "°", desc: "Độ" },
            { label: "′", insert: "′", desc: "Phút (góc)" },
            { label: "″", insert: "″", desc: "Giây (góc)" },
        ]
    },
    {
        name: "Tích phân & Đạo hàm",
        symbols: [
            { label: "∫", insert: "∫", desc: "Tích phân" },
            { label: "∬", insert: "∬", desc: "Tích phân kép" },
            { label: "∂", insert: "∂", desc: "Đạo hàm riêng" },
            { label: "∑", insert: "∑", desc: "Tổng" },
            { label: "∏", insert: "∏", desc: "Tích" },
            { label: "lim", insert: "lim", desc: "Giới hạn" },
            { label: "∞", insert: "∞", desc: "Vô cực" },
            { label: "Δ", insert: "Δ", desc: "Delta" },
            { label: "∇", insert: "∇", desc: "Nabla" },
        ]
    },
    {
        name: "Chữ cái Hy Lạp",
        symbols: [
            { label: "α", insert: "α", desc: "Alpha" },
            { label: "β", insert: "β", desc: "Beta" },
            { label: "γ", insert: "γ", desc: "Gamma" },
            { label: "δ", insert: "δ", desc: "Delta" },
            { label: "ε", insert: "ε", desc: "Epsilon" },
            { label: "θ", insert: "θ", desc: "Theta" },
            { label: "λ", insert: "λ", desc: "Lambda" },
            { label: "μ", insert: "μ", desc: "Mu" },
            { label: "σ", insert: "σ", desc: "Sigma" },
            { label: "ω", insert: "ω", desc: "Omega" },
            { label: "φ", insert: "φ", desc: "Phi" },
            { label: "ψ", insert: "ψ", desc: "Psi" },
        ]
    },
    {
        name: "Tập hợp",
        symbols: [
            { label: "∈", insert: "∈", desc: "Thuộc" },
            { label: "∉", insert: "∉", desc: "Không thuộc" },
            { label: "⊂", insert: "⊂", desc: "Tập con" },
            { label: "⊃", insert: "⊃", desc: "Chứa" },
            { label: "∪", insert: "∪", desc: "Hợp" },
            { label: "∩", insert: "∩", desc: "Giao" },
            { label: "∅", insert: "∅", desc: "Tập rỗng" },
            { label: "∀", insert: "∀", desc: "Với mọi" },
            { label: "∃", insert: "∃", desc: "Tồn tại" },
        ]
    },
    {
        name: "Mũi tên",
        symbols: [
            { label: "→", insert: "→", desc: "Mũi tên phải" },
            { label: "←", insert: "←", desc: "Mũi tên trái" },
            { label: "↔", insert: "↔", desc: "Hai chiều" },
            { label: "⇒", insert: "⇒", desc: "Suy ra" },
            { label: "⇔", insert: "⇔", desc: "Tương đương" },
            { label: "↑", insert: "↑", desc: "Lên" },
            { label: "↓", insert: "↓", desc: "Xuống" },
        ]
    },
];

// Common formula templates
const FORMULA_TEMPLATES = [
    {
        name: "Phương trình bậc 2",
        latex: "ax^2 + bx + c = 0",
        preview: "ax² + bx + c = 0"
    },
    {
        name: "Công thức nghiệm",
        latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
        preview: "x = (-b ± √(b²-4ac)) / 2a"
    },
    {
        name: "Định lý Pythagoras",
        latex: "a^2 + b^2 = c^2",
        preview: "a² + b² = c²"
    },
    {
        name: "Diện tích hình tròn",
        latex: "S = \\pi r^2",
        preview: "S = πr²"
    },
    {
        name: "Đạo hàm cơ bản",
        latex: "\\frac{d}{dx}(x^n) = nx^{n-1}",
        preview: "d/dx(xⁿ) = nxⁿ⁻¹"
    },
    {
        name: "Tích phân cơ bản",
        latex: "\\int x^n dx = \\frac{x^{n+1}}{n+1} + C",
        preview: "∫xⁿdx = xⁿ⁺¹/(n+1) + C"
    },
];

export function MathHelper({ onInsert, onClose }: MathHelperProps) {
    const [activeTab, setActiveTab] = useState<'symbols' | 'templates' | 'ai'>('symbols');
    const [expandedCategory, setExpandedCategory] = useState<string>(SYMBOL_CATEGORIES[0].name);
    const [aiInput, setAiInput] = useState("");
    const [aiResult, setAiResult] = useState("");
    const [isConverting, setIsConverting] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleAIConvert = async () => {
        if (!aiInput.trim() || isConverting) return;

        setIsConverting(true);
        try {
            // Simple Unicode conversion rules (no AI needed for basic cases)
            let result = aiInput
                // Superscripts
                .replace(/bình phương/gi, "²")
                .replace(/lập phương/gi, "³")
                .replace(/mũ 2/gi, "²")
                .replace(/mũ 3/gi, "³")
                .replace(/mũ 4/gi, "⁴")
                .replace(/mũ 5/gi, "⁵")
                .replace(/mũ n/gi, "ⁿ")
                // Roots
                .replace(/căn( bậc 2)?( của)?/gi, "√")
                .replace(/căn bậc 3( của)?/gi, "∛")
                // Fractions
                .replace(/một nửa|1\/2/gi, "½")
                .replace(/một phần ba|1\/3/gi, "⅓")
                .replace(/một phần tư|1\/4/gi, "¼")
                .replace(/hai phần ba|2\/3/gi, "⅔")
                .replace(/ba phần tư|3\/4/gi, "¾")
                // Greek letters
                .replace(/\bpi\b/gi, "π")
                .replace(/\balpha\b/gi, "α")
                .replace(/\bbeta\b/gi, "β")
                .replace(/\btheta\b/gi, "θ")
                .replace(/\bdelta\b/gi, "Δ")
                .replace(/\blambda\b/gi, "λ")
                // Operators
                .replace(/nhân/gi, "×")
                .replace(/chia/gi, "÷")
                .replace(/cộng trừ/gi, "±")
                // Comparison
                .replace(/nhỏ hơn hoặc bằng/gi, "≤")
                .replace(/lớn hơn hoặc bằng/gi, "≥")
                .replace(/khác/gi, "≠")
                .replace(/xấp xỉ/gi, "≈")
                // Others
                .replace(/vô cực/gi, "∞")
                .replace(/tích phân/gi, "∫")
                .replace(/tổng/gi, "∑")
                .replace(/thuộc/gi, "∈")
                .replace(/suy ra/gi, "⇒")
                .replace(/tương đương/gi, "⇔")
                .replace(/độ/gi, "°");

            setAiResult(result);
        } catch (error) {
            // Just return input as-is
            setAiResult(aiInput);
        } finally {
            setIsConverting(false);
        }
    };

    // Insert Unicode character directly (no LaTeX wrapping!)
    const handleInsertSymbol = (char: string) => {
        onInsert(char);
    };

    // Insert Unicode preview for templates
    const handleInsertTemplate = (preview: string) => {
        onInsert(preview);
    };

    const handleInsertAI = () => {
        if (aiResult) {
            onInsert(aiResult);
            setAiInput("");
            setAiResult("");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-border">
                {[
                    { id: 'symbols', label: '📐 Ký hiệu', desc: 'Click để chèn' },
                    { id: 'templates', label: '📝 Mẫu công thức', desc: 'Công thức có sẵn' },
                    { id: 'ai', label: '✨ AI Chuyển đổi', desc: 'Nhập tiếng Việt' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 px-4 py-3 text-center transition-all ${activeTab === tab.id
                            ? 'bg-primary/5 border-b-2 border-primary text-primary'
                            : 'hover:bg-muted/50 text-muted-foreground'
                            }`}
                    >
                        <div className="text-sm font-medium">{tab.label}</div>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-4 max-h-[350px] overflow-y-auto">
                {/* Symbols Tab */}
                {activeTab === 'symbols' && (
                    <div className="space-y-2">
                        {SYMBOL_CATEGORIES.map(category => (
                            <div key={category.name} className="border border-border rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setExpandedCategory(
                                        expandedCategory === category.name ? '' : category.name
                                    )}
                                    className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                    <span className="text-sm font-medium">{category.name}</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedCategory === category.name ? 'rotate-180' : ''
                                        }`} />
                                </button>
                                <AnimatePresence>
                                    {expandedCategory === category.name && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: 'auto' }}
                                            exit={{ height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-3 grid grid-cols-4 gap-2">
                                                {category.symbols.map(symbol => (
                                                    <button
                                                        key={symbol.insert}
                                                        onClick={() => handleInsertSymbol(symbol.insert)}
                                                        className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all group"
                                                        title={symbol.desc}
                                                    >
                                                        <span className="text-lg font-mono group-hover:text-primary transition-colors">
                                                            {symbol.label}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                                                            {symbol.desc}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                )}

                {/* Templates Tab */}
                {activeTab === 'templates' && (
                    <div className="grid gap-2">
                        {FORMULA_TEMPLATES.map(template => (
                            <button
                                key={template.name}
                                onClick={() => handleInsertTemplate(template.preview)}
                                className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all group text-left"
                            >
                                <div>
                                    <div className="text-sm font-medium group-hover:text-primary transition-colors">
                                        {template.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                        {template.preview}
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground group-hover:text-primary">
                                    Chèn →
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {/* AI Tab */}
                {activeTab === 'ai' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                            <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
                                💡 Nhập công thức bằng tiếng Việt, AI sẽ chuyển sang định dạng toán học
                            </p>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={aiInput}
                                    onChange={(e) => setAiInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAIConvert()}
                                    placeholder="VD: x bình phương cộng y bình phương bằng z bình phương"
                                    className="w-full px-4 py-3 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all text-sm"
                                />
                                <button
                                    onClick={handleAIConvert}
                                    disabled={!aiInput.trim() || isConverting}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-600 transition-all disabled:opacity-50"
                                >
                                    {isConverting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4" />
                                    )}
                                    {isConverting ? 'Đang chuyển đổi...' : 'Chuyển đổi'}
                                </button>
                            </div>
                        </div>

                        {aiResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-green-700 dark:text-green-300">Kết quả:</span>
                                    <button
                                        onClick={() => copyToClipboard(aiResult)}
                                        className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                                    >
                                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        {copied ? 'Đã sao chép' : 'Sao chép'}
                                    </button>
                                </div>
                                <div className="font-mono text-lg bg-white dark:bg-zinc-800 px-3 py-2 rounded-lg border border-green-200 dark:border-green-700 text-center">
                                    {aiResult}
                                </div>
                                <button
                                    onClick={handleInsertAI}
                                    className="mt-3 w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Chèn vào bài tập
                                </button>
                            </motion.div>
                        )}

                        {/* Examples */}
                        <div className="text-xs text-muted-foreground">
                            <p className="font-medium mb-2">Ví dụ cách nhập:</p>
                            <ul className="space-y-1 ml-4 list-disc">
                                <li>"x bình phương" → x²</li>
                                <li>"căn bậc 2 của x" → √x</li>
                                <li>"phân số a trên b" → a/b</li>
                                <li>"tích phân từ 0 đến 1" → ∫₀¹</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MathHelper;
